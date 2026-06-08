import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff, Check } from 'lucide-react';
import { useFinansStore } from '../../store/useFinansStore';
import { useState } from 'react';

export function OfflineBanner() {
  const isOnline = useFinansStore((s) => s.isOnline);
  const syncStatus = useFinansStore((s) => s.syncStatus);
  const pendingSyncCount = useFinansStore((s) => s.pendingSyncCount);
  const syncNow = useFinansStore((s) => s.syncNow);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleSync = async () => {
    await syncNow();
  };

  // Don't show when online and no pending syncs
  if (isOnline && pendingSyncCount === 0 && syncStatus !== 'syncing') {
    return null;
  }

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-[100] px-3 py-2 ${
            !isOnline
              ? 'bg-amber-500/95'
              : syncStatus === 'syncing'
                ? 'bg-blue-500/95'
                : pendingSyncCount > 0
                  ? 'bg-orange-500/95'
                  : 'bg-emerald-500/95'
          } backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              {!isOnline ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Çevrimdışı - Değişiklikler kaydedildi</span>
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Senkronize ediliyor...</span>
                </>
              ) : pendingSyncCount > 0 ? (
                <>
                  <CloudOff className="w-4 h-4" />
                  <span>{pendingSyncCount} değişiklik bekliyor</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Senkronize edildi</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {pendingSyncCount > 0 && isOnline && (
                <button
                  onClick={handleSync}
                  className="text-white/90 hover:text-white text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                >
                  Senkronize Et
                </button>
              )}
              <button
                onClick={() => setIsDismissed(true)}
                className="text-white/70 hover:text-white p-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact sync indicator for the bottom nav or header
export function SyncIndicator() {
  const isOnline = useFinansStore((s) => s.isOnline);
  const syncStatus = useFinansStore((s) => s.syncStatus);
  const pendingSyncCount = useFinansStore((s) => s.pendingSyncCount);

  if (isOnline && pendingSyncCount === 0 && syncStatus !== 'syncing') {
    return (
      <div className="flex items-center gap-1.5">
        <Cloud className="w-3.5 h-3.5 text-emerald-400" />
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5" title="Çevrimdışı">
        <CloudOff className="w-3.5 h-3.5 text-amber-400" />
        {pendingSyncCount > 0 && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded-full">
            {pendingSyncCount}
          </span>
        )}
      </div>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1.5" title="Senkronize ediliyor">
        <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (pendingSyncCount > 0) {
    return (
      <div className="flex items-center gap-1.5" title={`${pendingSyncCount} değişiklik bekliyor`}>
        <CloudOff className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-[10px] font-bold text-orange-400 bg-orange-400/20 px-1.5 py-0.5 rounded-full">
          {pendingSyncCount}
        </span>
      </div>
    );
  }

  return null;
}
