import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Info, LogOut, User, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
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
      setUpdateMessage({ type: 'success', text: 'Hesap bilgileri başarıyla güncellendi.' });
      setEmail('');
      setPassword('');
      setTimeout(() => setUpdateMessage({ type: '', text: '' }), 3000);
    } catch (error: unknown) {
      setUpdateMessage({ type: 'error', text: error instanceof Error ? error.message : 'Güncelleme başarısız.' });
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
    } catch (error: unknown) {
      setUpdateMessage({ type: 'error', text: error instanceof Error ? error.message : 'Sıfırlama başarısız.' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
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
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              updateMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {updateMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <p className="text-xs font-medium">{updateMessage.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Account Details Update */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Hesap Bilgileri</h3>
              <p className="text-xs text-white/40">E-posta ve şifrenizi güncelleyin</p>
            </div>
          </div>

          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium">
                Yeni E-posta Adresi
              </label>
              <GlassInput
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Yeni e-posta adresiniz"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium">
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
              className="w-full justify-center text-xs font-semibold"
            >
              {isUpdating ? 'Güncelleniyor...' : 'Bilgileri Güncelle'}
            </NeonButton>
          </form>
        </GlassCard>

        {/* Theme Settings */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Moon className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Görünüm</h3>
              <p className="text-xs text-white/40">Arayüz renk teması</p>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                settings.theme === 'dark'
                  ? 'bg-white/5 text-[#00c2ff]'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Koyu Tema
            </button>
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                settings.theme === 'light'
                  ? 'bg-white/5 text-[#00c2ff]'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Açık Tema
            </button>
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className="p-6 border border-rose-500/15">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Sıfırlama Seçenekleri</h3>
              <p className="text-xs text-white/40">Hesap verilerini sıfırla</p>
            </div>
          </div>

          {showResetConfirm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/15 leading-relaxed">
                Bu işlem tüm bütçeleri, hedefleri, portföyünüzü ve geçmiş işlemleri kalıcı olarak silecektir. Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all text-xs"
                >
                  İptal Et
                </button>
                <button
                  onClick={handleResetData}
                  disabled={isResetting}
                  className="flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {isResetting ? 'Sıfırlanıyor...' : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Evet, Sıfırla
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-500/5 text-rose-400 border border-rose-500/15 hover:bg-rose-500/10 transition-all text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Tüm Verileri Sıfırla
            </button>
          )}
        </GlassCard>

        {/* Log Out */}
        <GlassCard className="p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 border border-white/5 transition-all text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Oturumu Kapat
          </button>
        </GlassCard>

        {/* About */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Info className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Hakkında</h3>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40">Versiyon</span>
              <span className="text-white font-medium">2.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40">Veritabanı</span>
              <span className="text-emerald-400 font-medium">Turso (Cloud)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-white/40">Çevrimdışı Desteği (PWA)</span>
              <span className="text-emerald-400 font-medium">Aktif</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
