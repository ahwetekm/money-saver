import { motion } from 'framer-motion';
import { Moon, Sun, Info, LogOut } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { PageHeader } from '../layout/MobileLayout';
import { useFinansStore } from '../../store/useFinansStore';
import { removeToken } from '../../lib/api';

export function Settings() {
  const { settings, updateSettings } = useFinansStore();

  const handleLogout = () => {
    removeToken();
    window.location.href = '/login';
  };

  return (
    <div>
      <PageHeader 
        title="Ayarlar" 
        subtitle="Uygulama tercihlerinizi yönetin"
      />

      <div className="space-y-4">
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

        {/* Account Management */}
        <GlassCard className="p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white">Hesap</h3>
              <p className="text-xs lg:text-sm text-white/50">Oturum yönetimi</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-sm font-medium"
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
