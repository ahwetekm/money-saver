import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../layout/MobileLayout';
import { DebtList } from '../DebtList';
import { DebtForm } from '../DebtForm';
import { useFinansStore } from '../../store/useFinansStore';
import { formatCompactCurrency, formatCurrency, generateAmortizationTable } from '../../lib/utils';
import type { Debt } from '../../types';

const spring120Sheet = { type: 'spring' as const, stiffness: 400, damping: 32, mass: 0.8 };

export function DebtsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const debts = useFinansStore((s) => s.debts);
  const debtPayments = useFinansStore((s) => s.debtPayments);
  const addNewDebt = useFinansStore((s) => s.addNewDebt);
  const makeDebtPayment = useFinansStore((s) => s.makeDebtPayment);
  const closeDebt = useFinansStore((s) => s.closeDebt);
  const deleteExistingDebt = useFinansStore((s) => s.deleteExistingDebt);

  const selectedDebt = selectedDebtId ? debts.find((d) => d.id === selectedDebtId) : null;
  const debtPaymentHistory = selectedDebtId
    ? debtPayments.filter((p) => p.debtId === selectedDebtId).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  useEffect(() => {
    document.body.style.overflow = showForm || payingDebt ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showForm, payingDebt]);

  const handleAddDebt = useCallback(
    (data: Omit<Debt, 'id' | 'createdAt'>) => {
      addNewDebt(data);
      setShowForm(false);
    },
    [addNewDebt]
  );

  const handlePayDebt = useCallback(
    (debt: Debt) => {
      setPayingDebt(debt);
      setPaymentAmount('');
      setPaymentNote('');
    },
    []
  );

  const handleConfirmPayment = useCallback(() => {
    if (!payingDebt || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    makeDebtPayment(payingDebt.id, parseFloat(paymentAmount), paymentNote || undefined);
    setPayingDebt(null);
  }, [payingDebt, paymentAmount, paymentNote, makeDebtPayment]);

  const handleCloseDebt = useCallback(
    (id: string) => {
      closeDebt(id);
    },
    [closeDebt]
  );

  const handleDeleteDebt = useCallback(
    (id: string) => {
      if (window.confirm('Bu borcu silmek istediğinize emin misiniz?')) {
        deleteExistingDebt(id);
        setSelectedDebtId(null);
      }
    },
    [deleteExistingDebt]
  );

  // ─── Unified Modal Component (portal to body) ───
  function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
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
          {children}
        </motion.div>
      </motion.div>,
      document.body
    );
  }

  // ─── Detail View ───
  if (selectedDebt) {
    const isLoan = selectedDebt.type === 'loan';
    return (
      <div className="space-y-6">
        <PageHeader
          title={selectedDebt.name}
          subtitle={selectedDebt.notes || `${selectedDebt.type === 'credit_card' ? 'Kredi Kartı' : selectedDebt.type === 'loan' ? 'Kredi' : 'Diğer Borç'}`}
          action={
            <button
              onClick={() => setSelectedDebtId(null)}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white/60" />
            </button>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Anapara</p>
            <p className="text-sm font-bold text-white tabular-nums mt-0.5">{formatCompactCurrency(selectedDebt.principal)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-3 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Kalan Bakiye</p>
            <p className="text-sm font-bold text-rose-400 tabular-nums mt-0.5">{formatCompactCurrency(selectedDebt.remainingBalance)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Faiz Oranı</p>
            <p className="text-sm font-bold text-amber-400 tabular-nums mt-0.5">%{selectedDebt.annualInterestRate}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-3 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Durum</p>
            <p className={`text-sm font-bold mt-0.5 ${selectedDebt.status === 'overdue' ? 'text-rose-400' : selectedDebt.status === 'paid' ? 'text-gray-400' : 'text-emerald-400'}`}>
              {selectedDebt.status === 'overdue' ? 'Gecikmiş' : selectedDebt.status === 'paid' ? 'Ödenmiş' : 'Aktif'}
            </p>
          </motion.div>
        </div>

        {isLoan && selectedDebt.loan && selectedDebt.monthlyPayment && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <h3 className="text-sm font-semibold text-white/80 mb-3">Amortisman Tablosu</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/40 border-b border-white/5">
                    <th className="text-left py-2 pr-3">Taksit</th>
                    <th className="text-right px-3">Anapara</th>
                    <th className="text-right px-3">Faiz</th>
                    <th className="text-right pl-3">Kalan</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const table = generateAmortizationTable(
                      selectedDebt.remainingBalance,
                      selectedDebt.annualInterestRate,
                      selectedDebt.loan!.remainingMonths,
                      selectedDebt.monthlyPayment || 0
                    );
                    return table.slice(0, 12).map((row) => (
                      <tr key={row.installment} className="border-b border-white/[0.02]">
                        <td className="py-2 pr-3 text-white/70">{row.installment}</td>
                        <td className="text-right px-3 text-emerald-400">{formatCompactCurrency(row.principalPaid)}</td>
                        <td className="text-right px-3 text-rose-400">{formatCompactCurrency(row.interestPaid)}</td>
                        <td className="text-right pl-3 text-white/70">{formatCompactCurrency(row.remainingBalance)}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
              {selectedDebt.loan.remainingMonths > 12 && (
                <p className="text-center text-[10px] text-white/30 mt-2">
                  İlk 12 taksit gösteriliyor (toplam {selectedDebt.loan.remainingMonths} taksit)
                </p>
              )}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
        >
          <h3 className="text-sm font-semibold text-white/80 mb-3">Ödeme Geçmişi</h3>
          {debtPaymentHistory.length > 0 ? (
            <div className="space-y-2">
              {debtPaymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-xs text-white/70">{payment.date}</p>
                    {payment.note && <p className="text-[10px] text-white/40">{payment.note}</p>}
                  </div>
                  <p className="text-xs font-semibold text-emerald-400 tabular-nums">-{formatCompactCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40 text-center py-4">Henüz ödeme yapılmamış</p>
          )}
        </motion.div>

        <div className="flex gap-2.5">
          {selectedDebt.status !== 'paid' && (
            <>
              <button
                onClick={() => handlePayDebt(selectedDebt)}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                Ödeme Yap
              </button>
              <button
                onClick={() => handleCloseDebt(selectedDebt.id)}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                Borcu Kapat
              </button>
            </>
          )}
          <button
            onClick={() => handleDeleteDebt(selectedDebt.id)}
            className="py-2.5 px-4 rounded-xl text-sm bg-white/5 text-white/40 hover:bg-white/10 transition-colors"
          >
            Sil
          </button>
        </div>

        <AnimatePresence>
          {payingDebt && payingDebt.id === selectedDebt.id && (
            <ModalWrapper onClose={() => setPayingDebt(null)}>
              <div className="p-5">
                <h3 className="text-base font-semibold text-white mb-4">{selectedDebt.name} - Ödeme</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Kalan Bakiye</label>
                    <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(selectedDebt.remainingBalance)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Ödeme Tutarı (₺)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      max={selectedDebt.remainingBalance}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#00c2ff]/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Not (Opsiyonel)</label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Ödeme notu..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#00c2ff]/30 transition-colors"
                    />
                  </div>
                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setPayingDebt(null)}
                      className="flex-1 py-2.5 px-4 rounded-xl text-sm bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleConfirmPayment}
                      disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                      className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition-opacity disabled:opacity-30"
                    >
                      Ödemeyi Onayla
                    </button>
                  </div>
                </div>
              </div>
            </ModalWrapper>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── List View ───
  return (
    <div>
      <PageHeader
        title="Borçlar"
        subtitle="Tüm borçlarınızı yönetin"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="w-9 h-9 rounded-xl bg-[#00c2ff]/10 flex items-center justify-center hover:bg-[#00c2ff]/20 transition-colors"
          >
            <Plus className="w-4 h-4 text-[#00c2ff]" />
          </button>
        }
      />

      <DebtList
        onDebtClick={(id) => setSelectedDebtId(id)}
        onAddDebt={() => setShowForm(true)}
        onPayDebt={handlePayDebt}
      />

      <AnimatePresence>
        {showForm && (
          <ModalWrapper onClose={() => setShowForm(false)}>
            <div className="px-5 pb-3.5 border-b border-white/5">
              <h3 className="text-base font-semibold text-white">Yeni Borç Ekle</h3>
            </div>
            <div className="p-5" data-scroll>
              <DebtForm onSubmit={handleAddDebt} onCancel={() => setShowForm(false)} />
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {payingDebt && (
          <ModalWrapper onClose={() => setPayingDebt(null)}>
            <div className="p-5">
              <h3 className="text-base font-semibold text-white mb-4">{payingDebt.name} - Ödeme</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Kalan Bakiye</label>
                  <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(payingDebt.remainingBalance)}</p>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Ödeme Tutarı (₺)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    max={payingDebt.remainingBalance}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#00c2ff]/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Not (Opsiyonel)</label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Ödeme notu..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#00c2ff]/30 transition-colors"
                  />
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setPayingDebt(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition-opacity disabled:opacity-30"
                  >
                    Ödemeyi Onayla
                  </button>
                </div>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}