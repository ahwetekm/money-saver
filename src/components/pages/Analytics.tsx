import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Target, AlertTriangle, BarChart3, PieChart as PieChartIcon, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { SafeChart } from '../ui/SafeChart';
import { GlassCard, GlassInput, Badge, ProgressBar } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { formatCurrency, formatPercentage, calculateCompoundInterest, calculateFIRE, calculateMoodSpendingImpact } from '../../lib/utils';
import { moodEmojis, moodColors } from '../../data/mockData';

export function Analytics() {
  const { transactions, portfolio, goals, budgets } = useFinansStore();
  const [projectionYears, setProjectionYears] = useState(5);
  const [monthlySaving, setMonthlySaving] = useState(5000);
  const [annualRate, setAnnualRate] = useState(15);

  // Monthly income/expense trend
  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      const month = t.date.slice(0, 7);
      if (!months[month]) months[month] = { income: 0, expense: 0 };
      if (t.type === 'income') months[month].income += t.amount;
      else months[month].expense += t.amount;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data]) => ({
        month: month.slice(5),
        gelir: data.income,
        gider: data.expense,
        net: data.income - data.expense,
      }));
  }, [transactions]);

  // Projection calculation
  const projectionData = useMemo(() => {
    const currentSavings = portfolio.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
    const data: { year: string; value: number; contributions: number }[] = [];
    
    for (let year = 0; year <= projectionYears; year++) {
      const value = calculateCompoundInterest(currentSavings, monthlySaving, annualRate, year);
      data.push({
        year: `${year}. Yıl`,
        value,
        contributions: currentSavings + (monthlySaving * 12 * year),
      });
    }
    
    return data;
  }, [portfolio, projectionYears, monthlySaving, annualRate]);

  // FIRE calculation
  const fireData = useMemo(() => {
    const totalSavings = portfolio.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((sum, t) => sum + t.amount, 0);
    
    return calculateFIRE(monthlyExpenses, totalSavings);
  }, [transactions, portfolio]);

  // Mood spending analysis
  const moodAnalysis = useMemo(() => {
    return calculateMoodSpendingImpact(transactions);
  }, [transactions]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div>
      <PageHeader 
        title="Analitik" 
        subtitle="Finansal verilerinizi derinlemesine analiz edin"
      />

      {/* Projection Calculator */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Bileşik Faiz Projeksiyonu</h3>
            <p className="text-sm text-white/50">Gelecekteki birikiminizi hesaplayın</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-white/60 mb-2">Aylık Tasarruf (₺)</label>
            <GlassInput
              type="number"
              value={monthlySaving}
              onChange={(v) => setMonthlySaving(parseFloat(v) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Yıllık Getiri (%)</label>
            <GlassInput
              type="number"
              value={annualRate}
              onChange={(v) => setAnnualRate(parseFloat(v) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Yıl</label>
            <GlassInput
              type="number"
              value={projectionYears}
              onChange={(v) => setProjectionYears(parseInt(v) || 1)}
            />
          </div>
        </div>

        <SafeChart height={256}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15,23,42,0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#06b6d4" 
                strokeWidth={3}
                dot={{ fill: '#06b6d4', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="contributions" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </SafeChart>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-sm text-white/50">1 Yıl Sonra</p>
            <p className="text-lg font-bold text-cyan-400">
              {formatCurrency(projectionData[1]?.value || 0)}
            </p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-sm text-white/50">3 Yıl Sonra</p>
            <p className="text-lg font-bold text-purple-400">
              {formatCurrency(projectionData[3]?.value || 0)}
            </p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-sm text-white/50">5 Yıl Sonra</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(projectionData[5]?.value || 0)}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* FIRE Calculator */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Target className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">FIRE Sayacı</h3>
              <p className="text-sm text-white/50">Mali özgürlük hedefinize ne kadar kaldı?</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="relative w-40 h-40 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(100, fireData.progressPercent) * 4.4} 440`}
                  initial={{ strokeDasharray: '0 440' }}
                  animate={{ strokeDasharray: `${Math.min(100, fireData.progressPercent) * 4.4} 440` }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{fireData.progressPercent.toFixed(1)}%</span>
                <span className="text-sm text-white/50">tamamlandı</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
              <span className="text-white/60">FIRE Numarası</span>
              <span className="font-medium text-white">{formatCurrency(fireData.fireNumber)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
              <span className="text-white/60">Mevcut Birikim</span>
              <span className="font-medium text-cyan-400">{formatCurrency(fireData.yearsCovered * 12 * fireData.fireNumber / 25)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
              <span className="text-white/60">Çalışmadan Geçinilebilir</span>
              <span className="font-medium text-amber-400">
                {fireData.yearsCovered > 0 
                  ? `${fireData.yearsCovered.toFixed(1)} yıl` 
                  : 'Henüz değil'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Mood Spending */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Hava Durumu Analizi</h3>
              <p className="text-sm text-white/50">Ruh hali ve harcama ilişkisi</p>
            </div>
          </div>

          {moodAnalysis.length > 0 ? (
            <SafeChart height={192}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodAnalysis} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="mood" stroke="rgba(255,255,255,0.4)" fontSize={12} 
                    tickFormatter={(v) => moodEmojis[v] || v} width={40} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15,23,42,0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="totalSpent" radius={[0, 4, 4, 0]}>
                    {moodAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={moodColors[entry.mood] || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SafeChart>
          ) : (
            <div className="h-48 flex items-center justify-center text-white/40">
              Henüz mood verisi yok
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4">
            {moodAnalysis.slice(0, 4).map((item) => (
              <div key={item.mood} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <span className="text-xl">{moodEmojis[item.mood]}</span>
                <div>
                  <p className="text-sm text-white/80">{formatCurrency(item.average)}</p>
                  <p className="text-xs text-white/40">ort. harcama</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Aylık Trend</h3>
              <p className="text-sm text-white/50">Gelir ve gider karşılaştırması</p>
            </div>
          </div>

          {monthlyData.length > 0 ? (
            <SafeChart height={256}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15,23,42,0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SafeChart>
          ) : (
            <div className="h-64 flex items-center justify-center text-white/40">
              Henüz veri yok
            </div>
          )}
        </GlassCard>

        {/* Category Breakdown */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20">
              <PieChartIcon className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Kategori Dağılımı</h3>
              <p className="text-sm text-white/50">Harcama kategorileri</p>
            </div>
          </div>

          {categoryBreakdown.length > 0 ? (
            <SafeChart height={192}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15,23,42,0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </SafeChart>
          ) : (
            <div className="h-48 flex items-center justify-center text-white/40">
              Henüz harcama yok
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryBreakdown.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm text-white/60 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
