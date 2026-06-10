import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Plus, Trash2, Target, Calendar, Link, X } from 'lucide-react';
import { GlassCard, NeonButton, GlassInput, ProgressBar, EmptyState } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { Goal } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../lib/utils';

const goalIcons = ['🚗', '🏠', '✈️', '💻', '📱', '💎', '🎓', '💰', '🎁', '🏖️', '🚀', '⭐'];

export function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, portfolio } = useFinansStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalGoalAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSavedAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalGoalAmount > 0 ? (totalSavedAmount / totalGoalAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Hedefler" 
        subtitle="Finansal hedeflerinizi takip edin"
        action={
          <NeonButton onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1 inline" />
            Yeni Hedef
          </NeonButton>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1">Toplam Hedef</p>
          <p className="text-2xl font-extrabold text-white tracking-tight tabular-nums">{formatCompactCurrency(totalGoalAmount)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1">Biriktirilen</p>
          <p className="text-2xl font-extrabold text-emerald-400 tracking-tight tabular-nums">{formatCompactCurrency(totalSavedAmount)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1">Genel İlerleme</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-extrabold text-[#00c2ff] tracking-tight tabular-nums">{overallProgress.toFixed(1)}%</span>
            <div className="flex-1 max-w-[100px]">
              <ProgressBar value={overallProgress} max={100} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: index * 0.05 }}
              >
                <GoalCard 
                  goal={goal} 
                  onUpdate={(updates) => updateGoal(goal.id, updates)}
                  onDelete={() => deleteGoal(goal.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="Hedef Belirlenmedi"
          description="Gelecek hayalleriniz için bir hedef oluşturun."
          action={
            <NeonButton onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1 inline" />
              Hedef Ekle
            </NeonButton>
          }
        />
      )}

      {/* Add Goal Modal */}
      <GoalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          addGoal(data);
          setIsModalOpen(false);
        }}
        portfolio={portfolio}
      />
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete }: { 
  goal: Goal; 
  onUpdate: (updates: Partial<Goal>) => void;
  onDelete: () => void;
}) {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const [now] = useState(() => Date.now());
  const daysLeft = useMemo(() => {
    return Math.ceil((new Date(goal.deadline).getTime() - now) / (1000 * 60 * 60 * 24));
  }, [goal.deadline, now]);

  return (
    <GlassCard className="p-6 h-full flex flex-col justify-between" hover={false}>
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl shrink-0">
            {goal.icon}
          </div>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-sm font-semibold text-white truncate">{goal.name}</h3>
        <p className="text-[10px] text-white/40 flex items-center gap-1 mt-1">
          <Calendar className="w-3.5 h-3.5" />
          {daysLeft > 0 ? `${daysLeft} gün kaldı` : 'Süre doldu'}
        </p>

        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[10px] font-medium text-white/50">
            <span>Hedef Oranı</span>
            <span className="text-white/80 tabular-nums">{progress.toFixed(1)}%</span>
          </div>
          <ProgressBar value={goal.currentAmount} max={goal.targetAmount} color="purple" />
        </div>

        <div className="space-y-1.5 text-xs mt-4 pt-4 border-t border-white/5">
          <div className="flex justify-between">
            <span className="text-white/40">Toplam Hedef</span>
            <span className="text-white font-medium tabular-nums">{formatCurrency(goal.targetAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Biriktirilen</span>
            <span className="text-emerald-400 font-medium tabular-nums">{formatCurrency(goal.currentAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Kalan Miktar</span>
            <span className="text-amber-400 font-medium tabular-nums">{formatCurrency(remaining)}</span>
          </div>
        </div>

        {goal.linkedAssets.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
              <Link className="w-3 h-3" />
              <span>{goal.linkedAssets.length} varlık ilişkilendirildi</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add buttons */}
      <div className="mt-5 pt-3 border-t border-white/5 flex gap-2">
        {[1000, 5000, 10000].map((amount) => (
          <button
            key={amount}
            onClick={() => onUpdate({ currentAmount: goal.currentAmount + amount })}
            className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[10px] font-semibold transition-colors"
          >
            +{formatCompactCurrency(amount)}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

function GoalModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  portfolio,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: Omit<Goal, 'id'>) => void;
  portfolio: { id: string; symbol: string }[];
}) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [linkedAssets, setLinkedAssets] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!name || !targetAmount || !deadline) return;

    onSubmit({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline,
      icon,
      linkedAssets,
    });

    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setIcon('🎯');
    setLinkedAssets([]);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-sm bg-slate-900 rounded-2xl border border-white/5 shadow-premium overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Yeni Hedef</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto" data-scroll>
          {/* Icon Picker */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">İkon Seçimi</label>
            <div className="flex flex-wrap gap-1.5">
              {goalIcons.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    icon === i 
                      ? 'bg-[#00c2ff]/10 border border-[#00c2ff]/20 text-[#00c2ff]' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Hedef Adı</label>
            <GlassInput
              value={name}
              onChange={setName}
              placeholder="Ev peşinatı, tatil, teknoloji..."
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium">Hedef Tutar (₺)</label>
              <GlassInput
                type="number"
                value={targetAmount}
                onChange={setTargetAmount}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium">Mevcut Birikim (₺)</label>
              <GlassInput
                type="number"
                value={currentAmount}
                onChange={setCurrentAmount}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Hedeflenen Tarih</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/5 text-white focus:outline-none focus:border-[#00c2ff]/40"
            />
          </div>

          {/* Linked Assets */}
          {portfolio.length > 0 && (
            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium">İlişkili Portföy Varlıkları</label>
              <div className="flex flex-wrap gap-1.5">
                {portfolio.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setLinkedAssets(prev => 
                        prev.includes(p.id) 
                          ? prev.filter(id => id !== p.id)
                          : [...prev, p.id]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      linkedAssets.includes(p.id)
                        ? 'bg-[#00c2ff]/10 text-[#00c2ff] border border-[#00c2ff]/20'
                        : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    {p.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/5 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-xl text-xs bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
          >
            İptal
          </button>
          <NeonButton onClick={handleSubmit} className="flex-1 text-xs">
            Kaydet
          </NeonButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
