/**
 * Sync Engine - Offline-First Data Synchronization
 * 
 * Offline yapılan değişiklikleri kuyruğa alır,
 * online olunca sunucuyla senkronize eder.
 */

import { v4 as uuidv4 } from 'uuid';
import * as db from './db';
import { networkMonitor } from './networkMonitor';
import * as api from './api';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'complete';

type SyncListener = (status: SyncStatus, pendingCount: number) => void;

class SyncEngine {
  private status: SyncStatus = 'idle';
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private initialized = false;

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Register sync callback with network monitor
    networkMonitor.setSyncCallback(() => this.sync());

    // Update pending count
    const count = await db.getSyncQueueCount();
    this.notifyListeners(count);
  }

  /**
   * Queue a mutation for later sync
   */
  async queueMutation(entity: string, action: 'create' | 'update' | 'delete', data: any): Promise<void> {
    await db.addToSyncQueue({ entity, action, data });
    const count = await db.getSyncQueueCount();
    this.notifyListeners(count);

    // If online, try to sync immediately
    if (networkMonitor.isOnline()) {
      this.sync();
    }
  }

  /**
   * Process the sync queue
   */
  async sync(): Promise<void> {
    if (this.isSyncing) return;
    if (!networkMonitor.isOnline()) return;

    this.isSyncing = true;
    this.status = 'syncing';
    networkMonitor.setSyncing();
    this.notifyListeners(await db.getSyncQueueCount());

    try {
      const queue = await db.getSyncQueue();
      
      if (queue.length === 0) {
        // No pending mutations, just fetch fresh data
        await this.fetchAndCacheAll();
        this.status = 'complete';
        this.notifyListeners(0);
        networkMonitor.setOnline();
        return;
      }

      // Process each queued mutation
      const failedItems: db.SyncQueueItem[] = [];

      for (const item of queue) {
        try {
          await this.processMutation(item);
          await db.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error(`Failed to sync mutation:`, item, error);
          if (item.retryCount < 3) {
            // Will retry on next sync
            failedItems.push({ ...item, retryCount: item.retryCount + 1 });
          } else {
            // Give up after 3 retries
            await db.removeFromSyncQueue(item.id);
            console.error(`Dropped mutation after 3 retries:`, item);
          }
        }
      }

      // After pushing all mutations, fetch fresh data from server
      await this.fetchAndCacheAll();

      const remainingCount = await db.getSyncQueueCount();
      this.status = remainingCount > 0 ? 'error' : 'complete';
      this.notifyListeners(remainingCount);
    } catch (error) {
      console.error('Sync failed:', error);
      this.status = 'error';
      this.notifyListeners(await db.getSyncQueueCount());
    } finally {
      this.isSyncing = false;
      networkMonitor.setOnline();
    }
  }

  /**
   * Process a single mutation
   */
  private async processMutation(item: db.SyncQueueItem): Promise<void> {
    const { entity, action, data } = item;

    switch (entity) {
      case 'transactions':
        if (action === 'create') await api.createTransaction(data);
        else if (action === 'update') await api.updateTransaction(data);
        else if (action === 'delete') await api.deleteTransaction(data.id);
        break;

      case 'budgets':
        if (action === 'create') await api.createBudget(data);
        else if (action === 'update') await api.updateBudget(data);
        else if (action === 'delete') await api.deleteBudget(data.id);
        break;

      case 'portfolio':
        if (action === 'create') await api.createPortfolioItem(data);
        else if (action === 'update') await api.updatePortfolioItem(data);
        else if (action === 'delete') await api.deletePortfolioItem(data.id);
        break;

      case 'goals':
        if (action === 'create') await api.createGoal(data);
        else if (action === 'update') await api.updateGoal(data);
        else if (action === 'delete') await api.deleteGoal(data.id);
        break;

      case 'subscriptions':
        if (action === 'create') await api.createSubscription(data);
        else if (action === 'update') await api.updateSubscription(data);
        else if (action === 'delete') await api.deleteSubscription(data.id);
        break;

      case 'delayedGratifications':
        if (action === 'create') await api.createDelayedGratification(data);
        else if (action === 'update') await api.updateDelayedGratification(data);
        else if (action === 'delete') await api.deleteDelayedGratification(data.id);
        break;

      case 'settings':
        if (action === 'update') await api.updateSettings(data);
        break;

      default:
        console.warn(`Unknown entity: ${entity}`);
    }
  }

  /**
   * Fetch all data from server and cache in IndexedDB
   */
  async fetchAndCacheAll(): Promise<void> {
    const token = api.getToken();
    if (!token) return;

    try {
      const [
        transactions,
        budgets,
        portfolio,
        goals,
        subscriptions,
        delayedGratifications,
        settings,
      ] = await Promise.all([
        api.fetchTransactions(),
        api.fetchBudgets(),
        api.fetchPortfolio(),
        api.fetchGoals(),
        api.fetchSubscriptions(),
        api.fetchDelayedGratifications(),
        api.fetchSettings(),
      ]);

      await db.saveAllData({
        transactions: transactions || [],
        budgets: budgets || [],
        portfolio: portfolio || [],
        goals: goals || [],
        subscriptions: subscriptions || [],
        delayedGratifications: delayedGratifications || [],
        settings: settings || undefined,
      });

      await db.setMetadata('lastSync', Date.now());
    } catch (error) {
      console.error('Failed to fetch and cache data:', error);
      throw error;
    }
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Immediately notify
    db.getSyncQueueCount().then(count => listener(this.status, count));
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(pendingCount: number) {
    this.listeners.forEach(listener => listener(this.status, pendingCount));
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  async getPendingCount(): Promise<number> {
    return db.getSyncQueueCount();
  }
}

// Singleton
export const syncEngine = new SyncEngine();
