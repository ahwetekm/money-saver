/**
 * Network Monitor - Online/Offline Detection & Sync Trigger
 * 
 * Ağ durumunu izler ve online olunduğunda sync tetikler.
 */

export type NetworkStatus = 'online' | 'offline' | 'syncing';

type NetworkListener = (status: NetworkStatus) => void;

class NetworkMonitor {
  private status: NetworkStatus = 'online';
  private listeners: Set<NetworkListener> = new Set();
  private syncCallback: (() => Promise<void>) | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Set initial status
    this.status = navigator.onLine ? 'online' : 'offline';

    // Listen for network changes
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Periodic connectivity check (every 30s)
    setInterval(() => this.checkConnectivity(), 30000);
  }

  private handleOnline = () => {
    if (this.status !== 'online') {
      this.setStatus('online');
      // Trigger sync when coming back online
      if (this.syncCallback) {
        setTimeout(() => this.triggerSync(), 1000);
      }
    }
  };

  private handleOffline = () => {
    this.setStatus('offline');
  };

  private async checkConnectivity() {
    if (!navigator.onLine) {
      if (this.status !== 'offline') {
        this.setStatus('offline');
      }
      return;
    }

    // Try a lightweight fetch to verify actual connectivity
    try {
      await fetch('/api/settings', {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (this.status === 'offline') {
        this.setStatus('online');
        if (this.syncCallback) {
          setTimeout(() => this.triggerSync(), 1000);
        }
      }
    } catch {
      // Network might be flaky, don't change status if browser says online
    }
  }

  private setStatus(newStatus: NetworkStatus) {
    this.status = newStatus;
    this.listeners.forEach(listener => listener(newStatus));
  }

  private async triggerSync() {
    if (this.syncCallback && this.status === 'online') {
      this.setStatus('syncing');
      try {
        await this.syncCallback();
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        this.setStatus('online');
      }
    }
  }

  // Public API
  getStatus(): NetworkStatus {
    return this.status;
  }

  isOnline(): boolean {
    return this.status === 'online' || this.status === 'syncing';
  }

  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setSyncCallback(callback: () => Promise<void>) {
    this.syncCallback = callback;
  }

  // Force set syncing state
  setSyncing() {
    this.setStatus('syncing');
  }

  setOnline() {
    this.setStatus('online');
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
    this.initialized = false;
  }
}

// Singleton
export const networkMonitor = new NetworkMonitor();
