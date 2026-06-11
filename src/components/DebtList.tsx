import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import {
  CreditCard, Landmark, AlertTriangle, Plus,
  ArrowRight, Calendar, DollarSign, Banknote
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { useFinansStore } from '../store/useFinansStore';
import { formatCompactCurrency, formatShortDate } from '../lib/utils';
import type { Debt, DebtPayment } from '../types';

interface DebtListProps {
  onDebtClick: (id: string) => void;
  onAddDebt: () => void;
  onPayDebt: (debt: Debt) => void;
}

const debtTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  credit_card: CreditCard,
  loan: Landmark,
  other: Banknote,
};

const debtTypeLabels: Record<string, string> = {
  credit_card: 'Kredi Kartı',
  loan: 'Kredi',
  other: 'Diğer Borç',
};

const spring120 = { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.5 };

export function DebtList({ onDebtClick, onAddDebt, onPayDebt }: DebtListProps) {
  const debts = useFinansStore((s) => s.debts);
  const paymentSchedules = useFinansStore((s) => s.paymentSchedules);
  const [filter, setFilter] = useState<'all' | 'active' | 'paid' | 'overdue'>('active');

  const { totalDebt, monthlyDue, overdueCount, filteredDebts } = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const activeDebts = debts.filter((d) => d.status !== 'paid');
    const totalDebt = activeDebts.reduce((sum, d) => sum + d.remainingBalance, 0);

    const monthlyDue = paymentSchedules
      .filter((s) => s.dueDate.startsWith(currentMonth) && !s.isPaid)
      .reduce((sum, s) => sum + s.amount, 0);

    const overdueCount = debts.filter((d) => d.status === 'overdue').length;

    let filtered = [...debts];
    if (filter !== 'all') {
      filtered = debts.filter((d) => d.status === filter);
    }
    // Sort: overdue first, then active, then paid
    filtered.sort((a, b) => {
      const order = { overdue: 0, active: 1, paid: 2 };
      return order[a.status] - order[b.status];
    });

    return { totalDebt, monthlyDue, overdueCount, filteredDebts: filtered };
  }, [debts, paymentSchedules, filter]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring120}
        >
          <GlassCard className="p-4">
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-0.5">
              Toplam Borç
            </p>
            <p className="text-lg font-bold text-rose-400 tabular-nums">
              {formatCompactCurrency(totalDebt)}
            </p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring120, delay: 0.05 }}
        >
          <GlassCard className="p-4">
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-0.5">
              Bu Ay Ödenecek
            </p>
            <p className="text-lg font-bold text-amber-400 tabular-nums">
              {formatCompactCurrency(monthlyDue)}
            </p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring120, delay: 0.1 }}
        >
          <GlassCard className="p-4">
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-0.5">
              Vadesi Geçmiş
            </p>
            <p className={`text-lg font-bold tabular-nums ${overdueCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overdueCount > 0 ? `${overdueCount} adet` : 'Yok'}
            </p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['active', 'all', 'paid', 'overdue'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filter === f
                ? 'bg-[#00c2ff]/10 text-[#00c2ff] border border-[#00c2ff]/20'
                : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10'
            }`}
          >
            {f === 'all' ? 'Tümü' : f === 'active' ? 'Aktif' : f === 'paid' ? 'Ödenmiş' : 'Gecikmiş'}
          </button>
        ))}
      </div>

      {/* Debt List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredDebts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 text-sm mb-4">Henüz borç eklenmemiş</p>
              <button
                onClick={onAddDebt}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                İlk Borcu Ekle
              </button>
            </motion.div>
          ) : (
            filteredDebts.map((debt, index) => {
              const Icon = debtTypeIcons[debt.type] || Banknote;
              const isOverdue = debt.status === 'overdue';
              const isPaid = debt.status === 'paid';
              const isDueSoon = !isPaid && !isOverdue && new Date(debt.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

              return (
                <motion.div
                  key={debt.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ ...spring120, delay: index * 0.03 }}
                >
                  <GlassCard
                    className={`p-4 cursor-pointer hover:bg-white/[0.03] transition-colors ${
                      isOverdue ? 'border-rose-500/20' : isDueSoon ? 'border-amber-500/20' : ''
                    }`}
                    onClick={() => onDebtClick(debt.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isOverdue
                          ? 'bg-rose-500/10'
                          : isPaid
                          ? 'bg-gray-500/10'
                          : 'bg-[#00c2ff]/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isOverdue ? 'text-rose-400' : isPaid ? 'text-gray-500' : 'text-[#00c2ff]'
                        }`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white truncate">{debt.name}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            isOverdue
                              ? 'bg-rose-500/10 text-rose-400'
                              : isPaid
                              ? 'bg-gray-500/10 text-gray-400'
                              : isDueSoon
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {isOverdue ? 'Gecikmiş' : isPaid ? 'Ödenmiş' : 'Aktif'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-white/50">{debtTypeLabels[debt.type]}</span>
                          <span className="text-white/20">·</span>
                          <span className="text-xs text-white/50">
                            Faiz: %{debt.annualInterestRate}
                          </span>
                        </div>
                      </div>

                      {/* Amount & Action */}
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold tabular-nums ${
                          isOverdue ? 'text-rose-400' : isPaid ? 'text-gray-500' : 'text-white'
                        }`}>
                          {formatCompactCurrency(debt.remainingBalance)}
                        </p>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <Calendar className="w-3 h-3 text-white/30" />
                          <span className="text-[10px] text-white/30">
                            {formatShortDate(debt.dueDate)}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-white/20" />
                    </div>

                    {/* Pay Button (only for active/overdue debts) */}
                    {!isPaid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPayDebt(debt);
                        }}
                        className="mt-3 w-full py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        Ödeme Yap
                      </button>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Add Debt FAB */}
      <button
        onClick={onAddDebt}
        className="fixed bottom-24 right-4 z-50 w-11 h-11 rounded-full bg-[#00c2ff] flex items-center justify-center shadow-premium"
      >
        <Plus className="w-5 h-5 text-slate-950" />
      </button>
    </div>
  );
}