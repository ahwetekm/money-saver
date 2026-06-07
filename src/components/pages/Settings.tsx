import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { 
  Moon, Sun, Database, Download, Upload, 
  Key, AlertTriangle, CheckCircle, Info, Trash2,
  RefreshCw, Copy, Check, Wifi, WifiOff, Share2,
  QrCode, Link2, Users
} from 'lucide-react';
import { GlassCard, NeonButton, GlassInput, Badge } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { useSync, useSyncStatus } from '../../lib/sync';
import { useErrors, ErrorType, ErrorSeverity } from '../../lib/errors';
import { downloadFile } from '../../lib/utils';

export function Settings() {
  const { settings, updateSettings, exportData, importData } = useFinansStore();
  const [syncKeyInput, setSyncKeyInput] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { status, connect, disconnect, generateKey, isConnected, syncKey } = useSync();
  const { errors, dismiss, clearAll, hasErrors } = useErrors();

  // Initialize sync key input from existing
  useEffect(() => {
    if (syncKey) {
      setSyncKeyInput(syncKey);
    }
  }, [syncKey]);

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

  const handleGenerateKey = () => {
    const newKey = generateKey();
    setSyncKeyInput(newKey);
  };

  const handleConnect = async () => {
    if (syncKeyInput.length < 8) {
      alert('Sync anahtarı en az 8 karakter olmalıdır');
      return;
    }
    
    const success = await connect(syncKeyInput);
    if (success) {
      updateSettings({ gunKey: syncKeyInput, syncEnabled: true });
    } else {
      alert('Bağlantı sağlanamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    updateSettings({ syncEnabled: false });
  };

  const handleCopyKey = async () => {
    if (syncKey) {
      await navigator.clipboard.writeText(syncKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareKey = async () => {
    if (syncKey && navigator.share) {
      try {
        await navigator.share({
          title: 'Finans Sync Anahtarı',
          text: `Bu anahtarı Finans uygulamasına girerek verilerimi senkronize edebilirsiniz: ${syncKey}`,
        });
      } catch (e) {
        // User cancelled or error
      }
    } else {
      handleCopyKey();
    }
  };

  const handleClearData = () => {
    if (confirm('Tüm veriler silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
      indexedDB.deleteDatabase('finans-app');
      localStorage.clear();
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
          syncKey={syncKey}
          onDisconnect={handleDisconnect}
        />

        {/* Error Notifications */}
        {hasErrors && errors.length > 0 && (
          <GlassCard className="p-4" gradient="linear-gradient(135deg, rgba(239,68,68,0.1), rgba(185,28,28,0.1))">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium text-white">Bildirimler ({errors.length})</span>
              </div>
              <button
                onClick={clearAll}
                className="text-xs text-white/50 hover:text-white/70"
              >
                Tümünü Temizle
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {errors.slice(0, 3).map((error) => (
                <motion.div
                  key={error.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{error.message}</p>
                    {error.details && (
                      <p className="text-xs text-white/40 truncate mt-0.5">{error.details}</p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(error.id)}
                    className="text-white/40 hover:text-white/60 shrink-0"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* P2P Sync Settings */}
        <GlassCard className="p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white">P2P Senkronizasyon</h3>
              <p className="text-xs lg:text-sm text-white/50">Cihazlar arası veri aktarımı</p>
            </div>
          </div>

          <div className="space-y-4">
            {!isConnected ? (
              <>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Sync Anahtarı</label>
                  <div className="flex gap-2">
                    <GlassInput
                      value={syncKeyInput}
                      onChange={setSyncKeyInput}
                      placeholder="En az 8 karakter..."
                      className="flex-1"
                    />
                    <button
                      onClick={handleGenerateKey}
                      className="px-3 py-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors text-sm whitespace-nowrap"
                    >
                      Oluştur
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    Yeni bir anahtar oluşturun veya mevcut bir anahtarı girin
                  </p>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={syncKeyInput.length < 8 || status === 'connecting'}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'connecting' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Bağlanıyor...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Bağlan
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                {/* Connected State */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Bağlı</span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="text-xs px-3 py-1 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                  >
                    Bağlantıyı Kes
                  </button>
                </div>

                {/* Sync Key Display */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/50">Sync Anahtarı</span>
                    <div className="flex gap-1">
                      <button
                        onClick={handleCopyKey}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Kopyala"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/60" />}
                      </button>
                      <button
                        onClick={handleShareKey}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Paylaş"
                      >
                        <Share2 className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>
                  <p className="font-mono text-white text-sm break-all">{syncKey}</p>
                </div>

                {/* Instructions */}
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-xs text-white/70">
                    <strong className="text-cyan-400">Nasıl kullanılır:</strong> Bu anahtarı diğer cihazınıza kurun. 
                    Her iki cihazda da aynı anahtarı kullanarak verileriniz senkronize edilecek.
                  </p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div className="text-xs text-white/70">
                  <p className="font-medium text-white mb-1">P2P Senkronizasyon</p>
                  <p>Verileriniz doğrudan cihazlar arasında aktarılır. İnternet bağlantısı gereklidir. 
                  İlk bağlantı birkaç saniye sürebilir.</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

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
                  <p className="text-xs text-white/50">JSON dosyası indir</p>
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
              <span className="text-white">IndexedDB (Yerel)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Senkronizasyon</span>
              <span className="text-cyan-400">Gun.js P2P</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">PWA</span>
              <span className="text-emerald-400">Aktif</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-white/60">Offline Mod</span>
              <span className="text-emerald-400">Destekleniyor</span>
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
  syncKey,
  onDisconnect 
}: { 
  status: string; 
  isConnected: boolean;
  syncKey: string;
  onDisconnect: () => void;
}) {
  const statusConfig = {
    connected: { 
      icon: CheckCircle, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      label: 'P2P Bağlı',
      description: 'Senkronizasyon aktif',
      animate: false
    },
    syncing: { 
      icon: RefreshCw, 
      color: 'text-cyan-400', 
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      label: 'Senkronize Ediliyor',
      description: 'Veriler aktarılıyor...',
      animate: true
    },
    connecting: { 
      icon: RefreshCw, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      label: 'Bağlanıyor',
      description: 'P2P ağına bağlanılıyor...',
      animate: true
    },
    offline: { 
      icon: WifiOff, 
      color: 'text-white/40', 
      bg: 'bg-white/5',
      border: 'border-white/10',
      label: 'Çevrimdışı',
      description: 'P2P senkronizasyonu kapalı',
      animate: false
    },
    error: { 
      icon: AlertTriangle, 
      color: 'text-red-400', 
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'Bağlantı Hatası',
      description: 'Tekrar deneyin',
      animate: false
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl ${config.bg} border ${config.border}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className={`font-medium ${config.color}`}>{config.label}</p>
            <p className="text-xs text-white/50">{config.description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
