import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Search, Filter, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { GlassCard, NeonButton, GlassInput, GlassSelect, Badge, EmptyState } from '../ui/GlassCard';
import { PageHeader } from '../layout/Layout';
import { useFinansStore } from '../../store/useFinansStore';
import { Transaction } from '../../types';
import { formatCurrency, formatDate, getCurrentDate, getCurrentMonth } from '../../lib/utils';
import { incomeCategories, expenseCategories, categoryIcons, categoryColors, moodEmojis, moodColors } from '../../data/mockData';

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
    <div>
      <PageHeader 
        title="İşlemler" 
        subtitle="Gelir ve giderlerinizi takip edin"
        action={
          <NeonButton onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2 inline" />
            Yeni İşlem
          </NeonButton>
        }
      />

      {/* Filters */}
      <GlassCard className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <GlassInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="İşlem ara..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <GlassSelect
              value={filterType}
              onChange={(v) => setFilterType(v as 'all' | 'income' | 'expense')}
              options={[
                { value: 'all', label: 'Tümü' },
                { value: 'income', label: 'Gelir' },
                { value: 'expense', label: 'Gider' },
              ]}
            />
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </GlassCard>

      {/* Transaction List */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <TransactionCard 
                  transaction={transaction} 
                  onDelete={() => deleteTransaction(transaction.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="İşlem bulunamadı"
          description="Bu kriterlere uygun işlem yok. Yeni işlem eklemek için butona tıklayın."
          action={
            <NeonButton onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2 inline" />
              İşlem Ekle
            </NeonButton>
          }
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
    <GlassCard className="p-4" hover={false}>
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          {categoryIcons[transaction.category] || '📌'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white truncate">{transaction.description}</h4>
            {transaction.mood && (
              <span title={`Mood: ${transaction.mood}`}>{moodEmojis[transaction.mood]}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default">{transaction.category}</Badge>
            <span className="text-xs text-white/40">{formatDate(transaction.date)}</span>
            {transaction.recurring && (
              <Badge variant="info">Tekrarlayan</Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </GlassCard>
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

    // Reset form
    setCategory('');
    setAmount('');
    setDescription('');
    setMood('');
    setRecurring(false);
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
        className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Yeni İşlem</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => { setType('expense'); setCategory(''); }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                type === 'expense' 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4 inline mr-2" />
              Gider
            </button>
            <button
              onClick={() => { setType('income'); setCategory(''); }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                type === 'income' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Gelir
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Tutar (₺)</label>
            <GlassInput
              type="number"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Kategori</label>
            <GlassSelect
              value={category}
              onChange={setCategory}
              placeholder="Kategori seçin"
              options={categories.map(c => ({ value: c, label: `${categoryIcons[c] || '📌'} ${c}` }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Açıklama</label>
            <GlassInput
              value={description}
              onChange={setDescription}
              placeholder="İşlem açıklaması"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Tarih</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Mood (only for expenses) */}
          {type === 'expense' && (
            <div>
              <label className="block text-sm text-white/60 mb-2">Hava Durumu (Opsiyonel)</label>
              <div className="flex gap-2">
                {Object.entries(moodEmojis).map(([key, emoji]) => (
                  <button
                    key={key}
                    onClick={() => setMood(mood === key ? '' : key as 'happy' | 'stressed' | 'neutral' | 'excited' | 'sad')}
                    className={`w-10 h-10 rounded-xl text-xl transition-all ${
                      mood === key 
                        ? 'bg-white/20 border border-white/30' 
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recurring */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="w-5 h-5 rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-cyan-500/50"
            />
            <span className="text-white/80">Tekrarlayan işlem</span>
          </label>
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
