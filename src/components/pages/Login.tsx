import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, LogIn, UserPlus, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { setToken, getToken } from '../../lib/api';
import { useFinansStore } from '../../store/useFinansStore';
import { GlassCard, NeonButton, GlassInput, GlowText } from '../ui/GlassCard';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const initialize = useFinansStore((state) => state.initialize);
  const isOnline = useFinansStore((state) => state.isOnline);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // If offline, check if we have a cached token
    if (!navigator.onLine) {
      const cachedToken = getToken();
      if (cachedToken) {
        // User has a cached token, allow offline access
        await initialize();
        navigate('/');
        setLoading(false);
        return;
      } else {
        setError('Çevrimdışısınız ve kayıtlı oturum bulunamadı. Lütfen internete bağlanın.');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setToken(data.token);
      await initialize();
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/20 transform -rotate-6">
            <Wallet className="w-10 h-10 text-white transform rotate-6" />
          </div>
        </motion.div>
        
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-center text-3xl font-extrabold"
        >
          <GlowText>Money Saver</GlowText>
        </motion.h2>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-2 text-center text-sm text-white/60"
        >
          {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni bir hesap oluşturun'}
        </motion.p>
      </div>

      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <GlassCard className="py-8 px-4 sm:px-10" hover={false}>
          {/* Offline Notice */}
          {!navigator.onLine && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
            >
              <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-400">
                {getToken() 
                  ? 'Çevrimdışısınız. Kayıtlı verilerinizle devam edebilirsiniz.' 
                  : 'Çevrimdışısınız. Giriş yapmak için internet bağlantısı gerekli.'}
              </p>
            </motion.div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                E-posta Adresi
              </label>
              <GlassInput
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="ornek@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
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
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 py-3 rounded-xl"
              >
                {error}
              </motion.div>
            )}

            <div>
              <NeonButton
                disabled={loading}
                className="w-full flex justify-center items-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="w-5 h-5" />
                    Giriş Yap
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Kayıt Ol
                  </>
                )}
              </NeonButton>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900/50 backdrop-blur-xl text-white/50 rounded-full border border-white/5">
                  {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                type="button"
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500/50 focus:ring-offset-slate-900"
              >
                {isLogin ? 'Yeni Hesap Oluştur' : 'Giriş Yap'}
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
