import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Calendar, Bell, X } from 'lucide-react';
import { GlassCard, NeonButton, GlassInput, GlassSelect, Badge, EmptyState } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { Subscription } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../lib/utils';

export function Subscriptions() {
  const { subscriptions, addSubscription, deleteSubscription } = useFinansStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const monthlyTotal = subscriptions
    .filter(s => s.interval === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0);
  const yearlyTotal = subscriptions
    .filter(s => s.interval === 'yearly')
    .reduce((sum, s) => sum + s.amount / 12, 0);
  const totalMonthly = monthlyTotal + yearlyTotal;

  const upcomingPayments = useMemo(() => {
    return subscriptions
      .map(s => ({
        ...s,
        daysUntil: Math.ceil((new Date(s.nextPayment).getTime() - now) / (1000 * 60 * 60 * 24)),
      }))
      .filter(s => s.daysUntil >= 0 && s.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [subscriptions, now]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Abonelikler" 
        subtitle="Tekrarlayan ödemelerinizi takip edin"
        action={
          <NeonButton onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1 inline" />
            Abonelik Ekle
          </NeonButton>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1">Aylık Toplam</p>
          <p className="text-2xl font-extrabold text-white tracking-tight tabular-nums">{formatCompactCurrency(totalMonthly)}</p>
          <p className="text-[10px] text-white/40 mt-1">{subscriptions.length} aktif abonelik</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1">Yıllık Maliyet</p>
          <p className="text-2xl font-extrabold text-amber-400 tracking-tight tabular-nums">{formatCompactCurrency(totalMonthly * 12)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1">Yaklaşan Ödemeler</p>
          <p className="text-2xl font-extrabold text-[#00c2ff] tracking-tight tabular-nums">{upcomingPayments.length}</p>
          <p className="text-[10px] text-white/40 mt-1">Önümüzdeki 30 gün içinde</p>
        </GlassCard>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <GlassCard className="p-5 border border-amber-500/10 bg-slate-900/50">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Yaklaşan Ödemeler</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingPayments.slice(0, 6).map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-base shrink-0">
                  {sub.category === 'Streaming' ? '📺' : sub.category === 'Yazılım' ? '💻' : '📱'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{sub.name}</p>
                  <p className="text-[10px] text-white/40 mt-0.5 tabular-nums">{formatCurrency(sub.amount)}</p>
                </div>
                <Badge variant={sub.daysUntil <= 3 ? 'danger' : sub.daysUntil <= 7 ? 'warning' : 'info'} className="shrink-0">
                  {sub.daysUntil === 0 ? 'Bugün' : `${sub.daysUntil} gün`}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Subscriptions List */}
      {subscriptions.length > 0 ? (
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white/80 tracking-tight mb-4">Abonelik Listesi</h3>
          <div className="space-y-2">
            <AnimatePresence>
              {subscriptions.map((sub, index) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <SubscriptionCard 
                    subscription={sub} 
                    onDelete={() => deleteSubscription(sub.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      ) : (
        <EmptyState
          icon={Calendar}
          title="Abonelik Bulunamadı"
          description="Tekrarlayan abonelik ödemelerinizi ekleyin."
          action={
            <NeonButton onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1 inline" />
              Abonelik Ekle
            </NeonButton>
          }
        />
      )}

      {/* Add Subscription Modal */}
      <SubscriptionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          addSubscription(data);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

function SubscriptionCard({ subscription, onDelete }: { subscription: Subscription; onDelete: () => void }) {
  const [now] = useState(() => Date.now());
  const daysUntil = useMemo(() => {
    return Math.ceil((new Date(subscription.nextPayment).getTime() - now) / (1000 * 60 * 60 * 24));
  }, [subscription.nextPayment, now]);

  const categoryIcons: Record<string, string> = {
    'Streaming': '📺',
    'Yazılım': '💻',
    'Müzik': '🎵',
    'Oyun': '🎮',
    'Cloud': '☁️',
    'Eğitim': '📚',
    'Sağlık': '💪',
    'Diğer': '📱',
  };

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-all">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shrink-0">
        {categoryIcons[subscription.category] || '📱'}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-white truncate">{subscription.name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-white/40">{subscription.category}</span>
          <span className="text-[10px] text-white/30">•</span>
          <span className="text-[10px] text-white/40">
            {subscription.interval === 'monthly' ? 'Aylık' : 'Yıllık'}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-white tabular-nums">{formatCurrency(subscription.amount)}</p>
        <p className="text-[10px] text-white/40 mt-0.5">
          {daysUntil > 0 ? `${daysUntil} gün sonra` : daysUntil === 0 ? 'Bugün' : 'Gecikmiş'}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function SubscriptionModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: Omit<Subscription, 'id'>) => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Streaming');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [nextPayment, setNextPayment] = useState('');

  const handleSubmit = () => {
    if (!name || !amount || !nextPayment) return;

    onSubmit({
      name,
      amount: parseFloat(amount),
      category,
      interval,
      nextPayment,
    });

    setName('');
    setAmount('');
    setNextPayment('');
  };

  if (!isOpen) return null;

  const categories = ['Streaming', 'Yazılım', 'Müzik', 'Oyun', 'Cloud', 'Eğitim', 'Sağlık', 'Diğer'];

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
          <h3 className="text-sm font-bold text-white">Yeni Abonelik</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Hizmet Adı</label>
            <GlassInput
              value={name}
              onChange={setName}
              placeholder="Netflix, Spotify, Adobe..."
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Tutar (₺)</label>
            <GlassInput
              type="number"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Kategori</label>
            <GlassSelect
              value={category}
              onChange={setCategory}
              options={categories.map(c => ({ value: c, label: c }))}
            />
          </div>

          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
            <button
              onClick={() => setInterval('monthly')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                interval === 'monthly' 
                  ? 'bg-white/5 text-[#00c2ff]' 
                  : 'text-white/45 hover:text-white'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                interval === 'yearly' 
                  ? 'bg-white/5 text-[#00c2ff]' 
                  : 'text-white/45 hover:text-white'
              }`}
            >
              Yıllık
            </button>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Ödeme Tarihi</label>
            <input
              type="date"
              value={nextPayment}
              onChange={(e) => setNextPayment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/5 text-white focus:outline-none focus:border-[#00c2ff]/40"
            />
          </div>
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
