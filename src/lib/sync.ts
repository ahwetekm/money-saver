import {
  db,
  entityTables,
  getPendingSyncQueue,
  removeSyncQueueItem,
  incrementRetry,
  clearSyncQueue,
  bulkPutLocal,
  type SyncQueueItem,
  type SyncOperation,
} from './db';
import * as api from './api';
import { flushPendingUserUpdate } from './offlineApi';

// ─── Network Status ───
let _isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

export function isOnline() {
  return _isOnline;
}

export function listenNetworkChanges(callback: (online: boolean) => void) {
  const onOnline = () => {
    _isOnline = true;
    callback(true);
    triggerBackgroundSync();
  };
  const onOffline = () => {
    _isOnline = false;
    callback(false);
  };

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

// ─── Sync Engine ───

let _syncInProgress = false;

export function isSyncing() {
  return _syncInProgress;
}

export async function triggerBackgroundSync() {
  if (_syncInProgress || !_isOnline) return;
  _syncInProgress = true;

  try {
    // Flush any pending user profile updates first
    await flushPendingUserUpdate();

    const queue = await getPendingSyncQueue();
    for (const item of queue) {
      const success = await processSyncItem(item);
      if (success) {
        await removeSyncQueueItem(item.id!);
      } else {
        // Stop processing if an item fails to preserve order
        break;
      }
    }
  } finally {
    _syncInProgress = false;
  }
}

async function processSyncItem(item: SyncQueueItem): Promise<boolean> {
  try {
    await executeRemoteOperation(item.entity, item.operation, item.payload);
    // Mark local record as synced
    const table = entityTables[item.entity];
    if (table && item.operation !== 'delete') {
      const record = await table.get(item.payload.id);
      if (record) {
        await table.put({ ...record, syncedAt: Date.now() });
      }
    }
    return true;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    await incrementRetry(item.id!, errorMsg);
    // If retried too many times, drop it to prevent infinite loop
    if (item.retryCount >= 4) {
      console.warn(`[Sync] Dropping queue item after 5 retries:`, item);
      return true; // remove from queue
    }
    return false;
  }
}

async function executeRemoteOperation(entity: string, operation: SyncOperation, payload: any) {
  switch (entity) {
    case 'transactions':
      if (operation === 'create') await api.createTransaction(payload);
      else if (operation === 'update') await api.updateTransaction(payload);
      else if (operation === 'delete') await api.deleteTransaction(payload.id);
      break;
    case 'budgets':
      if (operation === 'create') await api.createBudget(payload);
      else if (operation === 'update') await api.updateBudget(payload);
      else if (operation === 'delete') await api.deleteBudget(payload.id);
      break;
    case 'portfolio':
      if (operation === 'create') await api.createPortfolioItem(payload);
      else if (operation === 'update') await api.updatePortfolioItem(payload);
      else if (operation === 'delete') await api.deletePortfolioItem(payload.id);
      break;
    case 'goals':
      if (operation === 'create') await api.createGoal(payload);
      else if (operation === 'update') await api.updateGoal(payload);
      else if (operation === 'delete') await api.deleteGoal(payload.id);
      break;
    case 'subscriptions':
      if (operation === 'create') await api.createSubscription(payload);
      else if (operation === 'update') await api.updateSubscription(payload);
      else if (operation === 'delete') await api.deleteSubscription(payload.id);
      break;
    case 'delayedGratifications':
      if (operation === 'create') await api.createDelayedGratification(payload);
      else if (operation === 'update') await api.updateDelayedGratification(payload);
      else if (operation === 'delete') await api.deleteDelayedGratification(payload.id);
      break;
    case 'settings':
      if (operation === 'create' || operation === 'update') {
        await api.updateSettings(payload);
      }
      break;
    default:
      throw new Error(`Unknown entity: ${entity}`);
  }
}

// ─── Full Sync (Pull from remote) ───

export async function pullAllFromRemote() {
  if (!_isOnline) return;

  const [
    transactions,
    budgets,
    portfolio,
    goals,
    subscriptions,
    delayedGratifications,
    settings,
  ] = await Promise.all([
    api.fetchTransactions().catch(() => []),
    api.fetchBudgets().catch(() => []),
    api.fetchPortfolio().catch(() => []),
    api.fetchGoals().catch(() => []),
    api.fetchSubscriptions().catch(() => []),
    api.fetchDelayedGratifications().catch(() => []),
    api.fetchSettings().catch(() => null),
  ]);

  const now = Date.now();

  // Merge with local data using Last-Write-Wins
  await mergeRemoteRecords('transactions', transactions, now);
  await mergeRemoteRecords('budgets', budgets, now);
  await mergeRemoteRecords('portfolio', portfolio, now);
  await mergeRemoteRecords('goals', goals, now);
  await mergeRemoteRecords('subscriptions', subscriptions, now);
  await mergeRemoteRecords('delayedGratifications', delayedGratifications, now);

  if (settings) {
    const table = entityTables.settings;
    const localSettings = await table.toArray();
    const local = localSettings[0];
    const remoteUpdatedAt = now; // server doesn't send timestamps, treat as fresh
    if (!local || (local.syncedAt && local.syncedAt < remoteUpdatedAt)) {
      await table.put({
        ...(local || {}),
        ...settings,
        id: local?.id || 'settings',
        updatedAt: now,
        syncedAt: now,
      });
    }
  }
}

async function mergeRemoteRecords(entity: string, remoteRecords: any[], now: number) {
  const table = entityTables[entity];
  if (!table) return;

  for (const remote of remoteRecords) {
    const local = await table.get(remote.id);
    // If local has unsynced changes (updatedAt > syncedAt), keep local (LWW)
    if (local && local.updatedAt && local.syncedAt && local.updatedAt > local.syncedAt) {
      continue;
    }
    // Otherwise overwrite with remote
    await table.put({
      ...(local || {}),
      ...remote,
      updatedAt: now,
      syncedAt: now,
    });
  }
}

// ─── Reset ───

export async function resetLocalData() {
  await clearSyncQueue();
  await db.transactions.clear();
  await db.budgets.clear();
  await db.portfolio.clear();
  await db.goals.clear();
  await db.subscriptions.clear();
  await db.delayedGratifications.clear();
  await db.settings.clear();
}
