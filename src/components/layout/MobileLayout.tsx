import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, Target, 
  Settings, Plus, X, TrendingDown, Bitcoin
} from 'lucide-react';
import { GlassCard, NeonButton, GlassInput } from '../ui/GlassCard';
import { useFinansStore } from '../../store/useFinansStore';
import { getCurrentDate } from '../../lib/utils';
import { useIsMobile } from '../../lib/hooks';
import { incomeCategories, expenseCategories, categoryIcons, moodEmojis } from '../../data/mockData';


interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const mobileNavItems = [
  { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portföy', icon: TrendingUp },
  { id: 'transactions', label: 'İşlemler', icon: Wallet },
  { id: 'analytics', label: 'Analiz', icon: Target },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

/* ============================================
   120Hz SPRING CONFIGS
   - stiffness: 500+ → çok hızlı tepki (8ms underdamped)
   - damping: 28-32 → minimal overshoot, snappy feel
   - mass: 0.5 → hafif element hissi
   ============================================ */
const spring120 = { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.5 };
const spring120Snappy = { type: 'spring' as const, stiffness: 600, damping: 28, mass: 0.4 };
const spring120Sheet = { type: 'spring' as const, stiffness: 400, damping: 32, mass: 0.8 };
const tween120 = { type: 'tween' as const, duration: 0.08, ease: [0.2, 0, 0, 1] as const };

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabType, setFabType] = useState<'income' | 'expense' | 'investment' | null>(null);

  // useIsMobile hook: ResizeObserver ile daha verimli, gereksiz re-render yok
  const isMobile = useIsMobile(1024);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pb-20">
        {/* Animated background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Main Content */}
        <main className="relative z-10 p-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring120}
          >
            {children}
          </motion.div>
        </main>

        {/* FAB - Floating Action Button */}
        <motion.button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: isFabOpen ? 45 : 0 }}
          transition={spring120Snappy}
        >
          <Plus className="w-7 h-7 text-white" />
        </motion.button>

        {/* FAB Menu */}
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              transition={spring120}
              className="fixed bottom-40 right-4 z-50 flex flex-col gap-3"
            >
              <FabMenuItem
                icon={TrendingUp}
                label="Gelir"
                color="emerald"
                onClick={() => { setFabType('income'); setIsFabOpen(false); }}
              />
              <FabMenuItem
                icon={TrendingDown}
                label="Gider"
                color="rose"
                onClick={() => { setFabType('expense'); setIsFabOpen(false); }}
              />
              <FabMenuItem
                icon={Bitcoin}
                label="Yatırım"
                color="amber"
                onClick={() => { setFabType('investment'); setIsFabOpen(false); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40">
          <div className="bg-slate-900/90 backdrop-blur-xl border-t border-white/10 px-2 py-2 safe-area-bottom">
            <div className="flex justify-around items-center">
              {mobileNavItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  whileTap={{ scale: 0.88 }}
                  transition={tween120}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors duration-100 ${
                    activeTab === item.id
                      ? 'text-cyan-400'
                      : 'text-white/50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-cyan-400' : ''}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-0 w-12 h-1 bg-cyan-400 rounded-full"
                      transition={spring120}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom Sheet for Quick Add */}
        <AnimatePresence>
          {fabType && (
            <QuickAddBottomSheet 
              type={fabType} 
              onClose={() => setFabType(null)} 
            />
          )}
        </AnimatePresence>

        {/* FAB Backdrop */}
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={tween120}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsFabOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={spring120}
        className="fixed left-0 top-0 h-full w-64 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 z-40"
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Finans
              </h1>
              <p className="text-xs text-white/50">Akıllı Yönetim</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {mobileNavItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              transition={tween120}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-100 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </nav>
      </motion.aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen relative z-10">
        <div className="p-4 lg:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring120}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// FAB Menu Item
function FabMenuItem({ icon: Icon, label, color, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500 text-white',
    rose: 'bg-rose-500 text-white',
    amber: 'bg-amber-500 text-white',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={spring120Snappy}
      className={`flex items-center gap-2 px-4 py-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]} shadow-lg`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}

// Quick Add Bottom Sheet
function QuickAddBottomSheet({ type, onClose }: { type: 'income' | 'expense' | 'investment'; onClose: () => void }) {
  const addTransaction = useFinansStore((s) => s.addTransaction);
  const addPortfolioItem = useFinansStore((s) => s.addPortfolioItem);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [mood, setMood] = useState<'happy' | 'stressed' | 'neutral' | 'excited' | 'sad' | ''>('');

  const categories = type === 'income' ? incomeCategories : type === 'expense' ? expenseCategories : [];

  const handleSubmit = () => {
    if (!amount || !description) return;

    if (type === 'investment') {
      addPortfolioItem({
        symbol: description.toUpperCase().slice(0, 5),
        name: description,
        type: 'crypto',
        quantity: 1,
        averageCost: parseFloat(amount),
        currentPrice: parseFloat(amount),
        transactions: [],
      });
    } else {
      addTransaction({
        type,
        category: category || 'Diğer',
        amount: parseFloat(amount),
        description,
        date: getCurrentDate(),
        mood: mood || undefined,
      });
    }

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={tween120}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={spring120Sheet}
        className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: 'transform' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">
            {type === 'income' ? '💰 Gelir Ekle' : type === 'expense' ? '💸 Gider Ekle' : '📈 Yatırım Ekle'}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto" data-scroll>
          {type !== 'investment' && (
            <div>
              <label className="block text-sm text-white/60 mb-2">Kategori</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-sm transition-colors duration-100 ${
                      category === cat
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {categoryIcons[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            <label className="block text-sm text-white/60 mb-2">
              {type === 'investment' ? 'Varlık Adı' : 'Açıklama'}
            </label>
            <GlassInput
              value={description}
              onChange={setDescription}
              placeholder={type === 'investment' ? 'BTC, ETH, THYAO...' : 'İşlem açıklaması'}
            />
          </div>

          {type === 'expense' && (
            <div>
              <label className="block text-sm text-white/60 mb-2">Hava Durumu</label>
              <div className="flex gap-2">
                {Object.entries(moodEmojis).map(([key, emoji]) => (
                  <button
                    key={key}
                    onClick={() => setMood(mood === key ? '' : key as 'happy' | 'stressed' | 'neutral' | 'excited' | 'sad')}
                    className={`w-10 h-10 rounded-xl text-xl transition-colors duration-100 ${
                      mood === key ? 'bg-white/20 border border-white/30' : 'bg-white/5'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/10 flex gap-3 safe-area-bottom">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-colors duration-100"
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

// Swipeable Transaction Row
export function SwipeableRow({ 
  children, 
  onDelete, 
  onEdit 
}: { 
  children: ReactNode; 
  onDelete: () => void; 
  onEdit?: () => void;
}) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, -50, 0, 50, 100],
    ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.2)', 'rgba(255, 255, 255, 0.05)', 'rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.3)']
  );
  const opacity = useTransform(x, [-100, -50, 0, 50, 100], [1, 0.5, 0, 0.5, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -80) {
      onDelete();
    } else if (info.offset.x > 80 && onEdit) {
      onEdit();
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      style={{ x }}
      className="relative lg:static"
    >
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6 lg:hidden pointer-events-none">
        <motion.div style={{ opacity }} className="text-blue-400 font-medium">
          Düzenle
        </motion.div>
        <motion.div style={{ opacity }} className="text-red-400 font-medium">
          Sil
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        style={{ background }}
        className="relative rounded-xl overflow-hidden"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function PageHeader({ title, subtitle, action }: { 
  title: string; 
  subtitle?: string; 
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">{title}</h1>
        {subtitle && <p className="text-white/50 text-sm lg:text-base">{subtitle}</p>}
      </div>
      {action && <div className="hidden lg:block">{action}</div>}
    </div>
  );
}
