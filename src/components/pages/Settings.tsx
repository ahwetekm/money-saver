import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { 
  Moon, Sun, Database, Download, Upload, 
  Key, AlertTriangle, CheckCircle, Info, Trash2,
  RefreshCw, Wifi, WifiOff, Loader2
} from 'lucide-react';
import { GlassCard, NeonButton, GlassInput, Badge } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { useSync, useSyncStatus } from '../../lib/sync';
import { downloadFile } from '../../lib/utils';

export function Settings() {
  const { settings, updateSettings, exportData, importData } = useFinansStore();
  const [gunKey, setGunKey] = useState(settings.gunKey);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, connect, disconnect, isConnected } = useSync();

  const handleExport = async () => {
    try {
      const data = await exportData();
      const filename = `finans_yedek_${new Date().toISOString().slice(0, 10)}.json`;
      downloadFile(data, filename);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importData(text);
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveGunKey = async () => {
    if (gunKey.length < 8) {
      alert('Sync anahtarı en az 8 karakter olmalıdır');
      return;
    }
    
    const success = await connect(gunKey);
    if (success) {
      updateSettings({ gunKey, syncEnabled: true });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    updateSettings({ syncEnabled: false });
  };

  const handleClearData = () => {
    if (confirm('Tüm veriler silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
      indexedDB.deleteDatabase('finans-app');
      window.location.reload();
    }
  };

  return (
    <div>
      <PageHeader 
        title="Ayarlar" 
        subtitle="Uygulama tercihlerinizi yönetin"
      />

      <div className="space-y-4">
        {/* Sync Status Card */}
        <SyncStatusCard 
          status={status}
          isConnected={isConnected}
          onDisconnect={handleDisconnect}
        />

        {/* Theme Settings */}
        <GlassCard className="p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Moon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white">Tema</h3>
              <p className="text-xs lg:text-sm text-white/50">Uygulama görünümü</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm ${
                settings.theme === 'dark'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Moon className="w-4 h-4" />
              Koyu
            </button>
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm ${
                settings.theme === 'light'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Sun className="w-4 h-4" />
              Açık
            </button>
          </div>
        </GlassCard>

        {/* Sync Settings */}
        <GlassCard className="p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <Key className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white">P2P Senkronizasyon</h3>
              <p className="text-xs lg:text-sm text-white/50">Cihazlar arası veri eşitleme</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Sync Anahtarı</label>
              <div className="flex gap-2">
                <GlassInput
                  value={gunKey}
                  onChange={setGunKey}
                  placeholder="En az 8 karakter..."
                  className="flex-1"
                />
                {isConnected ? (
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                  >
                    Bağlantıyı Kes
                  </button>
                ) : (
                  <NeonButton onClick={handleSaveGunKey}>
                    Bağlan
                  </NeonButton>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div className="text-xs text-white/70">
                  <p className="font-medium text-white mb-1">Nasıl çalışır?</p>
                  <p>Aynı sync anahtarını kullanan tüm cihazlar verilerinizi görebilir. Anahtarınızı güvenli tutun.</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Data Management */}
        <GlassCard className="p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white">Veri Yönetimi</h3>
              <p className="text-xs lg:text-sm text-white/50">Yedekleme ve geri yükleme</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Export */}
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-emerald-400" />
                <div className="text-left">
                  <h4 className="font-medium text-white text-sm">Verileri Dışa Aktar</h4>
                  <p className="text-xs text-white/50">JSON olarak indir</p>
                </div>
              </div>
              <Badge variant="success">İndir</Badge>
            </button>

            {/* Import */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-purple-400" />
                <div>
                  <h4 className="font-medium text-white text-sm">Verileri İçe Aktar</h4>
                  <p className="text-xs text-white/50">JSON dosyası yükle</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {importStatus === 'success' && <Badge variant="success">Başarılı!</Badge>}
                {importStatus === 'error' && <Badge variant="danger">Hata!</Badge>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-colors"
                >
                  Yükle
                </button>
              </div>
            </div>

            {/* Clear Data */}
            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-400" />
                <div className="text-left">
                  <h4 className="font-medium text-white text-sm">Tüm Verileri Sil</h4>
                  <p className="text-xs text-white/50">Geri alınamaz</p>
                </div>
              </div>
              <Badge variant="danger">Sil</Badge>
            </button>
          </div>
        </GlassCard>

        {/* About */}
        <GlassCard className="p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Info className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white">Hakkında</h3>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Versiyon</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Veri Depolama</span>
              <span className="text-white">IndexedDB</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Senkronizasyon</span>
              <span className="text-white">Gun.js P2P</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-white/60">PWA</span>
              <span className="text-emerald-400">Aktif</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10">
            <p className="text-xs text-white/70 text-center">
              🔒 Tüm verileriniz cihazınızda güvenle saklanır
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// Sync Status Card Component
function SyncStatusCard({ 
  status, 
  isConnected,
  onDisconnect 
}: { 
  status: string; 
  isConnected: boolean;
  onDisconnect: () => void;
}) {
  const statusConfig = {
    connected: { 
      icon: Wifi, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      label: 'Bağlı',
      description: 'Verileriniz senkronize ediliyor'
    },
    syncing: { 
      icon: Loader2, 
      color: 'text-cyan-400', 
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      label: 'Senkronize Ediliyor',
      description: 'Lütfen bekleyin...'
    },
    connecting: { 
      icon: Loader2, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      label: 'Bağlanıyor',
      description: 'P2P ağına bağlanılıyor...'
    },
    disconnected: { 
      icon: WifiOff, 
      color: 'text-white/40', 
      bg: 'bg-white/5',
      border: 'border-white/10',
      label: 'Çevrimdışı',
      description: 'Veriler sadece bu cihazda'
    },
    error: { 
      icon: WifiOff, 
      color: 'text-red-400', 
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'Bağlantı Hatası',
      description: 'Lütfen tekrar deneyin'
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
  const Icon = config.icon;
  const isAnimating = status === 'syncing' || status === 'connecting';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl ${config.bg} border ${config.border}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.color} ${isAnimating ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className={`font-medium ${config.color}`}>{config.label}</p>
            <p className="text-xs text-white/50">{config.description}</p>
          </div>
        </div>
        {isConnected && (
          <button
            onClick={onDisconnect}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
          >
            Bağlantıyı Kes
          </button>
        )}
      </div>
    </motion.div>
  );
}
