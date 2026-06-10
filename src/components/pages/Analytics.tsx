import { useState, useMemo } from 'react';
import { TrendingUp, Target, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { SafeChart } from '../ui/SafeChart';
import { GlassCard, GlassInput } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { formatCurrency, formatCompactCurrency, calculateCompoundInterest, calculateFIRE, calculateMoodSpendingImpact } from '../../lib/utils';
import { moodEmojis, moodColors } from '../../data/mockData';

export function Analytics() {
  const { transactions, portfolio } = useFinansStore();
  const [projectionYears, setProjectionYears] = useState(5);
  const [monthlySaving, setMonthlySaving] = useState(5000);
  const [annualRate, setAnnualRate] = useState(15);

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

  const projectionData = useMemo(() => {
    const currentSavings = portfolio.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
    const data = [];
    
    for (let year = 0; year <= projectionYears; year++) {
      const value = calculateCompoundInterest(currentSavings, monthlySaving, annualRate, year);
      data.push({
        year: `${year} Yıl`,
        value,
        contributions: currentSavings + (monthlySaving * 12 * year),
      });
    }
    
    return data;
  }, [portfolio, projectionYears, monthlySaving, annualRate]);

  const fireData = useMemo(() => {
    const totalSavings = portfolio.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((sum, t) => sum + t.amount, 0);
    
    return calculateFIRE(monthlyExpenses, totalSavings);
  }, [transactions, portfolio]);

  const moodAnalysis = useMemo(() => {
    return calculateMoodSpendingImpact(transactions);
  }, [transactions]);

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

  const COLORS = ['#00c2ff', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Analiz" 
        subtitle="Finansal verilerinizi derinlemesine analiz edin"
      />

      {/* Projection Calculator */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#00c2ff]/10">
            <TrendingUp className="w-5 h-5 text-[#00c2ff]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Bileşik Faiz Projeksiyonu</h3>
            <p className="text-xs text-white/40">Gelecekteki tahmini birikim oranları</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Aylık Tasarruf (₺)</label>
            <GlassInput
              type="number"
              value={monthlySaving}
              onChange={(v) => setMonthlySaving(parseFloat(v) || 0)}
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Yıllık Getiri (%)</label>
            <GlassInput
              type="number"
              value={annualRate}
              onChange={(v) => setAnnualRate(parseFloat(v) || 0)}
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Vade (Yıl)</label>
            <GlassInput
              type="number"
              value={projectionYears}
              onChange={(v) => setProjectionYears(parseInt(v) || 1)}
            />
          </div>
        </div>

        <SafeChart height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.15)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.15)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0e1524', 
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '12px'
                }}
                formatter={(value) => [`₺${Number(value).toLocaleString('tr-TR')}`, '']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#00c2ff" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="contributions" 
                stroke="#8b5cf6" 
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </SafeChart>

        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/5">
          <div className="text-center">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">1 Yıl Sonra</p>
            <p className="text-sm font-bold text-[#00c2ff] tabular-nums">
              {formatCompactCurrency(projectionData[1]?.value || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">3 Yıl Sonra</p>
            <p className="text-sm font-bold text-purple-400 tabular-nums">
              {formatCompactCurrency(projectionData[3]?.value || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">5 Yıl Sonra</p>
            <p className="text-sm font-bold text-emerald-400 tabular-nums">
              {formatCompactCurrency(projectionData[5]?.value || 0)}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FIRE Calculator */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">FIRE Mali Özgürlük</h3>
              <p className="text-xs text-white/40">Hedefe yaklaşma analizi</p>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div className="text-4xl font-extrabold text-white tracking-tight tabular-nums">
              {fireData.progressPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-white/40 border-l border-white/5 pl-4">
              <span>Mali özgürlük barajının tamamlanma oranı</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs py-2 border-b border-white/5">
              <span className="text-white/40">FIRE Hedefi</span>
              <span className="font-semibold text-white tabular-nums">{formatCompactCurrency(fireData.fireNumber)}</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 border-b border-white/5">
              <span className="text-white/40">Mevcut Toplam Varlık</span>
              <span className="font-semibold text-[#00c2ff] tabular-nums">
                {formatCompactCurrency(fireData.yearsCovered * 12 * fireData.fireNumber / 25)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs py-2">
              <span className="text-white/40">Çalışmadan Geçinilebilir Süre</span>
              <span className="font-semibold text-amber-400 tabular-nums">
                {fireData.yearsCovered > 0 
                  ? `${fireData.yearsCovered.toFixed(1)} Yıl` 
                  : 'Henüz değil'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Mood Spending */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Ruh Hali & Harcama</h3>
              <p className="text-xs text-white/40">Duyguların harcama sıklığına etkisi</p>
            </div>
          </div>

          {moodAnalysis.length > 0 ? (
            <SafeChart height={140}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodAnalysis} layout="vertical" margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                  <XAxis type="number" stroke="rgba(255,255,255,0.15)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="mood" stroke="rgba(255,255,255,0.15)" fontSize={12} 
                    tickLine={false} axisLine={false} tickFormatter={(v) => moodEmojis[v] || v} width={35} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0e1524', 
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`₺${Number(value).toLocaleString('tr-TR')}`, '']}
                  />
                  <Bar dataKey="totalSpent" radius={[0, 4, 4, 0]} barSize={10}>
                    {moodAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={moodColors[entry.mood] || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SafeChart>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs text-white/40">
              Henüz ruh hali harcama verisi yok
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
            {moodAnalysis.slice(0, 2).map((item) => (
              <div key={item.mood} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <span className="text-xl">{moodEmojis[item.mood]}</span>
                <div>
                  <p className="text-xs font-bold text-white tabular-nums">{formatCurrency(item.average)}</p>
                  <p className="text-[10px] text-white/40">Ortalama Harcama</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Aylık Trend</h3>
              <p className="text-xs text-white/40">Gelir ve gider analizi</p>
            </div>
          </div>

          {monthlyData.length > 0 ? (
            <SafeChart height={180}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.15)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.15)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0e1524', 
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`₺${Number(value).toLocaleString('tr-TR')}`, '']}
                  />
                  <Bar dataKey="gelir" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={8} />
                  <Bar dataKey="gider" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </SafeChart>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs text-white/40">
              Henüz aylık analiz verisi yok
            </div>
          )}
        </GlassCard>

        {/* Category Breakdown */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Target className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Kategori Dağılımı</h3>
              <p className="text-xs text-white/40">Gider kategorileri sıralaması</p>
            </div>
          </div>

          {categoryBreakdown.length > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <div className="w-1/2">
                <SafeChart height={140}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={56}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </SafeChart>
              </div>
              <div className="w-1/2 space-y-1.5">
                {categoryBreakdown.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-white/50 truncate">{item.name}</span>
                    </div>
                    <span className="text-white/85 font-semibold tabular-nums shrink-0">{formatCompactCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs text-white/40">
              Henüz harcama kaydı yok
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}