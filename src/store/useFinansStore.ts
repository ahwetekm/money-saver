import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  Transaction, Budget, PortfolioItem, Goal, Subscription, 
  DelayedGratification, AppSettings, CryptoPrice 
} from '../types';
import * as api from '../lib/api';
import * as db from '../lib/db';
import { syncEngine } from '../lib/syncEngine';
import { networkMonitor } from '../lib/networkMonitor';

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
  
  // Sync states
  isOnline: boolean;
  syncStatus: string;
  pendingSyncCount: number;
  
  // Actions
  initialize: () => Promise<void>;
  syncNow: () => Promise<void>;
  
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
  
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // User Actions
  resetData: () => Promise<void>;
  
  // Crypto prices
  setCryptoPrices: (prices: CryptoPrice[]) => void;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  currency: 'TRY',
  gunKey: '',
  syncEnabled: false,
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
  isOnline: true,
  syncStatus: 'idle',
  pendingSyncCount: 0,

  initialize: async () => {
    try {
      // Initialize network monitor
      networkMonitor.init();
      
      // Subscribe to network changes
      networkMonitor.subscribe((status) => {
        set({ isOnline: status !== 'offline', syncStatus: status });
      });

      // Initialize sync engine
      await syncEngine.init();
      
      // Subscribe to sync status
      syncEngine.subscribe((status, count) => {
        set({ syncStatus: status, pendingSyncCount: count });
      });

      const token = api.getToken();
      if (!token) {
        set({ isLoading: false, initialized: true });
        return;
      }

      // Try to fetch from server first
      let fetchedFromServer = false;
      if (networkMonitor.isOnline()) {
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

          // Save to IndexedDB
          await db.saveAllData({
            transactions: transactions || [],
            budgets: budgets || [],
            portfolio: portfolio || [],
            goals: goals || [],
            subscriptions: subscriptions || [],
            delayedGratifications: delayedGratifications || [],
            settings: settings || defaultSettings,
          });

          set({
            transactions: transactions || [],
            budgets: budgets || [],
            portfolio: portfolio || [],
            goals: goals || [],
            subscriptions: subscriptions || [],
            delayedGratifications: delayedGratifications || [],
            settings: settings || defaultSettings,
            isLoading: false,
            initialized: true,
          });
          fetchedFromServer = true;
        } catch (error) {
          console.warn('Server fetch failed, using cached data:', error);
        }
      }

      // If server fetch failed or offline, load from IndexedDB
      if (!fetchedFromServer) {
        const [
          transactions,
          budgets,
          portfolio,
          goals,
          subscriptions,
          delayedGratifications,
          settings,
        ] = await Promise.all([
          db.getAll('transactions'),
          db.getAll('budgets'),
          db.getAll('portfolio'),
          db.getAll('goals'),
          db.getAll('subscriptions'),
          db.getAll('delayedGratifications'),
          db.getLocalSettings(),
        ]);

        set({
          transactions: transactions || [],
          budgets: budgets || [],
          portfolio: portfolio || [],
          goals: goals || [],
          subscriptions: subscriptions || [],
          delayedGratifications: delayedGratifications || [],
          settings: settings || defaultSettings,
          isLoading: false,
          initialized: true,
          isOnline: networkMonitor.isOnline(),
        });
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({ isLoading: false, initialized: true });
    }
  },

  syncNow: async () => {
    if (!networkMonitor.isOnline()) return;
    await syncEngine.sync();
    // After sync, reload data from IndexedDB into store
    const [
      transactions,
      budgets,
      portfolio,
      goals,
      subscriptions,
      delayedGratifications,
      settings,
    ] = await Promise.all([
      db.getAll('transactions'),
      db.getAll('budgets'),
      db.getAll('portfolio'),
      db.getAll('goals'),
      db.getAll('subscriptions'),
      db.getAll('delayedGratifications'),
      db.getLocalSettings(),
    ]);

    set({
      transactions: transactions || [],
      budgets: budgets || [],
      portfolio: portfolio || [],
      goals: goals || [],
      subscriptions: subscriptions || [],
      delayedGratifications: delayedGratifications || [],
      settings: settings || defaultSettings,
    });
  },

  // ==========================================
  // Transaction Actions (Offline-First)
  // ==========================================
  addTransaction: async (transaction) => {
    const newTransaction = { ...transaction, id: uuidv4() } as Transaction;
    
    // Update local state immediately (optimistic update)
    set((state) => ({ transactions: [...state.transactions, newTransaction] }));
    
    // Save to IndexedDB
    await db.putItem('transactions', newTransaction);
    
    // If online, try API directly; if offline or fails, queue for sync
    if (networkMonitor.isOnline()) {
      try {
        await api.createTransaction(newTransaction);
      } catch {
        await syncEngine.queueMutation('transactions', 'create', newTransaction);
      }
    } else {
      await syncEngine.queueMutation('transactions', 'create', newTransaction);
    }
  },

  updateTransaction: async (id, updates) => {
    const transaction = get().transactions.find((t) => t.id === id);
    if (transaction) {
      const updated = { ...transaction, ...updates };
      
      // Optimistic update
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
      }));
      
      // Save to IndexedDB
      await db.putItem('transactions', updated);
      
      if (networkMonitor.isOnline()) {
        try {
          await api.updateTransaction(updated);
        } catch {
          await syncEngine.queueMutation('transactions', 'update', updated);
        }
      } else {
        await syncEngine.queueMutation('transactions', 'update', updated);
      }
    }
  },

  deleteTransaction: async (id) => {
    // Optimistic update
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    
    // Delete from IndexedDB
    await db.deleteItem('transactions', id);
    
    if (networkMonitor.isOnline()) {
      try {
        await api.deleteTransaction(id);
      } catch {
        await syncEngine.queueMutation('transactions', 'delete', { id });
      }
    } else {
      await syncEngine.queueMutation('transactions', 'delete', { id });
    }
  },

  // ==========================================
  // Budget Actions (Offline-First)
  // ==========================================
  saveBudget: async (budget) => {
    const existingBudget = budget.id ? get().budgets.find((b) => b.id === budget.id) : null;
    const newBudget = existingBudget
      ? { ...existingBudget, ...budget } as Budget
      : { ...budget, id: uuidv4() } as Budget;

    // Optimistic update
    if (existingBudget) {
      set((state) => ({
        budgets: state.budgets.map((b) => (b.id === newBudget.id ? newBudget : b)),
      }));
    } else {
      set((state) => ({ budgets: [...state.budgets, newBudget] }));
    }
    
    // Save to IndexedDB
    await db.putItem('budgets', newBudget);
    
    if (networkMonitor.isOnline()) {
      try {
        if (existingBudget) {
          await api.updateBudget(newBudget);
        } else {
          await api.createBudget(newBudget);
        }
      } catch {
        await syncEngine.queueMutation('budgets', existingBudget ? 'update' : 'create', newBudget);
      }
    } else {
      await syncEngine.queueMutation('budgets', existingBudget ? 'update' : 'create', newBudget);
    }
  },

  deleteBudget: async (id) => {
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
    
    await db.deleteItem('budgets', id);
    
    if (networkMonitor.isOnline()) {
      try {
        await api.deleteBudget(id);
      } catch {
        await syncEngine.queueMutation('budgets', 'delete', { id });
      }
    } else {
      await syncEngine.queueMutation('budgets', 'delete', { id });
    }
  },

  // ==========================================
  // Portfolio Actions (Offline-First)
  // ==========================================
  addPortfolioItem: async (item) => {
    const newItem = { ...item, id: uuidv4(), transactions: [] } as PortfolioItem;
    
    set((state) => ({ portfolio: [...state.portfolio, newItem] }));
    await db.putItem('portfolio', newItem);
    
    if (networkMonitor.isOnline()) {
      try {
        await api.createPortfolioItem(newItem);
      } catch {
        await syncEngine.queueMutation('portfolio', 'create', newItem);
      }
    } else {
      await syncEngine.queueMutation('portfolio', 'create', newItem);
    }
  },

  updatePortfolioItem: async (id, updates) => {
    const item = get().portfolio.find((p) => p.id === id);
    if (item) {
      const updated = { ...item, ...updates };
      
      set((state) => ({
        portfolio: state.portfolio.map((p) => (p.id === id ? updated : p)),
      }));
      
      await db.putItem('portfolio', updated);
      
      if (networkMonitor.isOnline()) {
        try {
          await api.updatePortfolioItem(updated);
        } catch {
          await syncEngine.queueMutation('portfolio', 'update', updated);
        }
      } else {
        await syncEngine.queueMutation('portfolio', 'update', updated);
      }
    }
  },

  deletePortfolioItem: async (id) => {
    set((state) => ({
      portfolio: state.portfolio.filter((p) => p.id !== id),
    }));
    
    await db.deleteItem('portfolio', id);
    
    if (networkMonitor.isOnline()) {
      try {
        await api.deletePortfolioItem(id);
      } catch {
        await syncEngine.queueMutation('portfolio', 'delete', { id });
      }
    } else {
      await syncEngine.queueMutation('portfolio', 'delete', { id });
    }
  },

  addPortfolioTransaction: async (itemId, transaction) => {
    const item = get().portfolio.find((p) => p.id === itemId);
    if (item) {
      const newTransaction = { ...transaction, id: uuidv4() };
      const updated = {
        ...item,
        transactions: [...item.transactions, newTransaction],
      };
      
      set((state) => ({
        portfolio: state.portfolio.map((p) => (p.id === itemId ? updated : p)),
      }));
      
      await db.putItem('portfolio', updated);
      
      if (networkMonitor.isOnline()) {
        try {
          await api.updatePortfolioItem(updated);
        } catch {
          await syncEngine.queueMutation('portfolio', 'update', updated);
        }
      } else {
        await syncEngine.queueMutation('portfolio', 'update', updated);
      }
    }
  },

  // ==========================================
  // Goal Actions (Offline-First)
  // ==========================================
  addGoal: async (goal) => {
    const newGoal = { ...goal, id: uuidv4() } as Goal;
    
    set((state) => ({ goals: [...state.goals, newGoal] }));
    await db.putItem('goals', newGoal);
    
    if (networkMonitor.isOnline()) {
      try {
        await api.createGoal(newGoal);
      } catch {
        await syncEngine.queueMutation('goals', 'create', newGoal);
      }
    } else {
      await syncEngine.queueMutation('goals', 'create', newGoal);
    }
  },

  updateGoal: async (id, updates) => {
    const goal = get().goals.find((g) => g.id === id);
    if (goal) {
      const updated = { ...goal, ...updates };
      
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
      }));
      
      await db.putItem('goals', updated);
      
      if (networkMonitor.isOnline()) {
        try {
          await api.updateGoal(updated);
        } catch {
          await syncEngine.queueMutation('goals', 'update', updated);
        }
      } else {
        await syncEngine.queueMutation('goals', 'update', updated);
      }
    }
  },

  deleteGoal: async (id) => {
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
    
    await db.deleteItem('goals', id);
    
    if (networkMonitor.isOnline()) {
      try {
        await api.deleteGoal(id);
      } catch {
        await syncEngine.queueMutation('goals', 'delete', { id });
      }
    } else {
      await syncEngine.queueMutation('goals', 'delete', { id });
    }
  },

  // ==========================================
  // Subscription Actions (Offline-First)
  // ==========================================
  addSubscription: async (subscription) => {
    const newSubscription = { ...subscription, id: uuidv4() } as Subscription;
    
    set((state) => ({ subscriptions: [...state.subscriptions, newSubscription] }));
    await db.putItem('subscriptions', newSubscription);
    
    if (networkMonitor.isOnline()) {
      try {
        await api.createSubscription(newSubscription);
      } catch {
        await syncEngine.queueMutation('subscriptions', 'create', newSubscription);
      }
    } else {
      await syncEngine.queueMutation('subscriptions', 'create', newSubscription);
    }
  },

  updateSubscription: async (id, updates) => {
    const subscription = get().subscriptions.find((s) => s.id === id);
    if (subscription) {
      const updated = { ...subscription, ...updates };
      
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? updated : s)),
      }));
      
      await db.putItem('subscriptions', updated);
      
      if (networkMonitor.isOnline()) {
        try {
          await api.updateSubscription(updated);
        } catch {
          await syncEngine.queueMutation('subscriptions', 'update', updated);
        }
      } else {
        await syncEngine.queueMutation('subscriptions', 'update', updated);
      }
    }
  },

  deleteSubscription: async (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== id),
    }));
    
    await db.deleteItem('subscriptions', id);
    
    if (networkMonitor.isOnline()) {
      try {
        await api.deleteSubscription(id);
      } catch {
        await syncEngine.queueMutation('subscriptions', 'delete', { id });
      }
    } else {
      await syncEngine.queueMutation('subscriptions', 'delete', { id });
    }
  },

  // ==========================================
  // Delayed Gratification Actions (Offline-First)
  // ==========================================
  addDelayedGratification: async (item) => {
    const newItem = { ...item, id: uuidv4() } as DelayedGratification;
    
    set((state) => ({ delayedGratifications: [...state.delayedGratifications, newItem] }));
    await db.putItem('delayedGratifications', newItem);
    
    if (networkMonitor.isOnline()) {
      try {
        await api.createDelayedGratification(newItem);
      } catch {
        await syncEngine.queueMutation('delayedGratifications', 'create', newItem);
      }
    } else {
      await syncEngine.queueMutation('delayedGratifications', 'create', newItem);
    }
  },

  updateDelayedGratification: async (id, updates) => {
    const item = get().delayedGratifications.find((d) => d.id === id);
    if (item) {
      const updated = { ...item, ...updates };
      
      set((state) => ({
        delayedGratifications: state.delayedGratifications.map((d) => (d.id === id ? updated : d)),
      }));
      
      await db.putItem('delayedGratifications', updated);
      
      if (networkMonitor.isOnline()) {
        try {
          await api.updateDelayedGratification(updated);
        } catch {
          await syncEngine.queueMutation('delayedGratifications', 'update', updated);
        }
      } else {
        await syncEngine.queueMutation('delayedGratifications', 'update', updated);
      }
    }
  },

  // ==========================================
  // Settings Actions (Offline-First)
  // ==========================================
  updateSettings: async (settings) => {
    const newSettings = { ...get().settings, ...settings };
    
    // Optimistic update
    set({ settings: newSettings });
    
    // Save to IndexedDB
    await db.saveLocalSettings(newSettings);
    
    if (networkMonitor.isOnline()) {
      try {
        await api.updateSettings(newSettings);
      } catch {
        await syncEngine.queueMutation('settings', 'update', newSettings);
      }
    } else {
      await syncEngine.queueMutation('settings', 'update', newSettings);
    }
  },

  // ==========================================
  // User Actions (Offline-First)
  // ==========================================
  resetData: async () => {
    // Clear local state
    set({
      transactions: [],
      budgets: [],
      portfolio: [],
      goals: [],
      subscriptions: [],
      delayedGratifications: []
    });
    
    // Clear IndexedDB
    await db.clearAllData();
    
    if (networkMonitor.isOnline()) {
      try {
        await api.resetUserData();
      } catch {
        // Queue for later
        await syncEngine.queueMutation('user', 'delete', {});
      }
    }
  },

  setCryptoPrices: (prices) => set({ cryptoPrices: prices }),
}));
