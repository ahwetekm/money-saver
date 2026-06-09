import Dexie, { type Table } from 'dexie';
import type {
  Transaction,
  Budget,
  PortfolioItem,
  Goal,
  Subscription,
  DelayedGratification,
  AppSettings,
} from '../types';

// ─── Sync Queue Types ───
export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id?: number; // auto-increment
  entity: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

// ─── Local DB Record Types (with metadata) ───
export interface LocalRecord {
  id: string;
  updatedAt: number;
  syncedAt?: number;
  isDeleted?: boolean;
}

export type LocalTransaction = Transaction & LocalRecord;
export type LocalBudget = Budget & LocalRecord;
export type LocalPortfolioItem = PortfolioItem & LocalRecord;
export type LocalGoal = Goal & LocalRecord;
export type LocalSubscription = Subscription & LocalRecord;
export type LocalDelayedGratification = DelayedGratification & LocalRecord;
export type LocalSettings = AppSettings & { userId: string } & LocalRecord;

// ─── Dexie Database ───
class MoneySaverDB extends Dexie {
  transactions!: Table<LocalTransaction, string>;
  budgets!: Table<LocalBudget, string>;
  portfolio!: Table<LocalPortfolioItem, string>;
  goals!: Table<LocalGoal, string>;
  subscriptions!: Table<LocalSubscription, string>;
  delayedGratifications!: Table<LocalDelayedGratification, string>;
  settings!: Table<LocalSettings, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('MoneySaverDB');
    this.version(1).stores({
      transactions: 'id, updatedAt, syncedAt',
      budgets: 'id, updatedAt, syncedAt',
      portfolio: 'id, updatedAt, syncedAt',
      goals: 'id, updatedAt, syncedAt',
      subscriptions: 'id, updatedAt, syncedAt',
      delayedGratifications: 'id, updatedAt, syncedAt',
      settings: 'id, updatedAt, syncedAt',
      syncQueue: '++id, entity, operation, createdAt',
    });
  }
}

export const db = new MoneySaverDB();

// ─── Entity table map ───
export const entityTables: Record<string, Table<LocalRecord, string>> = {
  transactions: db.transactions,
  budgets: db.budgets,
  portfolio: db.portfolio,
  goals: db.goals,
  subscriptions: db.subscriptions,
  delayedGratifications: db.delayedGratifications,
  settings: db.settings,
};

// ─── Helpers ───

export async function getAllLocal<T>(entity: string): Promise<T[]> {
  const table = entityTables[entity];
  if (!table) throw new Error(`Unknown entity: ${entity}`);
  const rows = await table.toArray();
  return rows.filter((r) => !r.isDeleted) as T[];
}

export async function getLocalById<T>(entity: string, id: string): Promise<T | undefined> {
  const table = entityTables[entity];
  if (!table) throw new Error(`Unknown entity: ${entity}`);
  const row = await table.get(id);
  if (row && row.isDeleted) return undefined;
  return row as T;
}

export async function putLocal<T extends { id: string }>(entity: string, record: T & Partial<LocalRecord>) {
  const table = entityTables[entity];
  if (!table) throw new Error(`Unknown entity: ${entity}`);
  const now = Date.now();
  const existing = await table.get(record.id);
  const updated = {
    ...(existing || {}),
    ...record,
    updatedAt: now,
  };
  await table.put(updated);
  return updated;
}

export async function deleteLocal(entity: string, id: string) {
  const table = entityTables[entity];
  if (!table) throw new Error(`Unknown entity: ${entity}`);
  const existing = await table.get(id);
  if (existing) {
    await table.put({ ...existing, updatedAt: Date.now(), isDeleted: true });
  }
}

export async function clearLocalEntity(entity: string) {
  const table = entityTables[entity];
  if (!table) throw new Error(`Unknown entity: ${entity}`);
  await table.clear();
}

export async function bulkPutLocal<T extends { id: string }>(entity: string, records: (T & Partial<LocalRecord>)[]) {
  const table = entityTables[entity];
  if (!table) throw new Error(`Unknown entity: ${entity}`);
  const now = Date.now();
  const toPut = await Promise.all(
    records.map(async (record) => {
      const existing = await table.get(record.id);
      return {
        ...(existing || {}),
        ...record,
        updatedAt: now,
        syncedAt: now,
      };
    })
  );
  await table.bulkPut(toPut);
}

// ─── Sync Queue Helpers ───

export async function enqueueSync(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>) {
  await db.syncQueue.add({
    ...item,
    createdAt: Date.now(),
    retryCount: 0,
  });
}

export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  return db.syncQueue.orderBy('createdAt').toArray();
}

export async function removeSyncQueueItem(id: number) {
  await db.syncQueue.delete(id);
}

export async function incrementRetry(id: number, error: string) {
  const item = await db.syncQueue.get(id);
  if (item) {
    await db.syncQueue.update(id, { retryCount: item.retryCount + 1, lastError: error });
  }
}

export async function clearSyncQueue() {
  await db.syncQueue.clear();
}

export async function clearAllLocalData() {
  await Promise.all([
    db.transactions.clear(),
    db.budgets.clear(),
    db.portfolio.clear(),
    db.goals.clear(),
    db.subscriptions.clear(),
    db.delayedGratifications.clear(),
    db.settings.clear(),
    db.syncQueue.clear(),
  ]);
}
