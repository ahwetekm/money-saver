import { BISTStock, Fund, ExchangeRate, GoldPrice } from '../types';

export const mockBISTStocks: BISTStock[] = [
  { symbol: 'THYAO', name: 'Türk Hava Yolları', price: 287.50, change: 5.25, changePercent: 1.86 },
  { symbol: 'GARAN', name: 'Garanti BBVA', price: 98.40, change: -1.20, changePercent: -1.20 },
  { symbol: 'AKBNK', name: 'Akbank', price: 62.80, change: 0.45, changePercent: 0.72 },
  { symbol: 'ASELS', name: 'Aselsan', price: 98.25, change: 2.10, changePercent: 2.19 },
  { symbol: 'TUPRS', name: 'Tüpraş', price: 245.00, change: -3.50, changePercent: -1.41 },
  { symbol: 'SISE', name: 'Şişe Cam', price: 52.30, change: 0.80, changePercent: 1.55 },
  { symbol: 'KCHOL', name: 'Koç Holding', price: 168.90, change: 1.25, changePercent: 0.75 },
  { symbol: 'FROTO', name: 'Ford Otosan', price: 785.00, change: 12.50, changePercent: 1.62 },
  { symbol: 'SAHOL', name: 'Sabancı Holding', price: 45.60, change: -0.40, changePercent: -0.87 },
  { symbol: 'YKBNK', name: 'Yapı Kredi Bank', price: 42.15, change: 0.35, changePercent: 0.84 },
];

export const mockFunds: Fund[] = [
  { code: 'AFT', name: 'Avrupa Fonları Yönetim A.Ş. Fonu', price: 1.2345, change: 0.0123, category: 'Hisse Senedi' },
  { code: 'AKY', name: 'Ak Portföy Yönetimi Fonu', price: 2.5678, change: -0.0089, category: 'Borçlanma Araçları' },
  { code: 'GAR', name: 'Garanti Fon Yönetim Fonu', price: 1.8901, change: 0.0234, category: 'Hisse Senedi' },
  { code: 'YKB', name: 'Yapı Kredi Portföy Fonu', price: 3.4567, change: 0.0156, category: 'Katılım Fonu' },
  { code: 'ISB', name: 'İş Portföy Yönetim Fonu', price: 1.1234, change: -0.0045, category: 'Para Piyasası' },
  { code: 'HSB', name: 'HSBC Portföy Fonu', price: 2.3456, change: 0.0078, category: 'Hisse Senedi' },
  { code: 'QNB', name: 'QNB Portföy Fonu', price: 1.5678, change: 0.0098, category: 'Borçlanma Araçları' },
  { code: 'VAK', name: 'Vakıf Fon Yönetim Fonu', price: 1.8901, change: -0.0012, category: 'Katılım Fonu' },
];

export const mockExchangeRates: ExchangeRate[] = [
  { code: 'USD', name: 'ABD Doları', buy: 34.25, sell: 34.45, change: 0.15 },
  { code: 'EUR', name: 'Euro', buy: 37.10, sell: 37.35, change: -0.08 },
  { code: 'GBP', name: 'İngiliz Sterlini', buy: 43.50, sell: 43.85, change: 0.25 },
  { code: 'CHF', name: 'İsviçre Frangı', buy: 38.90, sell: 39.20, change: 0.12 },
  { code: 'JPY', name: 'Japon Yeni', buy: 0.228, sell: 0.232, change: -0.005 },
  { code: 'SAR', name: 'Suudi Riyali', buy: 9.12, sell: 9.22, change: 0.03 },
];

export const mockGoldPrices: GoldPrice[] = [
  { type: 'gram', name: 'Gram Altın', buy: 2450, sell: 2480, change: 15.50 },
  { type: 'ceyrek', name: 'Çeyrek Altın', buy: 4050, sell: 4120, change: 25.00 },
  { type: 'yarim', name: 'Yarım Altın', buy: 8100, sell: 8240, change: 50.00 },
  { type: 'tam', name: 'Tam Altın', buy: 16200, sell: 16480, change: 100.00 },
  { type: 'cumhuriyet', name: 'Cumhuriyet Altını', buy: 16500, sell: 16800, change: 120.00 },
  { type: 'ata', name: 'Ata Lira', buy: 16800, sell: 17100, change: 150.00 },
];

export const incomeCategories = ['Maaş', 'Yan Gelir', 'Yatırım Geliri', 'Freelance', 'Kira', 'Diğer'];

export const expenseCategories = [
  'Market', 'Ev', 'Fatura', 'Sosyal', 'Ulaşım', 'Sağlık',
  'Eğitim', 'Kıyafet', 'Eğlence', 'Restoran', 'Abonelik', 'Diğer'
];

export const categoryIcons: Record<string, string> = {
  'Maaş': '💰',
  'Yan Gelir': '💵',
  'Yatırım Geliri': '📈',
  'Freelance': '💻',
  'Kira': '🏠',
  'Diğer': '📌',
  'Market': '🛒',
  'Ev': '🏡',
  'Fatura': '📄',
  'Sosyal': '🎉',
  'Ulaşım': '🚗',
  'Sağlık': '💊',
  'Eğitim': '📚',
  'Kıyafet': '👔',
  'Eğlence': '🎮',
  'Restoran': '🍽️',
  'Abonelik': '📱',
};

export const categoryColors: Record<string, string> = {
  'Maaş': '#10B981',
  'Yan Gelir': '#34D399',
  'Yatırım Geliri': '#059669',
  'Freelance': '#047857',
  'Kira': '#065F46',
  'Diğer': '#6B7280',
  'Market': '#F59E0B',
  'Ev': '#8B5CF6',
  'Fatura': '#3B82F6',
  'Sosyal': '#EC4899',
  'Ulaşım': '#14B8A6',
  'Sağlık': '#EF4444',
  'Eğitim': '#6366F1',
  'Kıyafet': '#F97316',
  'Eğlence': '#A855F7',
  'Restoran': '#F43F5E',
  'Abonelik': '#0EA5E9',
};

export const moodEmojis: Record<string, string> = {
  'happy': '😊',
  'stressed': '😰',
  'neutral': '😐',
  'excited': '🤩',
  'sad': '😢',
};

export const moodColors: Record<string, string> = {
  'happy': '#10B981',
  'stressed': '#EF4444',
  'neutral': '#6B7280',
  'excited': '#F59E0B',
  'sad': '#3B82F6',
};
