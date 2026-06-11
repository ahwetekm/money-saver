import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, RefreshCw, Bitcoin, Building2, Coins, DollarSign, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SafeChart } from '../ui/SafeChart';
import { GlassCard, NeonButton, GlassInput, GlassSelect } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { PortfolioItem, CryptoPrice } from '../../types';
import { formatCurrency, formatCompactCurrency, formatPercentage, formatNumber } from '../../lib/utils';
import { mockBISTStocks, mockFunds, mockGoldPrices } from '../../data/mockData';

interface SelectableAsset {
  id: string;
  symbol: string;
  name: string;
  type: PortfolioItem['type'];
  currentPrice: number;
  category?: string;
}

export function Portfolio() {
  const portfolio = useFinansStore((s) => s.portfolio);
  const addPortfolioItem = useFinansStore((s) => s.addPortfolioItem);
  const deletePortfolioItem = useFinansStore((s) => s.deletePortfolioItem);
  const cryptoPrices = useFinansStore((s) => s.cryptoPrices);
  const setCryptoPrices = useFinansStore((s) => s.setCryptoPrices);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'crypto' | 'stocks' | 'funds' | 'gold'>('overview');
  const [isLoading, setIsLoading] = useState(false);

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
    let cancelled = false;
    const controller = new AbortController();
    
    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        const coinGeckoApiUrl = import.meta.env.VITE_COINGECKO_API_URL
          || 'https://api.coingecko.com/api/v3/coins/markets';
        const response = await fetch(
          `${coinGeckoApiUrl}?vs_currency=try&order=market_cap_desc&per_page=20&page=1&sparkline=false`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!cancelled) {
          setCryptoPrices(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch crypto prices:', error);
          setCryptoPrices([
            { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 2500000, price_change_percentage_24h: 2.5, image: '' },
            { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 125000, price_change_percentage_24h: -1.2, image: '' },
            { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 4500, price_change_percentage_24h: 5.3, image: '' },
          ]);
        }
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    };
    
    fetchPrices();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [setCryptoPrices]);

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
      name: type === 'crypto' ? 'Kripto' : type === 'stock' ? 'Hisse' : type === 'fund' ? 'Fon' : type === 'gold' ? 'Altın' : 'Döviz',
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
    <div className="space-y-6">
      <PageHeader 
        title="Portföy" 
        subtitle="Yatırımlarınızı takip edin"
        action={
          <div className="flex gap-2">
            <button
              onClick={fetchCryptoPrices}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
            >
              <RefreshCw className={`w-4 h-4 text-white/60 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <NeonButton onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1 inline shrink-0" />
              Varlık Ekle
            </NeonButton>
          </div>
        }
      />

      {/* Portfolio Summary Card (Merged stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1">Toplam Değer</p>
          <p className="text-2xl font-extrabold text-white tracking-tight tabular-nums">{formatCompactCurrency(totalValue)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1">Toplam Kar/Zarar</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalProfit >= 0 ? '+' : ''}{formatCompactCurrency(totalProfit)}
            </span>
            <span className={`text-xs font-semibold ${totalProfit >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
              {formatPercentage(profitPercent)}
            </span>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1">Varlık Sayısı</p>
          <p className="text-2xl font-extrabold text-white tracking-tight tabular-nums">{portfolio.length}</p>
        </GlassCard>
      </div>

      {/* Segmented Tab Control */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-white/5 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white/5 text-[#00c2ff]'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Distribution */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-white/80 tracking-tight mb-6">Varlık Dağılımı</h3>
            {pieData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="w-full sm:w-1/2">
                  <SafeChart height={180}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={66}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0e1524', 
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }} 
                          formatter={(value) => [`₺${Number(value).toLocaleString('tr-TR')}`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
                <div className="w-full sm:w-1/2 space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-white/50 truncate">{item.name}</span>
                      </div>
                      <span className="text-white/80 font-bold tabular-nums shrink-0">{formatCompactCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-white/40">
                Portföyünüz boş
              </div>
            )}
          </GlassCard>

          {/* Holdings List */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-white/80 tracking-tight mb-4">Varlıklarım</h3>
            {portfolio.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {portfolio.map((item) => (
                  <PortfolioItemCard 
                    key={item.id} 
                    item={item} 
                    onDelete={() => deletePortfolioItem(item.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-white/40">
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
        onSubmit={(data, investedAmount) => {
          addPortfolioItem(data, investedAmount);
          setIsModalOpen(false);
        }}
        cryptoPrices={cryptoPrices}
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
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-all">
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">
        {typeIcons[item.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-semibold text-white">{item.symbol}</span>
          <span className="text-[10px] text-white/40 truncate">{item.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-0.5">
          <span>{formatNumber(item.quantity)} Adet</span>
          <span>•</span>
          <span>Maliyet: {formatCurrency(item.averageCost)}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-white tabular-nums">{formatCurrency(value)}</p>
        <p className={`text-[10px] font-semibold tabular-nums mt-0.5 ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {profit >= 0 ? '+' : ''}{formatPercentage(profitPercent)}
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

function CryptoMarket({ prices, isLoading, onRefresh }: { prices: CryptoPrice[]; isLoading: boolean; onRefresh: () => void }) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white/80 tracking-tight">Kripto Para Fiyatları</h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-white/40 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {prices.length > 0 ? (
        <div className="space-y-1.5">
          {prices.map((crypto) => (
            <div key={crypto.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <Bitcoin className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-white">{crypto.name}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">{crypto.symbol}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-white tabular-nums">{formatCurrency(crypto.current_price)}</p>
                <p className={`text-[10px] font-semibold tabular-nums mt-0.5 ${crypto.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercentage(crypto.price_change_percentage_24h)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-44 flex items-center justify-center text-xs text-white/40">
          {isLoading ? 'Fiyatlar yükleniyor...' : 'Veri yüklenemedi'}
        </div>
      )}
    </GlassCard>
  );
}

function BISTMarket() {
  return (
    <GlassCard className="p-6">
      <h3 className="text-sm font-semibold text-white/80 tracking-tight mb-5">BIST Hisse Senetleri</h3>
      <div className="space-y-1.5">
        {mockBISTStocks.map((stock) => (
          <div key={stock.symbol} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold text-white">{stock.symbol}</span>
                <span className="text-[10px] text-white/40 truncate">{stock.name}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-white tabular-nums">{formatCurrency(stock.price)}</p>
              <p className={`text-[10px] font-semibold tabular-nums mt-0.5 ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
      <h3 className="text-sm font-semibold text-white/80 tracking-tight mb-5">Yatırım Fonları</h3>
      <div className="space-y-1.5">
        {mockFunds.map((fund) => (
          <div key={fund.code} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold text-white">{fund.code}</span>
                <span className="text-[10px] text-white/40 truncate">{fund.name}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-white tabular-nums">{formatNumber(fund.price)}</p>
              <p className={`text-[10px] font-semibold tabular-nums mt-0.5 ${fund.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
      <h3 className="text-sm font-semibold text-white/80 tracking-tight mb-5">Altın Fiyatları</h3>
      <div className="space-y-1.5">
        {mockGoldPrices.map((gold) => (
          <div key={gold.type} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-sm shrink-0">
              🥇
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-white">{gold.name}</span>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-white tabular-nums">{formatCurrency(gold.sell)}</p>
              <p className={`text-[10px] font-semibold tabular-nums mt-0.5 ${gold.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {gold.change >= 0 ? '+' : ''}{formatCurrency(gold.change)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ---- NEW AddAssetModal with searchable categorized asset picker ----

const assetCategories: { type: PortfolioItem['type']; label: string; icon: string; color: string }[] = [
  { type: 'crypto', label: 'Kripto Para', icon: '🪙', color: '#F59E0B' },
  { type: 'stock', label: 'Hisse Senedi (BIST)', icon: '🏢', color: '#3B82F6' },
  { type: 'fund', label: 'Yatırım Fonu', icon: '📊', color: '#10B981' },
  { type: 'gold', label: 'Altın', icon: '🥇', color: '#FCD34D' },
];

function buildAssetList(cryptoPrices: CryptoPrice[]): SelectableAsset[] {
  const assets: SelectableAsset[] = [];

  // Crypto
  for (const c of cryptoPrices) {
    assets.push({
      id: `crypto-${c.id}`,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      type: 'crypto',
      currentPrice: c.current_price,
      category: 'Kripto Para',
    });
  }

  // BIST Stocks
  for (const s of mockBISTStocks) {
    assets.push({
      id: `stock-${s.symbol}`,
      symbol: s.symbol,
      name: s.name,
      type: 'stock',
      currentPrice: s.price,
      category: 'Hisse Senedi',
    });
  }

  // Funds
  for (const f of mockFunds) {
    assets.push({
      id: `fund-${f.code}`,
      symbol: f.code,
      name: f.name,
      type: 'fund',
      currentPrice: f.price,
      category: f.category,
    });
  }

  // Gold
  for (const g of mockGoldPrices) {
    assets.push({
      id: `gold-${g.type}`,
      symbol: g.type === 'gram' ? 'GRAM' : g.type === 'ceyrek' ? 'ÇEYREK' : g.type === 'yarim' ? 'YARIM' : g.type === 'tam' ? 'TAM' : g.type === 'cumhuriyet' ? 'CUMHUR' : 'ATA',
      name: g.name,
      type: 'gold',
      currentPrice: g.sell,
      category: 'Altın',
    });
  }

  return assets;
}

function AddAssetModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  cryptoPrices,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: Omit<PortfolioItem, 'id'>, investedAmount: number) => void;
  cryptoPrices: CryptoPrice[];
}) {
  const [type, setType] = useState<PortfolioItem['type']>('crypto');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<SelectableAsset | null>(null);
  const [price, setPrice] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [showAll, setShowAll] = useState(false);

  const allAssets = useMemo(() => buildAssetList(cryptoPrices), [cryptoPrices]);

  const filteredAssets = useMemo(() => {
    let list = allAssets.filter(a => a.type === type);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.symbol.toLowerCase().includes(q) || 
        a.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allAssets, type, searchQuery]);

  const displayAssets = showAll ? filteredAssets : filteredAssets.slice(0, 3);

  // When an asset is selected, pre-fill the price field with the current price
  useEffect(() => {
    if (selectedAsset) {
      setPrice(selectedAsset.currentPrice.toString());
    }
  }, [selectedAsset]);

  // Parse the user-entered price
  const priceValue = useMemo(() => {
    const p = parseFloat(price);
    return isNaN(p) || p <= 0 ? 0 : p;
  }, [price]);

  // Auto-calculate quantity based on user-entered price
  const quantity = useMemo(() => {
    if (!investedAmount || priceValue <= 0) return 0;
    const amount = parseFloat(investedAmount);
    if (isNaN(amount) || amount <= 0) return 0;
    return amount / priceValue;
  }, [priceValue, investedAmount]);

  const handleSubmit = () => {
    if (!selectedAsset || !investedAmount || priceValue <= 0) return;
    const amount = parseFloat(investedAmount);
    if (isNaN(amount) || amount <= 0) return;
    const qty = amount / priceValue;

    onSubmit({
      type: selectedAsset.type,
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      quantity: qty,
      averageCost: priceValue,
      currentPrice: priceValue,
      transactions: [],
    }, amount);

    setSelectedAsset(null);
    setPrice('');
    setInvestedAmount('');
    setSearchQuery('');
    setShowAll(false);
  };

  const handleSelectAsset = (asset: SelectableAsset) => {
    setSelectedAsset(asset);
    setSearchQuery(asset.symbol + ' - ' + asset.name);
  };

  const handleClose = () => {
    setSelectedAsset(null);
    setInvestedAmount('');
    setSearchQuery('');
    setShowAll(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/5 shadow-premium overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Yeni Varlık Ekle</h3>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Asset Type Tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {assetCategories.map((cat) => (
              <button
                key={cat.type}
                onClick={() => { setType(cat.type); setSelectedAsset(null); setSearchQuery(''); setShowAll(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  type === cat.type
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-white/40 hover:text-white/70 bg-white/5 border border-transparent'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <GlassInput
              value={searchQuery}
              onChange={(v) => { setSearchQuery(v); setShowAll(true); }}
              placeholder="Ara (sembol veya isim)..."
              className="pl-9"
            />
          </div>

          {/* Asset List */}
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {displayAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleSelectAsset(asset)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                  selectedAsset?.id === asset.id
                    ? 'bg-[#00c2ff]/10 border border-[#00c2ff]/30'
                    : 'bg-white/5 border border-transparent hover:bg-white/10'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs shrink-0">
                  {assetCategories.find(c => c.type === asset.type)?.icon || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-white">{asset.symbol}</span>
                    <span className="text-[10px] text-white/40 truncate">{asset.name}</span>
                  </div>
                  <div className="text-[10px] text-white/30">
                    {asset.category}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-white tabular-nums">{formatCurrency(asset.currentPrice)}</span>
                </div>
              </button>
            ))}
            {displayAssets.length === 0 && (
              <div className="text-center py-4 text-xs text-white/40">
                Sonuç bulunamadı
              </div>
            )}
          </div>

          {/* Show More / Less */}
          {filteredAssets.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-center gap-1 py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              {showAll ? (
                <>Daha Az Göster <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Daha Fazla ({filteredAssets.length - 3} tane daha) <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}

          {/* Investment Amount Input */}
          {selectedAsset && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 pt-2 border-t border-white/5"
            >
              <div>
                <label className="block text-xs text-white/40 mb-1.5 font-medium">Alış Fiyatı (₺)</label>
                <GlassInput
                  type="number"
                  value={price}
                  onChange={setPrice}
                  placeholder="0.00"
                />
                {selectedAsset && (
                  <p className="text-[10px] text-white/30 mt-1">Anlık fiyat: {formatCurrency(selectedAsset.currentPrice)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 font-medium">Yatırılacak Tutar (₺)</label>
                <GlassInput
                  type="number"
                  value={investedAmount}
                  onChange={setInvestedAmount}
                  placeholder="0.00"
                />
              </div>
              {quantity > 0 && (
                <div className="px-4 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Alınacak Miktar</span>
                    <span className="text-white font-bold tabular-nums">{formatNumber(quantity)} Adet</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="p-5 border-t border-white/5 flex gap-2.5">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 rounded-xl text-xs bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
          >
            İptal
          </button>
          <NeonButton 
            onClick={handleSubmit} 
            className="flex-1 text-xs"
            disabled={!selectedAsset || !investedAmount || quantity <= 0}
          >
            {quantity > 0 
              ? `${formatNumber(quantity)} Adet Ekle` 
              : 'Ekle'}
          </NeonButton>
        </div>
      </motion.div>
    </motion.div>
  );
}