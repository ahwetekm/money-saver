import {
  db,
  entityTables,
  getPendingSyncQueue,
  removeSyncQueueItem,
  incrementRetry,
  clearSyncQueue,
  type SyncQueueItem,
  type SyncOperation,
  type LocalRecord,
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

// ─── Periodic Sync Retry ───
let _periodicSyncInterval: ReturnType<typeof setInterval> | null = null;

export function startPeriodicSync(intervalMs = 10000) {
  if (_periodicSyncInterval) return;
  _periodicSyncInterval = setInterval(() => {
    if (_isOnline && !_syncInProgress) {
      triggerBackgroundSync();
    }
  }, intervalMs);
}

export function stopPeriodicSync() {
  if (_periodicSyncInterval) {
    clearInterval(_periodicSyncInterval);
    _periodicSyncInterval = null;
  }
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
    // Flush any pending user profile updates first (don't let it crash sync)
    try {
      await flushPendingUserUpdate();
    } catch (e) {
      console.warn('[Sync] flushPendingUserUpdate failed:', e);
    }

    const queue = await getPendingSyncQueue();
    console.log(`[Sync] Processing ${queue.length} queued items`);

    for (const item of queue) {
      const success = await processSyncItem(item);
      if (success) {
        await removeSyncQueueItem(item.id!);
        console.log(`[Sync] ✅ ${item.operation} ${item.entity}/${item.payload.id || item.payload.id}`);
      } else {
        // Refresh item from DB to get updated retryCount
        const refreshed = await db.syncQueue.get(item.id!);
        if (refreshed && refreshed.retryCount >= 5) {
          console.warn(`[Sync] Dropping queue item after 5 retries:`, refreshed);
          await removeSyncQueueItem(item.id!);
        } else {
          console.log(`[Sync] ⏸️ Paused at ${item.operation} ${item.entity} (retry ${refreshed?.retryCount ?? item.retryCount})`);
          // Stop processing to preserve order, but schedule a retry
          break;
        }
      }
    }
  } catch (err) {
    console.error('[Sync] Unexpected sync error:', err);
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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Sync] ❌ Failed ${item.operation} ${item.entity}:`, errorMsg);
    await incrementRetry(item.id!, errorMsg);
    return false;
  }
}

async function executeRemoteOperation(entity: string, operation: SyncOperation, payload: Record<string, unknown>) {
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
    api.fetchTransactions().catch((e) => { console.warn('[Sync] fetchTransactions failed:', e); return []; }),
    api.fetchBudgets().catch((e) => { console.warn('[Sync] fetchBudgets failed:', e); return []; }),
    api.fetchPortfolio().catch((e) => { console.warn('[Sync] fetchPortfolio failed:', e); return []; }),
    api.fetchGoals().catch((e) => { console.warn('[Sync] fetchGoals failed:', e); return []; }),
    api.fetchSubscriptions().catch((e) => { console.warn('[Sync] fetchSubscriptions failed:', e); return []; }),
    api.fetchDelayedGratifications().catch((e) => { console.warn('[Sync] fetchDelayedGratifications failed:', e); return []; }),
    api.fetchSettings().catch((e) => { console.warn('[Sync] fetchSettings failed:', e); return null; }),
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
    const remoteUpdatedAt = now;
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

async function mergeRemoteRecords(entity: string, remoteRecords: LocalRecord[], now: number) {
  const table = entityTables[entity];
  if (!table) return;

  const remoteIds = new Set(remoteRecords.map(r => r.id));

  // Mark local records as deleted if they don't exist in remote
  const allLocal = await table.toArray();
  for (const local of allLocal) {
    if (!local.isDeleted && !remoteIds.has(local.id)) {
      await table.put({ ...local, isDeleted: true, updatedAt: now, syncedAt: now });
    }
  }

  // Merge remote records with local
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
