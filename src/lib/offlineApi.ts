/**
 * Offline-First API Layer
 * 
 * This module wraps the original API calls with local IndexedDB caching
 * and background sync. It is a drop-in replacement for `src/lib/api.ts`.
 * 
 * Rules:
 * - Reads always come from local DB (instant, works offline)
 * - Writes go to local DB immediately, then queue for remote sync
 * - If online, remote sync is attempted immediately in the background
 * - If offline, mutations are queued and flushed when connectivity returns
 * - Conflict resolution: Last-Write-Wins (local unsynced changes win over remote)
 */

import {
  getAllLocal,
  putLocal,
  deleteLocal,
  clearAllLocalData,
  enqueueSync,
  type LocalRecord,
} from './db';
import { isOnline, triggerBackgroundSync, pullAllFromRemote } from './sync';
import * as api from './api';
import type {
  Transaction,
  Budget,
  PortfolioItem,
  Goal,
  Subscription,
  DelayedGratification,
  AppSettings,
} from '../types';

// ─── Helpers ───

function withMeta<T extends { id: string }>(record: T): T & LocalRecord {
  return {
    ...record,
    updatedAt: Date.now(),
  } as T & LocalRecord;
}

async function writeLocalAndQueue<T extends { id: string }>(
  entity: string,
  operation: 'create' | 'update' | 'delete',
  record: T
) {
  if (operation === 'delete') {
    await deleteLocal(entity, record.id);
    await enqueueSync({ entity, operation, payload: { id: record.id } });
  } else {
    const enriched = withMeta(record);
    await putLocal(entity, enriched);
    await enqueueSync({ entity, operation, payload: record });
  }

  if (isOnline()) {
    // Fire-and-forget background sync
    triggerBackgroundSync().catch(() => {});
  }
}

// ─── Transactions ───

export async function fetchTransactions(): Promise<Transaction[]> {
  const local = await getAllLocal<Transaction>('transactions');
  if (isOnline() && local.length === 0) {
    try {
      const remote = await api.fetchTransactions();
      for (const r of remote) {
        await putLocal('transactions', withMeta(r));
      }
      return remote;
    } catch {
      return local;
    }
  }
  // Background refresh
  if (isOnline()) {
    pullAllFromRemote().catch(() => {});
  }
  return local;
}

export async function createTransaction(data: Transaction) {
  await writeLocalAndQueue('transactions', 'create', data);
}

export async function updateTransaction(data: Transaction) {
  await writeLocalAndQueue('transactions', 'update', data);
}

export async function deleteTransaction(id: string) {
  await writeLocalAndQueue('transactions', 'delete', { id } as Transaction);
}

// ─── Budgets ───

export async function fetchBudgets(): Promise<Budget[]> {
  const local = await getAllLocal<Budget>('budgets');
  if (isOnline() && local.length === 0) {
    try {
      const remote = await api.fetchBudgets();
      for (const r of remote) {
        await putLocal('budgets', withMeta(r));
      }
      return remote;
    } catch {
      return local;
    }
  }
  if (isOnline()) {
    pullAllFromRemote().catch(() => {});
  }
  return local;
}

export async function createBudget(data: Budget) {
  await writeLocalAndQueue('budgets', 'create', data);
}

export async function updateBudget(data: Budget) {
  await writeLocalAndQueue('budgets', 'update', data);
}

export async function deleteBudget(id: string) {
  await writeLocalAndQueue('budgets', 'delete', { id } as Budget);
}

// ─── Portfolio ───

export async function fetchPortfolio(): Promise<PortfolioItem[]> {
  const local = await getAllLocal<PortfolioItem>('portfolio');
  if (isOnline() && local.length === 0) {
    try {
      const remote = await api.fetchPortfolio();
      for (const r of remote) {
        await putLocal('portfolio', withMeta(r));
      }
      return remote;
    } catch {
      return local;
    }
  }
  if (isOnline()) {
    pullAllFromRemote().catch(() => {});
  }
  return local;
}

export async function createPortfolioItem(data: PortfolioItem) {
  await writeLocalAndQueue('portfolio', 'create', data);
}

export async function updatePortfolioItem(data: PortfolioItem) {
  await writeLocalAndQueue('portfolio', 'update', data);
}

export async function deletePortfolioItem(id: string) {
  await writeLocalAndQueue('portfolio', 'delete', { id } as PortfolioItem);
}

// ─── Goals ───

export async function fetchGoals(): Promise<Goal[]> {
  const local = await getAllLocal<Goal>('goals');
  if (isOnline() && local.length === 0) {
    try {
      const remote = await api.fetchGoals();
      for (const r of remote) {
        await putLocal('goals', withMeta(r));
      }
      return remote;
    } catch {
      return local;
    }
  }
  if (isOnline()) {
    pullAllFromRemote().catch(() => {});
  }
  return local;
}

export async function createGoal(data: Goal) {
  await writeLocalAndQueue('goals', 'create', data);
}

export async function updateGoal(data: Goal) {
  await writeLocalAndQueue('goals', 'update', data);
}

export async function deleteGoal(id: string) {
  await writeLocalAndQueue('goals', 'delete', { id } as Goal);
}

// ─── Subscriptions ───

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const local = await getAllLocal<Subscription>('subscriptions');
  if (isOnline() && local.length === 0) {
    try {
      const remote = await api.fetchSubscriptions();
      for (const r of remote) {
        await putLocal('subscriptions', withMeta(r));
      }
      return remote;
    } catch {
      return local;
    }
  }
  if (isOnline()) {
    pullAllFromRemote().catch(() => {});
  }
  return local;
}

export async function createSubscription(data: Subscription) {
  await writeLocalAndQueue('subscriptions', 'create', data);
}

export async function updateSubscription(data: Subscription) {
  await writeLocalAndQueue('subscriptions', 'update', data);
}

export async function deleteSubscription(id: string) {
  await writeLocalAndQueue('subscriptions', 'delete', { id } as Subscription);
}

// ─── Delayed Gratifications ───

export async function fetchDelayedGratifications(): Promise<DelayedGratification[]> {
  const local = await getAllLocal<DelayedGratification>('delayedGratifications');
  if (isOnline() && local.length === 0) {
    try {
      const remote = await api.fetchDelayedGratifications();
      for (const r of remote) {
        await putLocal('delayedGratifications', withMeta(r));
      }
      return remote;
    } catch {
      return local;
    }
  }
  if (isOnline()) {
    pullAllFromRemote().catch(() => {});
  }
  return local;
}

export async function createDelayedGratification(data: DelayedGratification) {
  await writeLocalAndQueue('delayedGratifications', 'create', data);
}

export async function updateDelayedGratification(data: DelayedGratification) {
  await writeLocalAndQueue('delayedGratifications', 'update', data);
}

export async function deleteDelayedGratification(id: string) {
  await writeLocalAndQueue('delayedGratifications', 'delete', { id } as DelayedGratification);
}

// ─── Settings ───

export async function fetchSettings(): Promise<AppSettings> {
  const localArr = await getAllLocal<AppSettings & { userId: string }>('settings');
  const local = localArr[0];
  if (local) {
    if (isOnline()) {
      pullAllFromRemote().catch(() => {});
    }
    return local;
  }
  if (isOnline()) {
    try {
      const remote = await api.fetchSettings();
      const enriched = withMeta({ ...remote, id: 'settings', userId: 'current' });
      await putLocal('settings', enriched);
      return remote;
    } catch {
      return { theme: 'dark', currency: 'TRY', gunKey: '', syncEnabled: true };
    }
  }
  return { theme: 'dark', currency: 'TRY', gunKey: '', syncEnabled: true };
}

export async function updateSettings(data: AppSettings) {
  const enriched = { ...data, id: 'settings', userId: 'current' };
  await writeLocalAndQueue('settings', 'update', enriched);
}

// ─── User / Auth passthrough ───

export { getToken, setToken, removeToken } from './api';

const USER_UPDATE_KEY = 'pending_user_update';

export async function updateUser(data: Record<string, unknown>) {
  if (isOnline()) {
    const result = await api.updateUser(data);
    localStorage.removeItem(USER_UPDATE_KEY);
    return result;
  }
  // Queue for later sync
  const existing = localStorage.getItem(USER_UPDATE_KEY);
  const merged = existing ? { ...JSON.parse(existing), ...data } : data;
  localStorage.setItem(USER_UPDATE_KEY, JSON.stringify(merged));
  return { success: true, offlineQueued: true };
}

export async function flushPendingUserUpdate() {
  const pending = localStorage.getItem(USER_UPDATE_KEY);
  if (pending && isOnline()) {
    try {
      await api.updateUser(JSON.parse(pending));
      localStorage.removeItem(USER_UPDATE_KEY);
    } catch {
      // Will retry next time
    }
  }
}

export async function resetUserData() {
  await clearAllLocalData();
  if (isOnline()) {
    return api.resetUserData();
  }
}

// ─── Initialization ───

export async function initializeOfflineData() {
  if (isOnline()) {
    await pullAllFromRemote();
  }
}
