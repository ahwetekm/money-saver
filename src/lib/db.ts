/**
 * IndexedDB Layer - Offline-First Architecture
 * 
 * Tüm veriler local IndexedDB'de saklanır.
 * Online olunca sunucuyla senkronize edilir.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  Transaction,
  Budget,
  PortfolioItem,
  Goal,
  Subscription,
  DelayedGratification,
  AppSettings,
} from '../types';

// Sync queue item tipi
export interface SyncQueueItem {
  id: string;
  entity: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

// Metadata tipi
interface Metadata {
  key: string;
  value: any;
}

// IndexedDB Schema
interface FinansDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': string; 'by-type': string };
  };
  budgets: {
    key: string;
    value: Budget;
    indexes: { 'by-month': string };
  };
  portfolio: {
    key: string;
    value: PortfolioItem;
    indexes: { 'by-type': string };
  };
  goals: {
    key: string;
    value: Goal;
  };
  subscriptions: {
    key: string;
    value: Subscription;
  };
  delayedGratifications: {
    key: string;
    value: DelayedGratification;
  };
  settings: {
    key: string;
    value: any;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number };
  };
  metadata: {
    key: string;
    value: Metadata;
  };
}

const DB_NAME = 'finans-offline-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<FinansDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<FinansDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FinansDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('by-date', 'date');
        txStore.createIndex('by-type', 'type');
      }

      // Budgets store
      if (!db.objectStoreNames.contains('budgets')) {
        const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
        budgetStore.createIndex('by-month', 'month');
      }

      // Portfolio store
      if (!db.objectStoreNames.contains('portfolio')) {
        const portfolioStore = db.createObjectStore('portfolio', { keyPath: 'id' });
        portfolioStore.createIndex('by-type', 'type');
      }

      // Goals store
      if (!db.objectStoreNames.contains('goals')) {
        db.createObjectStore('goals', { keyPath: 'id' });
      }

      // Subscriptions store
      if (!db.objectStoreNames.contains('subscriptions')) {
        db.createObjectStore('subscriptions', { keyPath: 'id' });
      }

      // Delayed Gratifications store
      if (!db.objectStoreNames.contains('delayedGratifications')) {
        db.createObjectStore('delayedGratifications', { keyPath: 'id' });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Sync Queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-timestamp', 'timestamp');
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// ==========================================
// Generic CRUD Operations
// ==========================================

type StoreName = 'transactions' | 'budgets' | 'portfolio' | 'goals' | 'subscriptions' | 'delayedGratifications' | 'settings' | 'syncQueue' | 'metadata';

export async function getAll(storeName: 'transactions'): Promise<Transaction[]>;
export async function getAll(storeName: 'budgets'): Promise<Budget[]>;
export async function getAll(storeName: 'portfolio'): Promise<PortfolioItem[]>;
export async function getAll(storeName: 'goals'): Promise<Goal[]>;
export async function getAll(storeName: 'subscriptions'): Promise<Subscription[]>;
export async function getAll(storeName: 'delayedGratifications'): Promise<DelayedGratification[]>;
export async function getAll(storeName: StoreName): Promise<any[]> {
  const db = await getDB();
  return db.getAll(storeName as any);
}

export async function getById(storeName: StoreName, id: string): Promise<any> {
  const db = await getDB();
  return db.get(storeName as any, id as any);
}

export async function putItem(storeName: StoreName, item: any): Promise<void> {
  const db = await getDB();
  await db.put(storeName as any, item);
}

export async function putItems(storeName: StoreName, items: any[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(storeName as any, 'readwrite');
  await Promise.all(items.map(item => tx.store.put(item)));
  await tx.done;
}

export async function deleteItem(storeName: StoreName, id: string): Promise<void> {
  const db = await getDB();
  await db.delete(storeName as any, id as any);
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await getDB();
  await db.clear(storeName as any);
}

// ==========================================
// Sync Queue Operations
// ==========================================

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  const db = await getDB();
  const queueItem: SyncQueueItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };
  await db.put('syncQueue', queueItem);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex('syncQueue', 'by-timestamp');
  return items;
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('syncQueue');
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count('syncQueue');
}

// ==========================================
// Metadata Operations
// ==========================================

export async function getMetadata(key: string): Promise<any> {
  const db = await getDB();
  const item = await db.get('metadata', key);
  return item?.value;
}

export async function setMetadata(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('metadata', { key, value });
}

// ==========================================
// Settings Operations
// ==========================================

export async function getLocalSettings(): Promise<AppSettings | null> {
  const db = await getDB();
  const item = await db.get('settings', 'user-settings' as any);
  if (!item) return null;
  const { key, userId, ...settings } = item as any;
  return settings as AppSettings;
}

export async function saveLocalSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { ...settings, key: 'user-settings' } as any);
}

// ==========================================
// Full Data Operations (for sync)
// ==========================================

export async function saveAllData(data: {
  transactions?: Transaction[];
  budgets?: Budget[];
  portfolio?: PortfolioItem[];
  goals?: Goal[];
  subscriptions?: Subscription[];
  delayedGratifications?: DelayedGratification[];
  settings?: AppSettings;
}): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['transactions', 'budgets', 'portfolio', 'goals', 'subscriptions', 'delayedGratifications', 'settings'],
    'readwrite'
  );

  if (data.transactions) {
    await tx.objectStore('transactions').clear();
    await Promise.all(data.transactions.map(item => tx.objectStore('transactions').put(item)));
  }

  if (data.budgets) {
    await tx.objectStore('budgets').clear();
    await Promise.all(data.budgets.map(item => tx.objectStore('budgets').put(item)));
  }

  if (data.portfolio) {
    await tx.objectStore('portfolio').clear();
    await Promise.all(data.portfolio.map(item => tx.objectStore('portfolio').put(item)));
  }

  if (data.goals) {
    await tx.objectStore('goals').clear();
    await Promise.all(data.goals.map(item => tx.objectStore('goals').put(item)));
  }

  if (data.subscriptions) {
    await tx.objectStore('subscriptions').clear();
    await Promise.all(data.subscriptions.map(item => tx.objectStore('subscriptions').put(item)));
  }

  if (data.delayedGratifications) {
    await tx.objectStore('delayedGratifications').clear();
    await Promise.all(data.delayedGratifications.map(item => tx.objectStore('delayedGratifications').put(item)));
  }

  if (data.settings) {
    await tx.objectStore('settings').put({ ...data.settings, key: 'user-settings' } as any);
  }

  await tx.done;
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear('transactions'),
    db.clear('budgets'),
    db.clear('portfolio'),
    db.clear('goals'),
    db.clear('subscriptions'),
    db.clear('delayedGratifications'),
    db.clear('syncQueue'),
  ]);
}
