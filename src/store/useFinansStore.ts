import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Transaction, Budget, PortfolioItem, Goal, Subscription,
  DelayedGratification, AppSettings, CryptoPrice
} from '../types';
import * as offlineApi from '../lib/offlineApi';
import { listenNetworkChanges, isSyncing, startPeriodicSync } from '../lib/sync';
import { getPendingSyncQueue } from '../lib/db';

interface FinansState {
  // Data
  transactions: Transaction[];
  budgets: Budget[];
  portfolio: PortfolioItem[];
  goals: Goal[];
  subscriptions: Subscription[];
  delayedGratifications: DelayedGratification[];
  settings: AppSettings;
  cryptoPrices: CryptoPrice[];

  // Loading states
  isLoading: boolean;
  initialized: boolean;

  // Offline / Sync states
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;

  // Actions
  initialize: () => Promise<void>;

  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget actions
  saveBudget: (budget: Omit<Budget, 'id'> & { id?: string }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Portfolio actions
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  addPortfolioTransaction: (itemId: string, transaction: Omit<PortfolioItem['transactions'][0], 'id'>) => Promise<void>;

  // Goal actions
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Subscription actions
  addSubscription: (subscription: Omit<Subscription, 'id'>) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;

  // Delayed Gratification actions
  addDelayedGratification: (item: Omit<DelayedGratification, 'id'>) => Promise<void>;
  updateDelayedGratification: (id: string, updates: Partial<DelayedGratification>) => Promise<void>;

  // User Profile
  userName: string;
  setUserName: (name: string) => void;
  updateUserName: (name: string) => Promise<void>;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // User Actions
  resetData: () => Promise<void>;

  // Crypto prices
  setCryptoPrices: (prices: CryptoPrice[]) => void;

  // Internal
  _refreshSyncStatus: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  currency: 'TRY',
  gunKey: '',
  syncEnabled: true,
  userName: '',
};

export const useFinansStore = create<FinansState>((set, get) => ({
  transactions: [],
  budgets: [],
  portfolio: [],
  goals: [],
  subscriptions: [],
  delayedGratifications: [],
  settings: defaultSettings,
  cryptoPrices: [],
  isLoading: true,
  initialized: false,
  userName: '',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingSyncCount: 0,

  initialize: async () => {
    try {
      const token = offlineApi.getToken();
      if (!token) {
        set({ isLoading: false, initialized: true });
        return;
      }

      // Initialize offline data (pull from remote if online)
      await offlineApi.initializeOfflineData();

      // Fetch from local-first API
      const [
        transactions,
        budgets,
        portfolio,
        goals,
        subscriptions,
        delayedGratifications,
        settings,
        userProfile,
      ] = await Promise.all([
        offlineApi.fetchTransactions(),
        offlineApi.fetchBudgets(),
        offlineApi.fetchPortfolio(),
        offlineApi.fetchGoals(),
        offlineApi.fetchSubscriptions(),
        offlineApi.fetchDelayedGratifications(),
        offlineApi.fetchSettings(),
        offlineApi.fetchUserProfile(),
      ]);

      set({
        transactions: transactions || [],
        budgets: budgets || [],
        portfolio: portfolio || [],
        goals: goals || [],
        subscriptions: subscriptions || [],
        delayedGratifications: delayedGratifications || [],
        settings: settings || defaultSettings,
        userName: userProfile?.name || '',
        isLoading: false,
        initialized: true,
      });

      // Start network listener
      listenNetworkChanges((online) => {
        set({ isOnline: online });
        if (online) {
          get()._refreshSyncStatus();
        }
      });

      // Initial sync status
      await get()._refreshSyncStatus();

      // Start periodic background sync retry (every 10s when online)
      startPeriodicSync(10000);

      // Periodic sync status refresh
      setInterval(() => {
        get()._refreshSyncStatus();
      }, 3000);
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({ isLoading: false, initialized: true });
    }
  },

  _refreshSyncStatus: async () => {
    const queue = await getPendingSyncQueue();
    set({
      pendingSyncCount: queue.length,
      isSyncing: isSyncing(),
    });
  },

  addTransaction: async (transaction) => {
    const newTransaction = { ...transaction, id: uuidv4() } as Transaction;
    await offlineApi.createTransaction(newTransaction);
    set((state) => ({ transactions: [...state.transactions, newTransaction] }));
    await get()._refreshSyncStatus();
  },

  updateTransaction: async (id, updates) => {
    const transaction = get().transactions.find((t) => t.id === id);
    if (transaction) {
      const updated = { ...transaction, ...updates };
      await offlineApi.updateTransaction(updated);
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
      }));
      await get()._refreshSyncStatus();
    }
  },

  deleteTransaction: async (id) => {
    await offlineApi.deleteTransaction(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    await get()._refreshSyncStatus();
  },

  saveBudget: async (budget) => {
    const newBudget = { ...budget, id: budget.id || uuidv4() } as Budget;
    if (budget.id) {
      await offlineApi.updateBudget(newBudget);
    } else {
      await offlineApi.createBudget(newBudget);
    }
    set((state) => ({
      budgets: state.budgets.some((b) => b.id === newBudget.id)
        ? state.budgets.map((b) => (b.id === newBudget.id ? newBudget : b))
        : [...state.budgets, newBudget],
    }));
    await get()._refreshSyncStatus();
  },

  deleteBudget: async (id) => {
    await offlineApi.deleteBudget(id);
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
    await get()._refreshSyncStatus();
  },

  addPortfolioItem: async (item) => {
    const newItem = { ...item, id: uuidv4() } as PortfolioItem;
    await offlineApi.createPortfolioItem(newItem);
    set((state) => ({ portfolio: [...state.portfolio, newItem] }));
    await get()._refreshSyncStatus();
  },

  updatePortfolioItem: async (id, updates) => {
    const item = get().portfolio.find((p) => p.id === id);
    if (item) {
      const updated = { ...item, ...updates };
      await offlineApi.updatePortfolioItem(updated);
      set((state) => ({
        portfolio: state.portfolio.map((p) => (p.id === id ? updated : p)),
      }));
      await get()._refreshSyncStatus();
    }
  },

  deletePortfolioItem: async (id) => {
    await offlineApi.deletePortfolioItem(id);
    set((state) => ({
      portfolio: state.portfolio.filter((p) => p.id !== id),
    }));
    await get()._refreshSyncStatus();
  },

  addPortfolioTransaction: async (itemId, transaction) => {
    const item = get().portfolio.find((p) => p.id === itemId);
    if (item) {
      const newTransaction = { ...transaction, id: uuidv4() };
      const updatedItem = {
        ...item,
        transactions: [...item.transactions, newTransaction],
      };
      await offlineApi.updatePortfolioItem(updatedItem);
      set((state) => ({
        portfolio: state.portfolio.map((p) => (p.id === itemId ? updatedItem : p)),
      }));
      await get()._refreshSyncStatus();
    }
  },

  addGoal: async (goal) => {
    const newGoal = { ...goal, id: uuidv4() } as Goal;
    await offlineApi.createGoal(newGoal);
    set((state) => ({ goals: [...state.goals, newGoal] }));
    await get()._refreshSyncStatus();
  },

  updateGoal: async (id, updates) => {
    const goal = get().goals.find((g) => g.id === id);
    if (goal) {
      const updated = { ...goal, ...updates };
      await offlineApi.updateGoal(updated);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
      }));
      await get()._refreshSyncStatus();
    }
  },

  deleteGoal: async (id) => {
    await offlineApi.deleteGoal(id);
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
    await get()._refreshSyncStatus();
  },

  addSubscription: async (subscription) => {
    const newSubscription = { ...subscription, id: uuidv4() } as Subscription;
    await offlineApi.createSubscription(newSubscription);
    set((state) => ({ subscriptions: [...state.subscriptions, newSubscription] }));
    await get()._refreshSyncStatus();
  },

  updateSubscription: async (id, updates) => {
    const subscription = get().subscriptions.find((s) => s.id === id);
    if (subscription) {
      const updated = { ...subscription, ...updates };
      await offlineApi.updateSubscription(updated);
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? updated : s)),
      }));
      await get()._refreshSyncStatus();
    }
  },

  deleteSubscription: async (id) => {
    await offlineApi.deleteSubscription(id);
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== id),
    }));
    await get()._refreshSyncStatus();
  },

  addDelayedGratification: async (item) => {
    const newItem = { ...item, id: uuidv4() } as DelayedGratification;
    await offlineApi.createDelayedGratification(newItem);
    set((state) => ({ delayedGratifications: [...state.delayedGratifications, newItem] }));
    await get()._refreshSyncStatus();
  },

  updateDelayedGratification: async (id, updates) => {
    const item = get().delayedGratifications.find((d) => d.id === id);
    if (item) {
      const updated = { ...item, ...updates };
      await offlineApi.updateDelayedGratification(updated);
      set((state) => ({
        delayedGratifications: state.delayedGratifications.map((d) => (d.id === id ? updated : d)),
      }));
      await get()._refreshSyncStatus();
    }
  },

  setUserName: (name) => set({ userName: name }),

  updateUserName: async (name) => {
    await offlineApi.updateUser({ name });
    // Update local cache
    const profile = await offlineApi.fetchUserProfile();
    if (profile) {
      offlineApi.setLocalUserProfile({ ...profile, name });
    }
    set({ userName: name });
    await get()._refreshSyncStatus();
  },

  updateSettings: async (settings) => {
    const newSettings = { ...get().settings, ...settings };
    await offlineApi.updateSettings(newSettings);
    set({ settings: newSettings });
    await get()._refreshSyncStatus();
  },

  resetData: async () => {
    await offlineApi.resetUserData();
    set({
      transactions: [],
      budgets: [],
      portfolio: [],
      goals: [],
      subscriptions: [],
      delayedGratifications: []
    });
    await get()._refreshSyncStatus();
  },

  setCryptoPrices: (prices) => set({ cryptoPrices: prices }),
}));
