import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, Moon, Sun, Database, Download, Upload, 
  Key, RefreshCw, AlertTriangle, CheckCircle, Info, Trash2
} from 'lucide-react';
import { GlassCard, NeonButton, GlassInput, Badge } from '../ui/GlassCard';
import { PageHeader } from '../layout/Layout';
import { useFinansStore } from '../../store/useFinansStore';
import { downloadFile } from '../../lib/utils';

export function Settings() {
  const { settings, updateSettings, exportData, importData } = useFinansStore();
  const [gunKey, setGunKey] = useState(settings.gunKey);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveGunKey = () => {
    updateSettings({ gunKey, syncEnabled: gunKey.length > 0 });
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

      <div className="space-y-6">
        {/* Theme Settings */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Moon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Tema</h3>
              <p className="text-sm text-white/50">Uygulama görünümünü özelleştirin</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl transition-all ${
                settings.theme === 'dark'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Moon className="w-5 h-5" />
              Koyu Tema
            </button>
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl transition-all ${
                settings.theme === 'light'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Sun className="w-5 h-5" />
              Açık Tema
            </button>
          </div>
        </GlassCard>

        {/* Sync Settings */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <Key className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">P2P Senkronizasyon</h3>
              <p className="text-sm text-white/50">Gun.js ile cihazlar arası veri senkronizasyonu</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Sync Anahtarı</label>
              <div className="flex gap-3">
                <GlassInput
                  value={gunKey}
                  onChange={setGunKey}
                  placeholder="Eşsiz bir anahtar girin..."
                  className="flex-1"
                />
                <NeonButton onClick={handleSaveGunKey}>
                  Kaydet
                </NeonButton>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div className="text-sm text-white/70">
                  <p className="font-medium text-white mb-1">Nasıl çalışır?</p>
                  <p>Sync anahtarı, verilerinizi şifreli olarak peer-to-peer ağ üzerinden diğer cihazlarınızla eşitler. 
                  Aynı anahtarı kullanan tüm cihazlar verilerinizi görebilir.</p>
                </div>
              </div>
            </div>

            {settings.syncEnabled && (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Senkronizasyon aktif</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Data Management */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
              <Database className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Veri Yönetimi</h3>
              <p className="text-sm text-white/50">Verilerinizi yedekleyin veya geri yükleyin</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Export */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <h4 className="font-medium text-white">Verileri Dışa Aktar</h4>
                <p className="text-sm text-white/50">Tüm verilerinizi JSON dosyası olarak indirin</p>
              </div>
              <NeonButton onClick={handleExport} variant="success">
                <Download className="w-5 h-5 mr-2 inline" />
                İndir
              </NeonButton>
            </div>

            {/* Import */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <h4 className="font-medium text-white">Verileri İçe Aktar</h4>
                <p className="text-sm text-white/50">Daha önce yedeklediğiniz verileri yükleyin</p>
              </div>
              <div className="flex items-center gap-3">
                {importStatus === 'success' && (
                  <Badge variant="success">Başarılı!</Badge>
                )}
                {importStatus === 'error' && (
                  <Badge variant="danger">Hata!</Badge>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <NeonButton onClick={() => fileInputRef.current?.click()} variant="secondary">
                  <Upload className="w-5 h-5 mr-2 inline" />
                  Yükle
                </NeonButton>
              </div>
            </div>

            {/* Clear Data */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div>
                <h4 className="font-medium text-white">Tüm Verileri Sil</h4>
                <p className="text-sm text-white/50">Bu işlem geri alınamaz</p>
              </div>
              <button
                onClick={handleClearData}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Sil
              </button>
            </div>
          </div>
        </GlassCard>

        {/* About */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Info className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Hakkında</h3>
              <p className="text-sm text-white/50">Uygulama bilgileri</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
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
              <span className="text-white">Gun.js (P2P)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-white/60">Kripto Verileri</span>
              <span className="text-white">CoinGecko API</span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10">
            <p className="text-sm text-white/70 text-center">
              🔒 Tüm verileriniz cihazınızda güvenle saklanır. 
              Hiçbir veri sunucularımıza gönderilmez.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
