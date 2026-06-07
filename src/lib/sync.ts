import { useState, useEffect, useCallback } from 'react';
// @ts-ignore - Gun.js types are incomplete
import Gun from 'gun';

// Reliable public Gun.js relay servers
const GUN_RELAYS = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://gun-us.herokuapp.com/gun',
  'https://gun-eu.herokuapp.com/gun',
];

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';

interface GunMessage {
  [key: string]: any;
  _timestamp?: number;
}

class SyncService {
  // @ts-ignore
  private gun: any = null;
  private syncKey: string = '';
  private status: SyncStatus = 'disconnected';
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  connect(syncKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!syncKey || syncKey.trim().length < 8) {
        reject(new Error('Sync key must be at least 8 characters'));
        return;
      }

      this.disconnect();
      this.syncKey = syncKey;
      this.setStatus('connecting');

      try {
        // Initialize Gun with multiple relay peers for redundancy
        // @ts-ignore
        this.gun = Gun({
          peers: GUN_RELAYS,
          localStorage: false, // We use IndexedDB directly
          radisk: true,
          axe: false, // Disable axe for better stability
        });

        // Test connection with timeout
        const timeout = setTimeout(() => {
          this.setStatus('connected'); // Assume connected after timeout
          this.reconnectAttempts = 0;
          resolve();
        }, 3000);

        // Listen for connection events
        this.gun.on('hi', () => {
          clearTimeout(timeout);
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.gun.on('bye', () => {
          if (this.status === 'connected') {
            this.setStatus('disconnected');
            this.scheduleReconnect();
          }
        });

      } catch (error) {
        this.setStatus('error');
        this.scheduleReconnect();
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.gun = null;
    this.syncKey = '';
    this.setStatus('disconnected');
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('error');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      if (this.syncKey) {
        this.connect(this.syncKey).catch(() => {});
      }
    }, delay);
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.listeners.forEach(listener => listener(status));
  }

  subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.status);
    return () => this.listeners.delete(callback);
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  // Sync data with timestamp-based conflict resolution
  syncData<T extends { id: string }>(collection: string, data: T[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.gun || !this.syncKey) {
        reject(new Error('Not connected'));
        return;
      }

      this.setStatus('syncing');
      const timestamp = Date.now();
      
      try {
        const syncRef = this.gun.get(`${this.syncKey}/${collection}`);

        // Write data with timestamp
        data.forEach(item => {
          syncRef.get(item.id).put({
            ...item,
            _timestamp: timestamp,
          });
        });

        setTimeout(() => {
          this.setStatus('connected');
          resolve();
        }, 500);
      } catch (error) {
        this.setStatus('error');
        reject(error);
      }
    });
  }

  // Listen for remote changes with conflict resolution
  listenData<T extends { id: string }>(
    collection: string,
    onReceive: (data: T, timestamp: number) => void
  ): () => void {
    if (!this.gun || !this.syncKey) {
      return () => {};
    }

    try {
      const syncRef = this.gun.get(`${this.syncKey}/${collection}`);
      
      syncRef.map().on((data: GunMessage | undefined, key: string) => {
        if (data && data._timestamp) {
          const { _timestamp, ...rest } = data;
          onReceive(rest as T, _timestamp);
        }
      });

      return () => {
        syncRef.map().off();
      };
    } catch {
      return () => {};
    }
  }

  // Get current sync key
  getSyncKey(): string {
    return this.syncKey;
  }

  isConnected(): boolean {
    return this.status === 'connected' || this.status === 'syncing';
  }
}

// Singleton instance
export const syncService = new SyncService();

// React hook for sync status
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    return syncService.subscribe(setStatus);
  }, []);

  return status;
}

// React hook for sync operations
export function useSync() {
  const status = useSyncStatus();

  const connect = useCallback(async (syncKey: string) => {
    try {
      await syncService.connect(syncKey);
      return true;
    } catch (error) {
      console.error('Sync connection failed:', error);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    syncService.disconnect();
  }, []);

  return {
    status,
    connect,
    disconnect,
    isConnected: syncService.isConnected(),
  };
}
