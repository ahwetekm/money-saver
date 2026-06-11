import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GlassInput } from './ui/GlassCard';
import type { Debt, DebtType, CreditCardInfo, LoanInfo, MinimumPaymentType } from '../types';

interface DebtFormProps {
  initialData?: Partial<Debt>;
  onSubmit: (debt: Omit<Debt, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const debtTypes: { value: DebtType; label: string }[] = [
  { value: 'credit_card', label: 'Kredi Kartı' },
  { value: 'loan', label: 'Kredi' },
  { value: 'other', label: 'Diğer Borç' },
];

const statusOptions: { value: Debt['status']; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'paid', label: 'Ödenmiş' },
  { value: 'overdue', label: 'Gecikmiş' },
];

const spring120Snappy = { type: 'spring' as const, stiffness: 600, damping: 28, mass: 0.4 };

export function DebtForm({ initialData, onSubmit, onCancel }: DebtFormProps) {
  const [debtType, setDebtType] = useState<DebtType>(initialData?.type || 'credit_card');
  const [name, setName] = useState(initialData?.name || '');
  const [principal, setPrincipal] = useState(initialData?.principal?.toString() || '');
  const [remainingBalance, setRemainingBalance] = useState(initialData?.remainingBalance?.toString() || '');
  const [annualInterestRate, setAnnualInterestRate] = useState(initialData?.annualInterestRate?.toString() || '');
  const [monthlyPayment, setMonthlyPayment] = useState(initialData?.monthlyPayment?.toString() || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [status, setStatus] = useState<Debt['status']>(initialData?.status || 'active');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Credit card specific
  const [minPaymentType, setMinPaymentType] = useState<MinimumPaymentType>(
    initialData?.creditCard?.minimumPaymentType || 'percentage'
  );
  const [minPaymentValue, setMinPaymentValue] = useState(
    initialData?.creditCard?.minimumPaymentValue?.toString() || ''
  );
  const [statementDay, setStatementDay] = useState(
    initialData?.creditCard?.statementDay?.toString() || ''
  );

  // Loan specific
  const [totalMonths, setTotalMonths] = useState(
    initialData?.loan?.totalMonths?.toString() || ''
  );
  const [remainingMonths, setRemainingMonths] = useState(
    initialData?.loan?.remainingMonths?.toString() || ''
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Auto-fill remaining balance from principal if not set
    if (!remainingBalance && principal) {
      setRemainingBalance(principal);
    }
  }, [principal, remainingBalance]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Borç adı gerekli';
    if (!principal || parseFloat(principal) <= 0) newErrors.principal = 'Geçerli bir anapara girin';
    if (!remainingBalance || parseFloat(remainingBalance) < 0) newErrors.remainingBalance = 'Geçerli bir bakiye girin';
    if (!dueDate) newErrors.dueDate = 'Son ödeme tarihi gerekli';

    if (debtType === 'credit_card') {
      if (!minPaymentValue || parseFloat(minPaymentValue) <= 0) {
        newErrors.minPaymentValue = 'Asgari ödeme değeri gerekli';
      }
      if (!statementDay || parseInt(statementDay) < 1 || parseInt(statementDay) > 31) {
        newErrors.statementDay = 'Geçerli bir ekstre günü girin (1-31)';
      }
    }

    if (debtType === 'loan') {
      if (!totalMonths || parseInt(totalMonths) <= 0) newErrors.totalMonths = 'Vade sayısı gerekli';
      if (!remainingMonths || parseInt(remainingMonths) <= 0) newErrors.remainingMonths = 'Kalan vade gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const creditCardInfo: CreditCardInfo | undefined = debtType === 'credit_card'
      ? {
          minimumPaymentType: minPaymentType,
          minimumPaymentValue: parseFloat(minPaymentValue),
          statementDay: parseInt(statementDay),
        }
      : undefined;

    const loanInfo: LoanInfo | undefined = debtType === 'loan'
      ? {
          totalMonths: parseInt(totalMonths),
          remainingMonths: parseInt(remainingMonths),
        }
      : undefined;

    onSubmit({
      type: debtType,
      name: name.trim(),
      principal: parseFloat(principal),
      remainingBalance: parseFloat(remainingBalance),
      annualInterestRate: parseFloat(annualInterestRate || '0'),
      monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : undefined,
      dueDate,
      status,
      creditCard: creditCardInfo,
      loan: loanInfo,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-5">
      {/* Debt Type Selection */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5">Borç Türü</label>
        <div className="flex gap-2">
          {debtTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setDebtType(t.value);
                setErrors({});
              }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                debtType === t.value
                  ? 'bg-[#00c2ff]/10 text-[#00c2ff] border border-[#00c2ff]/20'
                  : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5">Borç Adı</label>
        <GlassInput
          value={name}
          onChange={setName}
          placeholder="Örn: Akbank Kredi Kartı, İhtiyaç Kredisi"
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Principal & Balance */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Anapara (₺)</label>
          <GlassInput
            type="number"
            value={principal}
            onChange={setPrincipal}
            placeholder="0.00"
          />
          {errors.principal && <p className="text-red-400 text-xs mt-1">{errors.principal}</p>}
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Kalan Bakiye (₺)</label>
          <GlassInput
            type="number"
            value={remainingBalance}
            onChange={setRemainingBalance}
            placeholder="0.00"
          />
          {errors.remainingBalance && <p className="text-red-400 text-xs mt-1">{errors.remainingBalance}</p>}
        </div>
      </div>

      {/* Interest Rate & Monthly Payment */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Yıllık Faiz (%)</label>
          <GlassInput
            type="number"
            value={annualInterestRate}
            onChange={setAnnualInterestRate}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Aylık Ödeme (₺)</label>
          <GlassInput
            type="number"
            value={monthlyPayment}
            onChange={setMonthlyPayment}
            placeholder="Opsiyonel"
          />
        </div>
      </div>

      {/* Due Date & Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Son Ödeme Tarihi</label>
          <GlassInput
            type="date"
            value={dueDate}
            onChange={setDueDate}
          />
          {errors.dueDate && <p className="text-red-400 text-xs mt-1">{errors.dueDate}</p>}
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Durum</label>
          <div className="flex gap-1.5 mt-2">
            {statusOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  status === s.value
                    ? s.value === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : s.value === 'paid'
                      ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Credit Card Specific Fields */}
      {debtType === 'credit_card' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={spring120Snappy}
          className="space-y-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
        >
          <p className="text-xs font-medium text-white/60">Kredi Kartı Bilgileri</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Asgari Ödeme Tipi</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMinPaymentType('percentage')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    minPaymentType === 'percentage'
                      ? 'bg-[#00c2ff]/10 text-[#00c2ff] border border-[#00c2ff]/20'
                      : 'bg-white/5 text-white/60 border border-transparent'
                  }`}
                >
                  Yüzde (%)
                </button>
                <button
                  onClick={() => setMinPaymentType('fixed')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    minPaymentType === 'fixed'
                      ? 'bg-[#00c2ff]/10 text-[#00c2ff] border border-[#00c2ff]/20'
                      : 'bg-white/5 text-white/60 border border-transparent'
                  }`}
                >
                  Sabit
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                {minPaymentType === 'percentage' ? 'Yüzde (%)' : 'Tutar (₺)'}
              </label>
              <GlassInput
                type="number"
                value={minPaymentValue}
                onChange={setMinPaymentValue}
                placeholder={minPaymentType === 'percentage' ? 'Örn: 20' : 'Örn: 500'}
              />
              {errors.minPaymentValue && <p className="text-red-400 text-xs mt-1">{errors.minPaymentValue}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Ekstre Günü</label>
            <GlassInput
              type="number"
              min={1}
              max={31}
              value={statementDay}
              onChange={setStatementDay}
              placeholder="Örn: 15"
            />
            {errors.statementDay && <p className="text-red-400 text-xs mt-1">{errors.statementDay}</p>}
          </div>
        </motion.div>
      )}

      {/* Loan Specific Fields */}
      {debtType === 'loan' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={spring120Snappy}
          className="space-y-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
        >
          <p className="text-xs font-medium text-white/60">Kredi Bilgileri</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Toplam Vade (Ay)</label>
              <GlassInput
                type="number"
                value={totalMonths}
                onChange={setTotalMonths}
                placeholder="Örn: 36"
              />
              {errors.totalMonths && <p className="text-red-400 text-xs mt-1">{errors.totalMonths}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Kalan Vade (Ay)</label>
              <GlassInput
                type="number"
                value={remainingMonths}
                onChange={setRemainingMonths}
                placeholder="Örn: 24"
              />
              {errors.remainingMonths && <p className="text-red-400 text-xs mt-1">{errors.remainingMonths}</p>}
            </div>
          </div>
        </motion.div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5">Notlar</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opsiyonel notlar..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#00c2ff]/30 transition-colors resize-none"
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 rounded-xl text-sm bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
        >
          İptal
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition-opacity"
        >
          {initialData ? 'Güncelle' : 'Ekle'}
        </button>
      </div>
    </div>
  );
}