import { format, parseISO, addMonths, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `₺${millions.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    return `₺${thousands.toFixed(2)}K`;
  }
  return formatCurrency(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercentage(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMMM yyyy', { locale: tr });
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM', { locale: tr });
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getMonthName(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return format(date, 'MMMM yyyy', { locale: tr });
}

export function calculateCompoundInterest(
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  
  let futureValue = principal * Math.pow(1 + monthlyRate, months);
  
  for (let i = 0; i < months; i++) {
    futureValue += monthlyContribution * Math.pow(1 + monthlyRate, months - i - 1);
  }
  
  return futureValue;
}

export function calculateAverageCost(transactions: { type: 'buy' | 'sell'; quantity: number; price: number }[]): number {
  let totalCost = 0;
  let totalQuantity = 0;

  for (const tx of transactions) {
    if (tx.type === 'buy') {
      totalCost += tx.quantity * tx.price;
      totalQuantity += tx.quantity;
    } else {
      const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      totalCost -= tx.quantity * avgCost;
      totalQuantity -= tx.quantity;
    }
  }

  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
}

export function calculateProfitLoss(
  quantity: number,
  averageCost: number,
  currentPrice: number
): { profit: number; profitPercent: number } {
  const totalCost = quantity * averageCost;
  const currentValue = quantity * currentPrice;
  const profit = currentValue - totalCost;
  const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  return { profit, profitPercent };
}

export function generateCashFlowForecast(
  transactions: { date: string; type: 'income' | 'expense'; amount: number }[],
  subscriptions: { nextPayment: string; amount: number }[],
  days: number = 30
): { date: string; income: number; expense: number; balance: number }[] {
  const forecast: { date: string; income: number; expense: number; balance: number }[] = [];
  const today = new Date();
  let runningBalance = 0;

  // Calculate current balance from transactions
  for (const tx of transactions) {
    if (tx.type === 'income') {
      runningBalance += tx.amount;
    } else {
      runningBalance -= tx.amount;
    }
  }

  // Generate forecast for next N days
  for (let i = 0; i < days; i++) {
    const date = format(addMonths(today, 0), 'yyyy-MM-dd');
    const forecastDate = format(new Date(today.getTime() + i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    
    let dayIncome = 0;
    let dayExpense = 0;

    // Check subscriptions
    for (const sub of subscriptions) {
      if (sub.nextPayment === forecastDate) {
        dayExpense += sub.amount;
      }
    }

    runningBalance += dayIncome - dayExpense;

    forecast.push({
      date: forecastDate,
      income: dayIncome,
      expense: dayExpense,
      balance: runningBalance,
    });
  }

  return forecast;
}

export function calculateFIRE(
  monthlyExpenses: number,
  totalSavings: number,
  withdrawalRate: number = 4
): { monthsCovered: number; yearsCovered: number; fireNumber: number; progressPercent: number } {
  const fireNumber = (monthlyExpenses * 12) / (withdrawalRate / 100);
  const monthsCovered = totalSavings / monthlyExpenses;
  const yearsCovered = monthsCovered / 12;
  const progressPercent = (totalSavings / fireNumber) * 100;

  return { monthsCovered, yearsCovered, fireNumber, progressPercent };
}

export function calculateFinancialIQ(
  budgetAdherence: number,
  savingsRate: number,
  riskBalance: number,
  diversification: number
): number {
  const score = 
    budgetAdherence * 0.3 +
    savingsRate * 0.25 +
    riskBalance * 0.25 +
    diversification * 0.2;
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getTimeRemaining(endDate: string): { days: number; hours: number; minutes: number; seconds: number } {
  const total = differenceInDays(parseISO(endDate), new Date()) * 24 * 60 * 60 * 1000;
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function calculateMoodSpendingImpact(
  transactions: { mood?: string; amount: number; type: string }[]
): { mood: string; totalSpent: number; count: number; average: number }[] {
  const moodData: Record<string, { total: number; count: number }> = {};

  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.mood) {
      if (!moodData[tx.mood]) {
        moodData[tx.mood] = { total: 0, count: 0 };
      }
      moodData[tx.mood].total += tx.amount;
      moodData[tx.mood].count += 1;
    }
  }

  return Object.entries(moodData).map(([mood, data]) => ({
    mood,
    totalSpent: data.total,
    count: data.count,
    average: data.total / data.count,
  }));
}

export function checkRebalanceNeeded(
  portfolio: { type: string; currentPrice: number; quantity: number }[]
): { type: 'warning' | 'danger' | 'info'; message: string; riskyPercent: number } | null {
  let riskyValue = 0;
  let totalValue = 0;

  for (const item of portfolio) {
    const value = item.currentPrice * item.quantity;
    totalValue += value;
    if (item.type === 'crypto') {
      riskyValue += value;
    }
  }

  if (totalValue === 0) return null;

  const riskyPercent = (riskyValue / totalValue) * 100;

  if (riskyPercent > 50) {
    return {
      type: 'danger',
      message: 'Kripto varlık oranınız %50\'yi aştı! Risk dengelemek için TEFAS fonlarına yönlendirme önerilir.',
      riskyPercent,
    };
  }

  if (riskyPercent > 40) {
    return {
      type: 'warning',
      message: 'Kripto varlık oranınız %40\'ı aştı. Dengeleme yapmayı düşünün.',
      riskyPercent,
    };
  }

  return null;
}
