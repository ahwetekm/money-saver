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
    <div>
      <PageHeader 
        title="Abonelikler" 
        subtitle="Tekrarlayan ödemelerinizi takip edin"
        action={
          <NeonButton onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2 inline" />
            Yeni Abonelik
          </NeonButton>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <GlassCard className="p-4 sm:p-6">
          <p className="text-white/50 text-sm mb-1">Aylık Toplam</p>
          <p className="text-lg sm:text-2xl font-bold text-white truncate">{formatCompactCurrency(totalMonthly)}</p>
          <p className="text-xs text-white/40 mt-1">{subscriptions.length} aktif abonelik</p>
        </GlassCard>
        <GlassCard className="p-4 sm:p-6">
          <p className="text-white/50 text-sm mb-1">Yıllık Maliyet</p>
          <p className="text-lg sm:text-2xl font-bold text-amber-400 truncate">{formatCompactCurrency(totalMonthly * 12)}</p>
        </GlassCard>
        <GlassCard className="p-4 sm:p-6">
          <p className="text-white/50 text-sm mb-1">Yaklaşan Ödemeler</p>
          <p className="text-lg sm:text-2xl font-bold text-cyan-400">{upcomingPayments.length}</p>
          <p className="text-xs text-white/40 mt-1">önümüzdeki 30 gün</p>
        </GlassCard>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <GlassCard className="p-6 mb-6" gradient="linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1))">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Yaklaşan Ödemeler</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingPayments.slice(0, 6).map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-xl">
                  {sub.category === 'Streaming' ? '📺' : sub.category === 'Yazılım' ? '💻' : '📱'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{sub.name}</p>
                  <p className="text-sm text-white/50">{formatCurrency(sub.amount)}</p>
                </div>
                <Badge variant={sub.daysUntil <= 3 ? 'danger' : sub.daysUntil <= 7 ? 'warning' : 'info'}>
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
          <h3 className="text-lg font-semibold text-white mb-4">Tüm Abonelikler</h3>
          <div className="space-y-3">
            <AnimatePresence>
              {subscriptions.map((sub, index) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
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
          title="Henüz abonelik yok"
          description="Tekrarlayan ödemelerinizi ekleyerek takip edin."
          action={
            <NeonButton onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2 inline" />
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
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-2xl">
        {categoryIcons[subscription.category] || '📱'}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white">{subscription.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="info">{subscription.category}</Badge>
          <span className="text-xs text-white/40">
            {subscription.interval === 'monthly' ? 'Aylık' : 'Yıllık'}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-white">{formatCurrency(subscription.amount)}</p>
        <p className="text-xs text-white/50">
          {daysUntil > 0 ? `${daysUntil} gün sonra` : daysUntil === 0 ? 'Bugün' : 'Gecikmiş'}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
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

    // Reset
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Yeni Abonelik</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Hizmet Adı</label>
            <GlassInput
              value={name}
              onChange={setName}
              placeholder="Netflix, Spotify, Adobe..."
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Tutar (₺)</label>
            <GlassInput
              type="number"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Kategori</label>
            <GlassSelect
              value={category}
              onChange={setCategory}
              options={categories.map(c => ({ value: c, label: c }))}
            />
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => setInterval('monthly')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                interval === 'monthly' 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                interval === 'yearly' 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Yıllık
            </button>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Sonraki Ödeme Tarihi</label>
            <input
              type="date"
              value={nextPayment}
              onChange={(e) => setNextPayment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
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
