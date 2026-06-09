import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Trash2, Target, Calendar, Link, X } from 'lucide-react';
import { GlassCard, NeonButton, GlassInput, ProgressBar, Badge, EmptyState } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { Goal } from '../../types';
import { formatCurrency, formatCompactCurrency, formatDate } from '../../lib/utils';

const goalIcons = ['🚗', '🏠', '✈️', '💻', '📱', '💎', '🎓', '💰', '🎁', '🏖️', '🚀', '⭐'];

export function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, portfolio } = useFinansStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalGoalAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSavedAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalGoalAmount > 0 ? (totalSavedAmount / totalGoalAmount) * 100 : 0;

  return (
    <div>
      <PageHeader 
        title="Hedefler" 
        subtitle="Finansal hedeflerinizi takip edin"
        action={
          <NeonButton onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2 inline" />
            Yeni Hedef
          </NeonButton>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <GlassCard className="p-4 sm:p-6">
          <p className="text-white/50 text-sm mb-1">Toplam Hedef</p>
          <p className="text-lg sm:text-2xl font-bold text-white truncate">{formatCompactCurrency(totalGoalAmount)}</p>
        </GlassCard>
        <GlassCard className="p-4 sm:p-6">
          <p className="text-white/50 text-sm mb-1">Birikilen</p>
          <p className="text-lg sm:text-2xl font-bold text-emerald-400 truncate">{formatCompactCurrency(totalSavedAmount)}</p>
        </GlassCard>
        <GlassCard className="p-4 sm:p-6">
          <p className="text-white/50 text-sm mb-1">Genel İlerleme</p>
          <p className="text-lg sm:text-2xl font-bold text-cyan-400">{overallProgress.toFixed(1)}%</p>
          <ProgressBar value={overallProgress} max={100} className="mt-2" />
        </GlassCard>
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
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
          title="Henüz hedef yok"
          description="Finansal hedeflerinizi ekleyerek ilerlemenizi takip edin."
          action={
            <NeonButton onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2 inline" />
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
  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <GlassCard className="p-6" hover={false}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-3xl">
          {goal.icon}
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-lg font-semibold text-white mb-1">{goal.name}</h3>
      <p className="text-sm text-white/50 mb-4">
        <Calendar className="w-4 h-4 inline mr-1" />
        {daysLeft > 0 ? `${daysLeft} gün kaldı` : 'Süre doldu'}
      </p>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">İlerleme</span>
          <span className="text-white font-medium">{progress.toFixed(1)}%</span>
        </div>
        <ProgressBar value={goal.currentAmount} max={goal.targetAmount} color="purple" />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/50">Hedef</span>
          <span className="text-white">{formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Birikilen</span>
          <span className="text-emerald-400">{formatCurrency(goal.currentAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Kalan</span>
          <span className="text-amber-400">{formatCurrency(remaining)}</span>
        </div>
      </div>

      {goal.linkedAssets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Link className="w-3 h-3" />
            <span>{goal.linkedAssets.length} varlık bağlandı</span>
          </div>
        </div>
      )}

      {/* Quick add buttons */}
      <div className="mt-4 flex gap-2">
        {[1000, 5000, 10000].map((amount) => (
          <button
            key={amount}
            onClick={() => onUpdate({ currentAmount: goal.currentAmount + amount })}
            className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors"
          >
            +{formatCurrency(amount)}
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

    // Reset
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95">
          <h3 className="text-xl font-semibold text-white">Yeni Hedef</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Icon Picker */}
          <div>
            <label className="block text-sm text-white/60 mb-2">İkon</label>
            <div className="flex flex-wrap gap-2">
              {goalIcons.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-xl text-xl transition-all ${
                    icon === i 
                      ? 'bg-purple-500/20 border border-purple-500/30' 
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
            <label className="block text-sm text-white/60 mb-2">Hedef Adı</label>
            <GlassInput
              value={name}
              onChange={setName}
              placeholder="Araba, Tatil, Ev..."
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Hedef Tutar (₺)</label>
              <GlassInput
                type="number"
                value={targetAmount}
                onChange={setTargetAmount}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Mevcut Tutar (₺)</label>
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
            <label className="block text-sm text-white/60 mb-2">Hedef Tarih</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Linked Assets */}
          {portfolio.length > 0 && (
            <div>
              <label className="block text-sm text-white/60 mb-2">Bağlı Varlıklar</label>
              <div className="flex flex-wrap gap-2">
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
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      linkedAssets.includes(p.id)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {p.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3 sticky bottom-0 bg-slate-900/95">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
          >
            İptal
          </button>
          <NeonButton onClick={handleSubmit} className="flex-1">
            Kaydet
          </NeonButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
