export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  mood?: 'happy' | 'stressed' | 'neutral' | 'excited' | 'sad';
  recurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'fund' | 'gold' | 'currency';
  quantity: number;
  averageCost: number;
  currentPrice: number;
  transactions: PortfolioTransaction[];
}

export interface PortfolioTransaction {
  id: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  linkedAssets: string[];
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

export interface BISTStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface Fund {
  code: string;
  name: string;
  price: number;
  change: number;
  category: string;
}

export interface ExchangeRate {
  code: string;
  name: string;
  buy: number;
  sell: number;
  change: number;
}

export interface GoldPrice {
  type: string;
  name: string;
  buy: number;
  sell: number;
  change: number;
}

export interface FinancialIQ {
  score: number;
  budgetAdherence: number;
  riskBalance: number;
  savingsRate: number;
  diversification: number;
}

export interface CashFlowForecast {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  nextPayment: string;
  interval: 'monthly' | 'yearly';
  category: string;
}

export interface DelayedGratification {
  id: string;
  itemName: string;
  amount: number;
  alternativeInvestment: string;
  projectedValue: number;
  createdAt: string;
  waitUntil: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export type ThemeMode = 'dark' | 'light';

export interface AppSettings {
  theme: ThemeMode;
  currency: string;
  gunKey: string;
  syncEnabled: boolean;
}

export interface MoodSpending {
  mood: string;
  totalSpent: number;
  transactionCount: number;
  averageAmount: number;
}

export interface Projection {
  years: number;
  monthlySaving: number;
  annualRate: number;
  projectedValue: number;
}

export interface FIRECalculation {
  monthlyExpenses: number;
  totalSavings: number;
  monthsCovered: number;
  yearsCovered: number;
  fireNumber: number;
  progressPercent: number;
}

export interface RebalanceAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  currentAllocation: number;
  recommendedAction: string;
}

export interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  portfolio: PortfolioItem[];
  goals: Goal[];
  subscriptions: Subscription[];
  delayedGratifications: DelayedGratification[];
  settings: AppSettings;
}
