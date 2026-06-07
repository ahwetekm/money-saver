import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Transaction, Budget, PortfolioItem, Goal, Subscription, DelayedGratification, AppSettings } from '../types';

interface FinansDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': string; 'by-category': string; 'by-type': string };
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
    value: AppSettings;
  };
}

let dbInstance: IDBPDatabase<FinansDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<FinansDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FinansDB>('finans-app', 1, {
    upgrade(db) {
      const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
      transactionStore.createIndex('by-date', 'date');
      transactionStore.createIndex('by-category', 'category');
      transactionStore.createIndex('by-type', 'type');

      const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
      budgetStore.createIndex('by-month', 'month');

      const portfolioStore = db.createObjectStore('portfolio', { keyPath: 'id' });
      portfolioStore.createIndex('by-type', 'type');

      db.createObjectStore('goals', { keyPath: 'id' });
      db.createObjectStore('subscriptions', { keyPath: 'id' });
      db.createObjectStore('delayedGratifications', { keyPath: 'id' });
      db.createObjectStore('settings', { keyPath: 'id' });
    },
  });

  return dbInstance;
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll('transactions');
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', transaction);
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', transaction);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

export async function getAllBudgets(): Promise<Budget[]> {
  const db = await getDB();
  return db.getAll('budgets');
}

export async function saveBudget(budget: Budget): Promise<void> {
  const db = await getDB();
  await db.put('budgets', budget);
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('budgets', id);
}

export async function getAllPortfolioItems(): Promise<PortfolioItem[]> {
  const db = await getDB();
  return db.getAll('portfolio');
}

export async function savePortfolioItem(item: PortfolioItem): Promise<void> {
  const db = await getDB();
  await db.put('portfolio', item);
}

export async function deletePortfolioItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('portfolio', id);
}

export async function getAllGoals(): Promise<Goal[]> {
  const db = await getDB();
  return db.getAll('goals');
}

export async function saveGoal(goal: Goal): Promise<void> {
  const db = await getDB();
  await db.put('goals', goal);
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('goals', id);
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const db = await getDB();
  return db.getAll('subscriptions');
}

export async function saveSubscription(subscription: Subscription): Promise<void> {
  const db = await getDB();
  await db.put('subscriptions', subscription);
}

export async function deleteSubscription(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('subscriptions', id);
}

export async function getAllDelayedGratifications(): Promise<DelayedGratification[]> {
  const db = await getDB();
  return db.getAll('delayedGratifications');
}

export async function saveDelayedGratification(item: DelayedGratification): Promise<void> {
  const db = await getDB();
  await db.put('delayedGratifications', item);
}

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  return db.get('settings', 'main');
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'main' } as AppSettings & { id: string });
}

export async function exportAllData(): Promise<string> {
  const db = await getDB();
  const data = {
    transactions: await db.getAll('transactions'),
    budgets: await db.getAll('budgets'),
    portfolio: await db.getAll('portfolio'),
    goals: await db.getAll('goals'),
    subscriptions: await db.getAll('subscriptions'),
    delayedGratifications: await db.getAll('delayedGratifications'),
    settings: await db.get('settings', 'main'),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  const db = await getDB();

  if (data.transactions) {
    for (const item of data.transactions) {
      await db.put('transactions', item);
    }
  }
  if (data.budgets) {
    for (const item of data.budgets) {
      await db.put('budgets', item);
    }
  }
  if (data.portfolio) {
    for (const item of data.portfolio) {
      await db.put('portfolio', item);
    }
  }
  if (data.goals) {
    for (const item of data.goals) {
      await db.put('goals', item);
    }
  }
  if (data.subscriptions) {
    for (const item of data.subscriptions) {
      await db.put('subscriptions', item);
    }
  }
  if (data.delayedGratifications) {
    for (const item of data.delayedGratifications) {
      await db.put('delayedGratifications', item);
    }
  }
  if (data.settings) {
    await db.put('settings', data.settings);
  }
}
