import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  Transaction, Budget, PortfolioItem, Goal, Subscription, 
  DelayedGratification, AppSettings, CryptoPrice 
} from '../types';
import * as db from '../lib/db';

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
  
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // Crypto prices
  setCryptoPrices: (prices: CryptoPrice[]) => void;
  
  // Export/Import
  exportData: () => Promise<string>;
  importData: (jsonString: string) => Promise<void>;
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

  initialize: async () => {
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
        db.getAllTransactions(),
        db.getAllBudgets(),
        db.getAllPortfolioItems(),
        db.getAllGoals(),
        db.getAllSubscriptions(),
        db.getAllDelayedGratifications(),
        db.getSettings(),
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
      });
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({ isLoading: false, initialized: true });
    }
  },

  addTransaction: async (transaction) => {
    const newTransaction = { ...transaction, id: uuidv4() } as Transaction;
    await db.addTransaction(newTransaction);
    set((state) => ({ transactions: [...state.transactions, newTransaction] }));
  },

  updateTransaction: async (id, updates) => {
    const transaction = get().transactions.find((t) => t.id === id);
    if (transaction) {
      const updated = { ...transaction, ...updates };
      await db.updateTransaction(updated);
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
      }));
    }
  },

  deleteTransaction: async (id) => {
    await db.deleteTransaction(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  saveBudget: async (budget) => {
    const newBudget = { ...budget, id: budget.id || uuidv4() } as Budget;
    await db.saveBudget(newBudget);
    set((state) => ({
      budgets: state.budgets.some((b) => b.id === newBudget.id)
        ? state.budgets.map((b) => (b.id === newBudget.id ? newBudget : b))
        : [...state.budgets, newBudget],
    }));
  },

  deleteBudget: async (id) => {
    await db.deleteBudget(id);
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
  },

  addPortfolioItem: async (item) => {
    const newItem = { ...item, id: uuidv4() } as PortfolioItem;
    await db.savePortfolioItem(newItem);
    set((state) => ({ portfolio: [...state.portfolio, newItem] }));
  },

  updatePortfolioItem: async (id, updates) => {
    const item = get().portfolio.find((p) => p.id === id);
    if (item) {
      const updated = { ...item, ...updates };
      await db.savePortfolioItem(updated);
      set((state) => ({
        portfolio: state.portfolio.map((p) => (p.id === id ? updated : p)),
      }));
    }
  },

  deletePortfolioItem: async (id) => {
    await db.deletePortfolioItem(id);
    set((state) => ({
      portfolio: state.portfolio.filter((p) => p.id !== id),
    }));
  },

  addPortfolioTransaction: async (itemId, transaction) => {
    const item = get().portfolio.find((p) => p.id === itemId);
    if (item) {
      const newTransaction = { ...transaction, id: uuidv4() };
      const updatedItem = {
        ...item,
        transactions: [...item.transactions, newTransaction],
      };
      await db.savePortfolioItem(updatedItem);
      set((state) => ({
        portfolio: state.portfolio.map((p) => (p.id === itemId ? updatedItem : p)),
      }));
    }
  },

  addGoal: async (goal) => {
    const newGoal = { ...goal, id: uuidv4() } as Goal;
    await db.saveGoal(newGoal);
    set((state) => ({ goals: [...state.goals, newGoal] }));
  },

  updateGoal: async (id, updates) => {
    const goal = get().goals.find((g) => g.id === id);
    if (goal) {
      const updated = { ...goal, ...updates };
      await db.saveGoal(updated);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
      }));
    }
  },

  deleteGoal: async (id) => {
    await db.deleteGoal(id);
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
  },

  addSubscription: async (subscription) => {
    const newSubscription = { ...subscription, id: uuidv4() } as Subscription;
    await db.saveSubscription(newSubscription);
    set((state) => ({ subscriptions: [...state.subscriptions, newSubscription] }));
  },

  updateSubscription: async (id, updates) => {
    const subscription = get().subscriptions.find((s) => s.id === id);
    if (subscription) {
      const updated = { ...subscription, ...updates };
      await db.saveSubscription(updated);
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? updated : s)),
      }));
    }
  },

  deleteSubscription: async (id) => {
    await db.deleteSubscription(id);
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== id),
    }));
  },

  addDelayedGratification: async (item) => {
    const newItem = { ...item, id: uuidv4() } as DelayedGratification;
    await db.saveDelayedGratification(newItem);
    set((state) => ({ delayedGratifications: [...state.delayedGratifications, newItem] }));
  },

  updateDelayedGratification: async (id, updates) => {
    const item = get().delayedGratifications.find((d) => d.id === id);
    if (item) {
      const updated = { ...item, ...updates };
      await db.saveDelayedGratification(updated);
      set((state) => ({
        delayedGratifications: state.delayedGratifications.map((d) => (d.id === id ? updated : d)),
      }));
    }
  },

  updateSettings: async (settings) => {
    const newSettings = { ...get().settings, ...settings };
    await db.saveSettings(newSettings);
    set({ settings: newSettings });
  },

  setCryptoPrices: (prices) => set({ cryptoPrices: prices }),

  exportData: async () => {
    return await db.exportAllData();
  },

  importData: async (jsonString) => {
    await db.importAllData(jsonString);
    await get().initialize();
  },
}));
