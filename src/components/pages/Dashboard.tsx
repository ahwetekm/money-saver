import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Wallet, PiggyBank, Target, 
  AlertTriangle, Zap
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { GlassCard, Badge, ProgressBar } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { formatCurrency, getCurrentMonth, calculateFinancialIQ, checkRebalanceNeeded } from '../../lib/utils';
import { categoryColors, categoryIcons } from '../../data/mockData';
import { SafeChart } from '../ui/SafeChart';

export function Dashboard() {
  // Granüler selector: Her state değişikliğinde tüm component re-render olmaz
  const transactions = useFinansStore((s) => s.transactions);
  const budgets = useFinansStore((s) => s.budgets);
  const portfolio = useFinansStore((s) => s.portfolio);
  const goals = useFinansStore((s) => s.goals);

  // Tüm ağır hesaplamalar useMemo ile cache'lenir
  // Sadece dependency'ler değiştiğinde yeniden hesaplanır
  const computed = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    
    const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const portfolioValue = portfolio.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    const portfolioProfit = portfolio.reduce((sum, item) => {
      const cost = item.averageCost * item.quantity;
      const current = item.currentPrice * item.quantity;
      return sum + (current - cost);
    }, 0);

    const budgetAdherence = budgets.length > 0 
      ? budgets.reduce((sum, b) => sum + Math.min(100, (b.spent / b.limit) * 100), 0) / budgets.length 
      : 100;
    const financialIQ = calculateFinancialIQ(budgetAdherence, savingsRate, 70, 60);

    const rebalanceAlert = checkRebalanceNeeded(portfolio);

    const expenseByCategory = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const pieData = Object.entries(expenseByCategory).map(([category, amount]) => ({
      name: category,
      value: amount,
      color: categoryColors[category] || '#6B7280',
    }));

    // Cash flow for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    // Transaction lookup map for O(1) access instead of O(n) filter
    const txByDate = new Map<string, typeof transactions>();
    for (const t of transactions) {
      const existing = txByDate.get(t.date) || [];
      existing.push(t);
      txByDate.set(t.date, existing);
    }

    const cashFlowData = last7Days.map(date => {
      const dayTx = txByDate.get(date) || [];
      const income = dayTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return { date: date.slice(5), income, expense, net: income - expense };
    });

    const goalsProgress = goals.map(g => ({
      ...g,
      percent: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
    })).slice(0, 3);

    return {
      totalIncome, totalExpense, balance, savingsRate,
      portfolioValue, portfolioProfit, financialIQ, budgetAdherence,
      rebalanceAlert, pieData, cashFlowData, goalsProgress,
    };
  }, [transactions, budgets, portfolio, goals]);

  const {
    totalIncome, totalExpense, balance, savingsRate,
    portfolioValue, portfolioProfit, financialIQ, budgetAdherence,
    rebalanceAlert, pieData, cashFlowData, goalsProgress,
  } = computed;

  const statCards = [
    {
      title: 'Toplam Varlık',
      value: formatCurrency(balance + portfolioValue),
      change: portfolioProfit >= 0 ? `+${formatCurrency(portfolioProfit)}` : formatCurrency(portfolioProfit),
      changeType: portfolioProfit >= 0 ? 'positive' : 'negative',
      icon: Wallet,
      gradient: 'from-cyan-500/20 to-blue-500/20',
      bgGradient: 'rgba(6,182,212,0.1)',
    },
    {
      title: 'Aylık Gelir',
      value: formatCurrency(totalIncome),
      change: '+12%',
      changeType: 'positive',
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 to-green-500/20',
      bgGradient: 'rgba(16,185,129,0.1)',
    },
    {
      title: 'Aylık Gider',
      value: formatCurrency(totalExpense),
      change: '-5%',
      changeType: 'negative',
      icon: TrendingDown,
      gradient: 'from-rose-500/20 to-red-500/20',
      bgGradient: 'rgba(244,63,94,0.1)',
    },
    {
      title: 'Tasarruf Oranı',
      value: `${savingsRate.toFixed(1)}%`,
      change: savingsRate >= 20 ? 'İyi' : 'Düşük',
      changeType: savingsRate >= 20 ? 'positive' : 'warning',
      icon: PiggyBank,
      gradient: 'from-purple-500/20 to-pink-500/20',
      bgGradient: 'rgba(168,85,247,0.1)',
    },
  ];

  return (
    <div>
      <PageHeader 
        title="Finansal Panel" 
        subtitle="Tüm finansal durumunuz tek bakışta"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-6" gradient={`linear-gradient(135deg, ${stat.bgGradient}, transparent)`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <Badge variant={stat.changeType === 'positive' ? 'success' : stat.changeType === 'negative' ? 'danger' : 'warning'}>
                  {stat.change}
                </Badge>
              </div>
              <p className="text-white/50 text-sm mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Financial IQ Card */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Finansal IQ</h3>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#iqGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${financialIQ * 3.52} 352`}
                  initial={{ strokeDasharray: '0 352' }}
                  animate={{ strokeDasharray: `${financialIQ * 3.52} 352` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                <defs>
                  <linearGradient id="iqGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{financialIQ}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Bütçe Sadakati</span>
              <span className="text-white">{budgetAdherence.toFixed(0)}%</span>
            </div>
            <ProgressBar value={budgetAdherence} max={100} color="cyan" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Tasarruf Oranı</span>
              <span className="text-white">{savingsRate.toFixed(0)}%</span>
            </div>
            <ProgressBar value={savingsRate} max={100} color="purple" />
          </div>
        </GlassCard>

        {/* Expense Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Harcama Dağılımı</h3>
          {pieData.length > 0 ? (
            <SafeChart height={192}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </SafeChart>
          ) : (
            <div className="h-48 flex items-center justify-center text-white/40">
              Henüz harcama yok
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-white/60">{item.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Cash Flow */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Nakit Akışı (7 Gün)</h3>
          <SafeChart height={192}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15,23,42,0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }} 
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGradient)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </SafeChart>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Alerts */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Bütçe Durumu</h3>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          {budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.slice(0, 4).map((budget) => {
                const percent = (budget.spent / budget.limit) * 100;
                const isWarning = percent >= 80;
                const isDanger = percent >= 100;
                return (
                  <div key={budget.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{categoryIcons[budget.category] || '📌'}</span>
                        <span className="text-white/80">{budget.category}</span>
                      </div>
                      <span className={`text-sm ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-white/60'}`}>
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                      </span>
                    </div>
                    <ProgressBar 
                      value={budget.spent} 
                      max={budget.limit} 
                      color={isDanger ? 'red' : isWarning ? 'amber' : 'cyan'} 
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40">
              Henüz bütçe tanımlanmadı
            </div>
          )}
        </GlassCard>

        {/* Goals Progress */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Hedefler</h3>
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          {goals.length > 0 ? (
            <div className="space-y-4">
              {goalsProgress.map((goal) => (
                <div key={goal.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-2xl">
                    {goal.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{goal.name}</span>
                      <span className="text-sm text-white/60">{goal.percent.toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={goal.currentAmount} max={goal.targetAmount} color="purple" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40">
              Henüz hedef belirlenmedi
            </div>
          )}
        </GlassCard>
      </div>

      {/* Rebalance Alert */}
      {rebalanceAlert && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <GlassCard 
            className="p-4"
            gradient="linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1))"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-400 mb-1">Portföy Dengeleme Uyarısı</h4>
                <p className="text-sm text-white/70">{rebalanceAlert.message}</p>
                <p className="text-xs text-white/50 mt-2">
                  Mevcut riskli varlık oranı: %{rebalanceAlert.riskyPercent.toFixed(1)}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
