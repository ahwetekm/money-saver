import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, RefreshCw, Bitcoin, Building2, Coins, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SafeChart } from '../ui/SafeChart';
import { GlassCard, NeonButton, GlassInput, GlassSelect, Badge } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { PortfolioItem, CryptoPrice } from '../../types';
import { formatCurrency, formatPercentage, formatNumber } from '../../lib/utils';
import { mockBISTStocks, mockFunds, mockGoldPrices } from '../../data/mockData';

export function Portfolio() {
  // Granüler selector'lar - sadece gerekli state değiştiğinde re-render
  const portfolio = useFinansStore((s) => s.portfolio);
  const addPortfolioItem = useFinansStore((s) => s.addPortfolioItem);
  const deletePortfolioItem = useFinansStore((s) => s.deletePortfolioItem);
  const cryptoPrices = useFinansStore((s) => s.cryptoPrices);
  const setCryptoPrices = useFinansStore((s) => s.setCryptoPrices);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'crypto' | 'stocks' | 'funds' | 'gold'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // useCallback: fetchCryptoPrices referansı sabit kalır, gereksiz re-render önlenir
  const fetchCryptoPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const coinGeckoApiUrl = import.meta.env.VITE_COINGECKO_API_URL
        || 'https://api.coingecko.com/api/v3/coins/markets';
      const response = await fetch(
        `${coinGeckoApiUrl}?vs_currency=try&order=market_cap_desc&per_page=20&page=1&sparkline=false`
      );
      const data = await response.json();
      setCryptoPrices(data);
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      setCryptoPrices([
        { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 2500000, price_change_percentage_24h: 2.5, image: '' },
        { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 125000, price_change_percentage_24h: -1.2, image: '' },
        { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 4500, price_change_percentage_24h: 5.3, image: '' },
      ]);
    }
    setIsLoading(false);
  }, [setCryptoPrices]);

  useEffect(() => {
    fetchCryptoPrices();
  }, [fetchCryptoPrices]);

  // useMemo: ağır hesaplamalar sadece portfolio değiştiğinde tekrar yapılır
  const computed = useMemo(() => {
    const totalValue = portfolio.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    const totalCost = portfolio.reduce((sum, item) => sum + (item.averageCost * item.quantity), 0);
    const totalProfit = totalValue - totalCost;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const portfolioByType = portfolio.reduce((acc, item) => {
      const value = item.currentPrice * item.quantity;
      acc[item.type] = (acc[item.type] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    const typeColorMap: Record<string, string> = {
      crypto: '#F59E0B',
      stock: '#3B82F6',
      fund: '#10B981',
      gold: '#FCD34D',
      currency: '#8B5CF6',
    };

    const pieData = Object.entries(portfolioByType).map(([type, value]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      color: typeColorMap[type] || '#6B7280',
    }));

    return { totalValue, totalCost, totalProfit, profitPercent, pieData };
  }, [portfolio]);

  const { totalValue, totalProfit, profitPercent, pieData } = computed;

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: TrendingUp },
    { id: 'crypto', label: 'Kripto', icon: Bitcoin },
    { id: 'stocks', label: 'BIST', icon: Building2 },
    { id: 'funds', label: 'Fonlar', icon: Coins },
    { id: 'gold', label: 'Altın', icon: DollarSign },
  ];

  return (
    <div>
      <PageHeader 
        title="Portföy" 
        subtitle="Yatırımlarınızı takip edin"
        action={
          <div className="flex gap-2">
            <button
              onClick={fetchCryptoPrices}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-white/60 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <NeonButton onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2 inline" />
              Varlık Ekle
            </NeonButton>
          </div>
        }
      />

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <GlassCard className="p-6">
          <p className="text-white/50 text-sm mb-1">Toplam Değer</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-white/50 text-sm mb-1">Toplam Kar/Zarar</p>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </p>
          <p className={`text-sm ${totalProfit >= 0 ? 'text-emerald-400/60' : 'text-rose-400/60'}`}>
            {formatPercentage(profitPercent)}
          </p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-white/50 text-sm mb-1">Varlık Sayısı</p>
          <p className="text-2xl font-bold text-white">{portfolio.length}</p>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Distribution */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Varlık Dağılımı</h3>
            {pieData.length > 0 ? (
              <>
                <SafeChart height={256}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15,23,42,0.9)', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }} 
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </SafeChart>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-white/60">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-white/40">
                Portföyünüz boş
              </div>
            )}
          </GlassCard>

          {/* Holdings List */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Varlıklarım</h3>
            {portfolio.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {portfolio.map((item) => (
                  <PortfolioItemCard 
                    key={item.id} 
                    item={item} 
                    onDelete={() => deletePortfolioItem(item.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-white/40">
                Henüz varlık eklenmemiş
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === 'crypto' && (
        <CryptoMarket prices={cryptoPrices} isLoading={isLoading} onRefresh={fetchCryptoPrices} />
      )}

      {activeTab === 'stocks' && <BISTMarket />}
      {activeTab === 'funds' && <FundsMarket />}
      {activeTab === 'gold' && <GoldMarket />}

      {/* Add Asset Modal */}
      <AddAssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          addPortfolioItem(data);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

function PortfolioItemCard({ item, onDelete }: { item: PortfolioItem; onDelete: () => void }) {
  const value = item.currentPrice * item.quantity;
  const cost = item.averageCost * item.quantity;
  const profit = value - cost;
  const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;

  const typeIcons: Record<string, string> = {
    crypto: '🪙',
    stock: '🏢',
    fund: '📊',
    gold: '🥇',
    currency: '💵',
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-xl">
        {typeIcons[item.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{item.symbol}</span>
          <span className="text-xs text-white/40">{item.name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/60">{formatNumber(item.quantity)} adet</span>
          <span className="text-white/40">•</span>
          <span className="text-white/60">Maliyet: {formatCurrency(item.averageCost)}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-white">{formatCurrency(value)}</p>
        <p className={`text-sm ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {profit >= 0 ? '+' : ''}{formatPercentage(profitPercent)}
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

function CryptoMarket({ prices, isLoading, onRefresh }: { prices: CryptoPrice[]; isLoading: boolean; onRefresh: () => void }) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Kripto Piyasası</h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {prices.length > 0 ? (
        <div className="space-y-2">
          {prices.map((crypto) => (
            <div key={crypto.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{crypto.name}</span>
                  <span className="text-xs text-white/40 uppercase">{crypto.symbol}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-white">{formatCurrency(crypto.current_price)}</p>
                <p className={`text-sm ${crypto.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercentage(crypto.price_change_percentage_24h)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-white/40">
          {isLoading ? 'Yükleniyor...' : 'Veri bulunamadı'}
        </div>
      )}
    </GlassCard>
  );
}

function BISTMarket() {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-6">BIST Hisse Senetleri</h3>
      <div className="space-y-2">
        {mockBISTStocks.map((stock) => (
          <div key={stock.symbol} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{stock.symbol}</span>
                <span className="text-xs text-white/40">{stock.name}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-white">{formatCurrency(stock.price)}</p>
              <p className={`text-sm ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPercentage(stock.changePercent)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function FundsMarket() {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-6">TEFAS Yatırım Fonları</h3>
      <div className="space-y-2">
        {mockFunds.map((fund) => (
          <div key={fund.code} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{fund.code}</span>
                <span className="text-xs text-white/40">{fund.name}</span>
              </div>
              <Badge variant="info" className="mt-1">{fund.category}</Badge>
            </div>
            <div className="text-right">
              <p className="font-medium text-white">{formatNumber(fund.price)}</p>
              <p className={`text-sm ${fund.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPercentage(fund.change * 100)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function GoldMarket() {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Altın Fiyatları</h3>
      <div className="space-y-2">
        {mockGoldPrices.map((gold) => (
          <div key={gold.type} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center text-xl">
              🥇
            </div>
            <div className="flex-1">
              <span className="font-medium text-white">{gold.name}</span>
            </div>
            <div className="text-right">
              <p className="font-medium text-white">{formatCurrency(gold.sell)}</p>
              <p className={`text-sm ${gold.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {gold.change >= 0 ? '+' : ''}{formatCurrency(gold.change)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function AddAssetModal({ 
  isOpen, 
  onClose, 
  onSubmit,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: Omit<PortfolioItem, 'id'>) => void;
}) {
  const [type, setType] = useState<PortfolioItem['type']>('crypto');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = () => {
    if (!symbol || !quantity || !price) return;

    onSubmit({
      type,
      symbol: symbol.toUpperCase(),
      name: name || symbol.toUpperCase(),
      quantity: parseFloat(quantity),
      averageCost: parseFloat(price),
      currentPrice: parseFloat(price),
      transactions: [],
    });

    setSymbol('');
    setName('');
    setQuantity('');
    setPrice('');
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
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">Yeni Varlık Ekle</h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Varlık Tipi</label>
            <GlassSelect
              value={type}
              onChange={(v) => setType(v as PortfolioItem['type'])}
              options={[
                { value: 'crypto', label: '🪙 Kripto Para' },
                { value: 'stock', label: '🏢 Hisse Senedi' },
                { value: 'fund', label: '📊 Yatırım Fonu' },
                { value: 'gold', label: '🥇 Altın' },
                { value: 'currency', label: '💵 Döviz' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Sembol</label>
            <GlassInput
              value={symbol}
              onChange={setSymbol}
              placeholder="BTC, THYAO, AFT..."
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">İsim (Opsiyonel)</label>
            <GlassInput
              value={name}
              onChange={setName}
              placeholder="Bitcoin, Türk Hava Yolları..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Miktar</label>
              <GlassInput
                type="number"
                value={quantity}
                onChange={setQuantity}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Alış Fiyatı (₺)</label>
              <GlassInput
                type="number"
                value={price}
                onChange={setPrice}
                placeholder="0.00"
              />
            </div>
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
            Ekle
          </NeonButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
