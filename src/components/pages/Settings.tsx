import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Info, LogOut, User, Lock, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { GlassCard, GlassInput, NeonButton } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { removeToken, updateUser } from '../../lib/offlineApi';

export function Settings() {
  const { settings, updateSettings, resetData } = useFinansStore();
  
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
              <span className="text-white">2.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Veritabanı</span>
              <span className="text-emerald-400">Turso (Cloud)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">PWA</span>
              <span className="text-emerald-400">Aktif</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
