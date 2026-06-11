import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Trash2, X, Search, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { GlassCard, NeonButton, GlassInput, GlassSelect, EmptyState } from '../ui/GlassCard';
import { PageHeader, SwipeableRow } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { Transaction } from '../../types';
import { formatCurrency, formatDate, getCurrentDate, getCurrentMonth } from '../../lib/utils';
import { incomeCategories, expenseCategories, categoryIcons, categoryColors, moodEmojis } from '../../data/mockData';

export function Transactions() {
  const { transactions, addTransaction, deleteTransaction } = useFinansStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());

  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesMonth = t.date.startsWith(filterMonth);
      return matchesSearch && matchesType && matchesMonth;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <PageHeader 
        title="İşlemler" 
        subtitle="Gelir ve giderlerinizi takip edin"
        action={
          <NeonButton onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1 inline" />
            İşlem Ekle
          </NeonButton>
        }
      />

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <GlassInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="İşlem veya kategori ara..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <div className="w-28 sm:w-32 shrink-0">
              <GlassSelect
                value={filterType}
                onChange={(v) => setFilterType(v as 'all' | 'income' | 'expense')}
                options={[
                  { value: 'all', label: 'Tümü' },
                  { value: 'income', label: 'Gelirler' },
                  { value: 'expense', label: 'Giderler' },
                ]}
              />
            </div>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/5 text-white focus:outline-none focus:border-[#00c2ff]/40 shrink-0 cursor-pointer"
            />
          </div>
        </div>
      </GlassCard>

      {/* Transaction List */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((transaction) => (
              <SwipeableRow
                key={transaction.id}
                onDelete={() => deleteTransaction(transaction.id)}
              >
                <TransactionCard transaction={transaction} onDelete={() => deleteTransaction(transaction.id)} />
              </SwipeableRow>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="İşlem Bulunamadı"
          description="Filtrelere uygun işlem kaydı bulunmuyor."
        />
      )}

      {/* Add Transaction Modal */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          addTransaction(data);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

function TransactionCard({ transaction, onDelete }: { transaction: Transaction; onDelete: () => void }) {
  const isIncome = transaction.type === 'income';
  const categoryColor = categoryColors[transaction.category] || '#6B7280';

  return (
    <div className="p-3.5 bg-white/5 border border-transparent hover:border-white/5 rounded-xl transition-all">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${categoryColor}15` }}
        >
          {categoryIcons[transaction.category] || '📌'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-semibold text-white truncate leading-tight">{transaction.description}</h4>
            {transaction.mood && (
              <span className="text-sm shrink-0" title={`Mood: ${transaction.mood}`}>
                {moodEmojis[transaction.mood]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] text-white/45">{transaction.category}</span>
            <span className="text-[10px] text-white/30">•</span>
            <span className="text-[10px] text-white/40">{formatDate(transaction.date)}</span>
            {transaction.recurring && (
              <>
                <span className="text-[10px] text-white/30">•</span>
                <span className="text-[9px] font-semibold text-[#00c2ff]/80">Tekrarlayan</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-xs font-bold tabular-nums ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
        </div>
        {/* Delete button for larger viewports */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="hidden lg:block p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function TransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: Omit<Transaction, 'id'>) => void;
}) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getCurrentDate());
  const [mood, setMood] = useState<'happy' | 'stressed' | 'neutral' | 'excited' | 'sad' | ''>('');
  const [recurring, setRecurring] = useState(false);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = () => {
    if (!category || !amount || !description) return;

    onSubmit({
      type,
      category,
      amount: parseFloat(amount),
      description,
      date,
      mood: mood || undefined,
      recurring,
    });

    setCategory('');
    setAmount('');
    setDescription('');
    setMood('');
    setRecurring(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
          <h3 className="text-sm font-bold text-white">Yeni İşlem Ekle</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Segmented Type Toggle */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
            <button
              onClick={() => { setType('expense'); setCategory(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'expense' 
                  ? 'bg-white/5 text-rose-400' 
                  : 'text-white/45 hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Gider
            </button>
            <button
              onClick={() => { setType('income'); setCategory(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'income' 
                  ? 'bg-white/5 text-emerald-400' 
                  : 'text-white/45 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Gelir
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Tutar (₺)</label>
            <GlassInput
              type="number"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Kategori</label>
            <GlassSelect
              value={category}
              onChange={setCategory}
              options={[
                { value: '', label: 'Kategori Seçin' },
                ...categories.map(c => ({ value: c, label: `${categoryIcons[c] || '📌'} ${c}` }))
              ]}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">Açıklama</label>
            <GlassInput
              value={description}
              onChange={setDescription}
              placeholder="Market, maaş, fatura vb."
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">İşlem Tarihi</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/5 text-white focus:outline-none focus:border-[#00c2ff]/40"
            />
          </div>

          {/* Mood (only for expenses) */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium">Hissiyat</label>
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

          {/* Recurring */}
          <label className="flex items-center gap-2 cursor-pointer py-1 select-none">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            <span className="text-xs text-white/60 font-medium">Tekrarlayan işlem olarak tanımla</span>
          </label>
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
    </motion.div>,
    document.body
  );
}
