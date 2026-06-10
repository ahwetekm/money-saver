import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { setToken } from '../../lib/api';
import { useFinansStore } from '../../store/useFinansStore';
import { GlassCard, NeonButton, GlassInput } from '../ui/GlassCard';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const initialize = useFinansStore((state) => state.initialize);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email,
          password,
          name: isLogin ? undefined : name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setToken(data.token);
      await initialize();
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Solid dark background */}
      <div className="absolute inset-0 z-0 bg-slate-950" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex justify-center mb-6"
        >
          <div className="w-14 h-14 bg-[#00c2ff] rounded-2xl flex items-center justify-center shadow-premium">
            <Wallet className="w-7 h-7 text-slate-950" />
          </div>
        </motion.div>
        
        <motion.h2 
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="text-2xl font-bold tracking-tight text-white"
        >
          Money Saver
        </motion.h2>
        
        <motion.p 
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-1 text-xs text-white/40 font-medium"
        >
          {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni bir hesap oluşturun'}
        </motion.p>
      </div>

      <motion.div 
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <GlassCard className="py-8 px-6 sm:px-10" hover={false}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Adınız
                </label>
                <GlassInput
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Adınız soyadınız"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                E-posta Adresi
              </label>
              <GlassInput
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="isim@adres.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Şifre
              </label>
              <GlassInput
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-rose-400 text-xs text-center bg-rose-500/10 border border-rose-500/15 py-2.5 rounded-xl font-medium"
              >
                {error}
              </motion.div>
            )}

            <div className="pt-2">
              <NeonButton
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 font-bold"
              >
                {loading ? (
                  <span className="w-4.5 h-4.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="w-4.5 h-4.5" />
                    Giriş Yap
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4.5 h-4.5" />
                    Hesap Oluştur
                  </>
                )}
              </NeonButton>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative flex justify-center text-xs">
              <span className="text-white/40">
                {isLogin ? "Henüz hesabınız yok mu?" : "Zaten üye misiniz?"}
              </span>
            </div>

            <div className="mt-3">
              <button
                onClick={() => setIsLogin(!isLogin)}
                type="button"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white/80 bg-white/5 hover:bg-white/10 border border-white/5 transition-all focus:outline-none cursor-pointer"
              >
                {isLogin ? 'Yeni Hesap Oluştur' : 'Giriş Sayfasına Dön'}
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
