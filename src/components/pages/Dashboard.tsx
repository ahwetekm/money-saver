import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, AlertTriangle, Zap, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { GlassCard, ProgressBar } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { formatCompactCurrency, getCurrentMonth, calculateFinancialIQ, checkRebalanceNeeded } from '../../lib/utils';
import { categoryColors, categoryIcons } from '../../data/mockData';
import { SafeChart } from '../ui/SafeChart';

export function Dashboard() {
  const transactions = useFinansStore((s) => s.transactions);
  const budgets = useFinansStore((s) => s.budgets);
  const portfolio = useFinansStore((s) => s.portfolio);
  const goals = useFinansStore((s) => s.goals);

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

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

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

  const totalAssets = balance + portfolioValue;
  const isProfitPositive = portfolioProfit >= 0;
  
  // Calculate relative change label or dynamic percentage if cost is available
  const profitLabel = isProfitPositive 
    ? `+${formatCompactCurrency(portfolioProfit)}` 
    : formatCompactCurrency(portfolioProfit);

  // Financial Health description
  const healthStatus = financialIQ >= 80 
    ? 'Çok İyi' 
    : financialIQ >= 60 
    ? 'İyi Seviyede' 
    : 'Geliştirilmeli';

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Finansal Panel" 
        subtitle="Finansal durumunuz tek bakışta"
      />

      {/* Hero Asset Card (Apple Wallet / Copilot Money style: Merged stats) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard className="p-6 relative overflow-hidden bg-slate-900 border border-white/5 shadow-premium">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">Toplam Varlık</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                {formatCompactCurrency(totalAssets)}
              </h2>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isProfitPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {isProfitPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  {profitLabel}
                </span>
                <span className="text-white/40 text-xs">bu ay</span>
              </div>
            </div>
            
            {/* Embedded Sub-stats layout */}
            <div className="grid grid-cols-3 gap-6 sm:gap-8 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/5 sm:pl-8">
              <div>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-0.5">Gelir</p>
                <p className="text-sm font-semibold text-emerald-400 tabular-nums">{formatCompactCurrency(totalIncome)}</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-0.5">Gider</p>
                <p className="text-sm font-semibold text-rose-400 tabular-nums">{formatCompactCurrency(totalExpense)}</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-0.5">Net Durum</p>
                <p className={`text-sm font-semibold tabular-nums ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {balance >= 0 ? '+' : ''}{formatCompactCurrency(balance)}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Nakit Akışı (Stripe style refined area chart) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white/80 tracking-tight">Nakit Akışı (7 Gün)</h3>
            <span className="text-[11px] text-white/40 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#00c2ff]" />
              Günlük Gelir / Gider
            </span>
          </div>
          <SafeChart height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.15)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.15)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                  tickFormatter={(v) => `₺${v}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0e1524', 
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '12px'
                  }} 
                  formatter={(value) => [`₺${value}`, '']}
                  labelFormatter={(label) => `${label} Tarihli İşlemler`}
                />
                <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={1.5} fill="url(#incomeGradient)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={1.5} fill="url(#expenseGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </SafeChart>
        </GlassCard>
      </motion.div>

      {/* Grid: Financial Health & Expense Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finansal Sağlık (Re-styled Financial Health Card) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <GlassCard className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-white/80 tracking-tight">Finansal Sağlık</h3>
                <Zap className="w-4 h-4 text-[#00c2ff]" />
              </div>
              
              <div className="flex items-end gap-4 mb-6">
                <span className="text-5xl font-extrabold text-white tracking-tight tabular-nums">{financialIQ}</span>
                <div className="pb-1">
                  <p className="text-xs font-semibold text-[#00c2ff]">{healthStatus}</p>
                  <p className="text-[11px] text-white/40">Geçen aya göre +4 puan</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Bütçe Sadakati</span>
                  <span className="text-white/80 font-medium">{budgetAdherence.toFixed(0)}%</span>
                </div>
                <ProgressBar value={budgetAdherence} max={100} color="cyan" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Tasarruf Oranı</span>
                  <span className="text-white/80 font-medium">{savingsRate.toFixed(0)}%</span>
                </div>
                <ProgressBar value={savingsRate} max={100} color="purple" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Harcama Dağılımı */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white/80 tracking-tight mb-4">Harcama Dağılımı</h3>
              {pieData.length > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="w-1/2">
                    <SafeChart height={140}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={56}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </SafeChart>
                  </div>
                  <div className="w-1/2 space-y-1.5">
                    {pieData.slice(0, 4).map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-white/50 truncate">{item.name}</span>
                        </div>
                        <span className="text-white/80 font-semibold tabular-nums shrink-0">{formatCompactCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-white/40">
                  Henüz harcama yok
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Grid: Budget Status & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bütçe Durumu */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white/80 tracking-tight">Bütçe Durumu</h3>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            {budgets.length > 0 ? (
              <div className="space-y-4">
                {budgets.slice(0, 3).map((budget) => {
                  const percent = (budget.spent / budget.limit) * 100;
                  const isWarning = percent >= 80;
                  const isDanger = percent >= 100;
                  return (
                    <div key={budget.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span>{categoryIcons[budget.category] || '📌'}</span>
                          <span className="text-white/70 font-medium truncate">{budget.category}</span>
                        </div>
                        <span className={`font-semibold tabular-nums ${
                          isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-white/60'
                        }`}>
                          {formatCompactCurrency(budget.spent)} / {formatCompactCurrency(budget.limit)}
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
              <div className="text-center py-6 text-xs text-white/40">
                Henüz bütçe tanımlanmadı
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Hedefler */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white/80 tracking-tight">Hedefler</h3>
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            {goals.length > 0 ? (
              <div className="space-y-3.5">
                {goalsProgress.map((goal) => (
                  <div key={goal.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg shrink-0">
                      {goal.icon}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/80 font-medium truncate">{goal.name}</span>
                        <span className="text-white/40 font-semibold tabular-nums">{goal.percent.toFixed(0)}%</span>
                      </div>
                      <ProgressBar value={goal.currentAmount} max={goal.targetAmount} color="purple" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-white/40">
                Henüz hedef belirlenmedi
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Rebalance Alert */}
      {rebalanceAlert && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard 
            className="p-4 border border-rose-500/10"
            gradient="linear-gradient(135deg, rgba(245,158,11,0.06), rgba(239,68,68,0.06))"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-400 mb-0.5">Portföy Dengeleme Uyarısı</h4>
                <p className="text-xs text-white/60 leading-relaxed">{rebalanceAlert.message}</p>
                <p className="text-[10px] text-white/40 mt-1">
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
