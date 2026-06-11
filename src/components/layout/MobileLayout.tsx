import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, Target, 
  Settings, Plus, TrendingDown, Bitcoin, CreditCard
} from 'lucide-react';
import { NeonButton, GlassInput } from '../ui/GlassCard';
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
  { id: 'debts', label: 'Borçlar', icon: CreditCard },
  { id: 'portfolio', label: 'Portföy', icon: TrendingUp },
  { id: 'transactions', label: 'İşlemler', icon: Wallet },
  { id: 'analytics', label: 'Analiz', icon: Target },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

const spring120 = { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.5 };
const spring120Snappy = { type: 'spring' as const, stiffness: 600, damping: 28, mass: 0.4 };
const spring120Sheet = { type: 'spring' as const, stiffness: 400, damping: 32, mass: 0.8 };
const tween120 = { type: 'tween' as const, duration: 0.08, ease: [0.2, 0, 0, 1] as const };

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabType, setFabType] = useState<'income' | 'expense' | 'investment' | null>(null);

  const isMobile = useIsMobile(1024);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pb-20">
        {/* Solid dark background */}
        <div className="fixed inset-0 z-0 bg-slate-950" />

        {/* Main Content */}
        <main className="relative z-10 p-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, paddingTop: 4 }}
            animate={{ opacity: 1, paddingTop: 0 }}
            transition={spring120}
          >
            {children}
          </motion.div>
        </main>

        {/* FAB - Floating Action Button (Apple HIG optimized: smaller, solid, clean shadow) */}
        <motion.button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="fixed bottom-24 right-4 z-50 w-11 h-11 rounded-full bg-[#00c2ff] flex items-center justify-center shadow-premium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isFabOpen ? 45 : 0 }}
          transition={spring120Snappy}
        >
          <Plus className="w-5 h-5 text-slate-950" />
        </motion.button>

        {/* FAB Menu */}
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={spring120}
              className="fixed bottom-36 right-4 z-50 flex flex-col gap-2.5"
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
          <div className="bg-slate-900/95 border-t border-white/5 px-2 py-1 safe-area-bottom">
            <div className="flex justify-around items-center h-12">
              {mobileNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    whileTap={{ scale: 0.92 }}
                    transition={tween120}
                    className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive ? 'text-[#00c2ff]' : 'text-white/40'
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
                  </motion.button>
                );
              })}
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
              className="fixed inset-0 bg-black/40 z-45"
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
      {/* Solid dark background */}
      <div className="fixed inset-0 z-0 bg-slate-950" />

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -220 }}
        animate={{ x: 0 }}
        transition={spring120}
        className="fixed left-0 top-0 h-full w-[220px] bg-slate-900 border-r border-white/5 z-40"
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00c2ff] flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Finans
              </h1>
              <p className="text-[11px] text-white/40">Akıllı Yönetim</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {mobileNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                whileTap={{ scale: 0.98 }}
                transition={tween120}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-white/5 text-[#00c2ff] font-medium'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#00c2ff] rounded-r" />
                )}
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main content */}
      <main className="lg:ml-[220px] min-h-screen relative z-10">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, paddingTop: 6 }}
            animate={{ opacity: 1, paddingTop: 0 }}
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={spring120Snappy}
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold ${colorClasses[color as keyof typeof colorClasses]} shadow-premium`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={spring120Sheet}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pb-3.5 border-b border-white/5">
          <h3 className="text-base font-semibold text-white">
            {type === 'income' ? 'Gelir Ekle' : type === 'expense' ? 'Gider Ekle' : 'Yatırım Ekle'}
          </h3>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto" data-scroll>
          {type !== 'investment' && (
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Kategori</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors duration-150 ${
                      category === cat
                        ? 'bg-[#00c2ff]/10 text-[#00c2ff] border border-[#00c2ff]/20'
                        : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    {categoryIcons[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Tutar (₺)</label>
            <GlassInput
              type="number"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">
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
              <label className="block text-xs text-white/40 mb-1.5">Hissiyat</label>
              <div className="flex gap-2">
                {Object.entries(moodEmojis).map(([key, emoji]) => (
                  <button
                    key={key}
                    onClick={() => setMood(mood === key ? '' : key as 'happy' | 'stressed' | 'neutral' | 'excited' | 'sad')}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-colors ${
                      mood === key ? 'bg-white/15 border border-white/20' : 'bg-white/5 hover:bg-white/10'
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
        <div className="p-5 border-t border-white/5 flex gap-2.5 safe-area-bottom">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
          >
            İptal
          </button>
          <NeonButton onClick={handleSubmit} className="flex-1 font-semibold">
            Kaydet
          </NeonButton>
        </div>
      </motion.div>
    </motion.div>,
    document.body
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
    ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.08)', 'rgba(255, 255, 255, 0)', 'rgba(0, 194, 255, 0.08)', 'rgba(0, 194, 255, 0.15)']
  );
  const opacity = useTransform(x, [-100, -50, 0, 50, 100], [1, 0.5, 0, 0.5, 1]);

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
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
        <motion.div style={{ opacity }} className="text-[#00c2ff] text-xs font-semibold">
          Düzenle
        </motion.div>
        <motion.div style={{ opacity }} className="text-red-400 text-xs font-semibold">
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
    <div className="flex items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl lg:text-[30px] font-bold text-white tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-white/40 text-xs lg:text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="block">{action}</div>}
    </div>
  );
}
