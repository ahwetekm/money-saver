import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Info, LogOut, User, Lock, AlertTriangle, Trash2, CheckCircle, Cloud, CloudOff, RefreshCw, Wifi, WifiOff, Database, HardDrive } from 'lucide-react';
import { GlassCard, GlassInput, NeonButton } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { removeToken, updateUser } from '../../lib/api';

export function Settings() {
  const { settings, updateSettings, resetData, isOnline, syncStatus, pendingSyncCount, syncNow } = useFinansStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogout = () => {
    removeToken();
    window.location.href = '/login';
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !password) return;
    
    setIsUpdating(true);
    setUpdateMessage({ type: '', text: '' });
    
    try {
      await updateUser({ 
        email: email || undefined, 
        password: password || undefined 
      });
      setUpdateMessage({ type: 'success', text: 'Hesap bilgileri güncellendi.' });
      setEmail('');
      setPassword('');
      setTimeout(() => setUpdateMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setUpdateMessage({ type: 'error', text: error.message || 'Güncelleme başarısız.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await resetData();
      setShowResetConfirm(false);
      setUpdateMessage({ type: 'success', text: 'Tüm verileriniz başarıyla sıfırlandı.' });
      setTimeout(() => setUpdateMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setUpdateMessage({ type: 'error', text: error.message || 'Sıfırlama başarısız.' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="pb-20">
      <PageHeader 
        title="Ayarlar" 
        subtitle="Uygulama tercihlerinizi yönetin"
      />

      <AnimatePresence>
        {updateMessage.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 mb-4 rounded-xl border flex items-center gap-3 \${
              updateMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {updateMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <p className="text-sm">{updateMessage.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Account Details Update */}
        <GlassCard className="p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white">Hesap Bilgileri</h3>
              <p className="text-xs lg:text-sm text-white/50">E-posta ve şifrenizi güncelleyin</p>
            </div>
          </div>

          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Yeni E-posta Adresi
              </label>
              <GlassInput
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Yeni e-posta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Yeni Şifre
              </label>
              <GlassInput
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Yeni şifre (en az 6 karakter)"
              />
            </div>
            <NeonButton 
              disabled={isUpdating || (!email && !password)}
              className="w-full justify-center"
            >
              {isUpdating ? 'Güncelleniyor...' : 'Bilgileri Güncelle'}
            </NeonButton>
          </form>
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

        {/* Sync & Offline Status */}
        <GlassCard className="p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white">Senkronizasyon</h3>
              <p className="text-xs lg:text-sm text-white/50">Offline-first veri yönetimi</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-400" />
                )}
                <span className="text-sm text-white/80">Bağlantı Durumu</span>
              </div>
              <span className={`text-sm font-medium ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
              </span>
            </div>

            {/* Sync Status */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                ) : syncStatus === 'error' ? (
                  <CloudOff className="w-4 h-4 text-red-400" />
                ) : (
                  <Cloud className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-sm text-white/80">Sync Durumu</span>
              </div>
              <span className={`text-sm font-medium ${
                syncStatus === 'syncing' ? 'text-blue-400' :
                syncStatus === 'error' ? 'text-red-400' :
                syncStatus === 'complete' ? 'text-emerald-400' : 'text-white/60'
              }`}>
                {syncStatus === 'syncing' ? 'Senkronize ediliyor...' :
                 syncStatus === 'error' ? 'Hata' :
                 syncStatus === 'complete' ? 'Tamamlandı' : 'Bekliyor'}
              </span>
            </div>

            {/* Pending Changes */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-white/80">Bekleyen Değişiklik</span>
              </div>
              <span className={`text-sm font-medium ${pendingSyncCount > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                {pendingSyncCount}
              </span>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={syncNow}
              disabled={!isOnline || syncStatus === 'syncing'}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-medium ${
                !isOnline || syncStatus === 'syncing'
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              {syncStatus === 'syncing' ? 'Senkronize ediliyor...' : 'Şimdi Senkronize Et'}
            </button>

            {/* Info text */}
            <p className="text-xs text-white/40 text-center mt-2">
              {isOnline 
                ? 'Tüm değişiklikler otomatik olarak senkronize edilir.' 
                : 'Değişiklikleriniz cihazınıza kaydedildi. Bağlantı kurulduğunda otomatik senkronize edilecek.'}
            </p>
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className="p-4 lg:p-6 border-red-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white">Tehlikeli Alan</h3>
              <p className="text-xs lg:text-sm text-white/50">Hesap verilerini sıfırla</p>
            </div>
          </div>

          {showResetConfirm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                Bu işlem tüm işlemlerinizi, portföyünüzü, bütçelerinizi ve hedeflerinizi kalıcı olarak silecektir. Emin misiniz?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all text-sm"
                >
                  İptal Et
                </button>
                <button
                  onClick={handleResetData}
                  disabled={isResetting}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  {isResetting ? 'Sıfırlanıyor...' : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Evet, Sıfırla
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Tüm Verileri Sıfırla
            </button>
          )}
        </GlassCard>

        {/* Log Out */}
        <GlassCard className="p-4 lg:p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
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
              <span className="text-white">3.0.0 - Offline First</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Veritabanı</span>
              <span className="text-emerald-400">Turso + IndexedDB</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">PWA</span>
              <span className="text-emerald-400">Aktif (Offline Destekli)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Cache Stratejisi</span>
              <span className="text-cyan-400">Offline-First</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-white/60">Sync Engine</span>
              <span className="text-cyan-400">Queue-Based</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
