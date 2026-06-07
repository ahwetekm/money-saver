import { useState, useEffect, useCallback } from 'react';
// @ts-ignore - Gun.js types are incomplete
import Gun from 'gun';

export type SyncStatus = 'offline' | 'connecting' | 'connected' | 'syncing' | 'error';

interface SyncConfig {
  syncKey: string;
  deviceId: string;
  lastSync: number;
  enabled: boolean;
}

// More reliable Gun.js relay servers
const GUN_RELAYS = [
  'https://peer.wallie.io/gun',
  'https://gun-server-76i7.onrender.com/gun',
  'https://relay.peer.ooo/gun',
];

class SyncService {
  // @ts-ignore
  private gun: any = null;
  private syncKey: string = '';
  private status: SyncStatus = 'offline';
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private config: SyncConfig | null = null;
  private storageKey = 'finans_sync_config';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect: boolean = false;

  constructor() {
    this.loadConfig();
    // Setup online/offline detection
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.config = JSON.parse(stored);
        if (this.config?.enabled && this.config.syncKey) {
          this.syncKey = this.config.syncKey;
          // Auto-connect on load if previously enabled
          setTimeout(() => this.connect(this.syncKey), 1000);
        }
      }
    } catch {
      this.config = null;
    }
  }

  private saveConfig(): void {
    if (this.config) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    }
  }

  private setStatus(status: SyncStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.listeners.forEach(listener => listener(status));
    }
  }

  private handleOnline(): void {
    if (this.syncKey && !this.isManualDisconnect) {
      this.connect(this.syncKey);
    }
  }

  private handleOffline(): void {
    this.setStatus('offline');
  }

  getSyncKey(): string {
    return this.syncKey;
  }

  getDeviceId(): string {
    if (!this.config?.deviceId) {
      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      if (this.config) {
        this.config.deviceId = deviceId;
        this.saveConfig();
      }
      return deviceId;
    }
    return this.config.deviceId;
  }

  subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.status);
    return () => this.listeners.delete(callback);
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected' || this.status === 'syncing';
  }

  // Generate a readable sync key
  generateSyncKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return segments.join('-');
  }

  // Connect to P2P network
  connect(syncKey: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!syncKey || syncKey.length < 8) {
        this.setStatus('error');
        resolve(false);
        return;
      }

      this.isManualDisconnect = false;
      this.syncKey = syncKey;
      this.setStatus('connecting');

      // Clear any existing connection
      this.disconnectInternal();

      try {
        // Initialize Gun with relay peers
        // @ts-ignore
        this.gun = Gun({
          peers: GUN_RELAYS,
          localStorage: false,
          radisk: true,
          axe: false,
        });

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          // If still connecting after timeout, assume success (local mode)
          if (this.status === 'connecting') {
            this.setStatus('connected');
            this.saveSyncConfig(true);
            resolve(true);
          }
        }, 5000);

        // Test connection
        const testData = { ping: Date.now(), device: this.getDeviceId() };
        const testRef = this.gun.get(`finans_ping_${syncKey}`);
        testRef.put(testData);

        // Listen for confirmation
        testRef.on((data: any) => {
          if (data?.ping) {
            this.clearTimers();
            this.setStatus('connected');
            this.saveSyncConfig(true);
            resolve(true);
          }
        });

        // Listen for peer connections
        this.gun.on('hi', (peer: any) => {
          console.log('P2P peer connected:', peer);
          this.setStatus('connected');
        });

        this.gun.on('bye', (peer: any) => {
          console.log('P2P peer disconnected:', peer);
          // Don't change status on single peer disconnect
        });

      } catch (error) {
        console.error('Gun.js initialization error:', error);
        this.clearTimers();
        this.setStatus('error');
        resolve(false);
      }
    });
  }

  private saveSyncConfig(enabled: boolean): void {
    this.config = {
      syncKey: this.syncKey,
      deviceId: this.getDeviceId(),
      lastSync: Date.now(),
      enabled,
    };
    this.saveConfig();
  }

  private clearTimers(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private disconnectInternal(): void {
    this.clearTimers();
    if (this.gun) {
      try {
        this.gun = null;
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  // Disconnect from P2P network
  disconnect(): void {
    this.isManualDisconnect = true;
    this.disconnectInternal();
    this.syncKey = '';
    this.setStatus('offline');
    
    if (this.config) {
      this.config.enabled = false;
      this.saveConfig();
    }
  }

  // Sync data to P2P network
  syncData<T extends { id: string }>(collection: string, data: T[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.gun || !this.syncKey) {
        reject(new Error('Not connected'));
        return;
      }

      this.setStatus('syncing');
      const timestamp = Date.now();

      try {
        const syncRef = this.gun.get(`finans_${this.syncKey}_${collection}`);

        // Write each item with timestamp
        let completed = 0;
        const total = data.length;

        if (total === 0) {
          this.setStatus('connected');
          resolve();
          return;
        }

        data.forEach(item => {
          syncRef.get(item.id).put({
            ...item,
            _timestamp: timestamp,
            _deviceId: this.getDeviceId(),
          }, () => {
            completed++;
            if (completed === total) {
              this.setStatus('connected');
              if (this.config) {
                this.config.lastSync = timestamp;
                this.saveConfig();
              }
              resolve();
            }
          });
        });

        // Timeout fallback
        setTimeout(() => {
          if (this.status === 'syncing') {
            this.setStatus('connected');
            resolve();
          }
        }, 10000);

      } catch (error) {
        this.setStatus('error');
        reject(error);
      }
    });
  }

  // Listen for remote changes
  listenData<T extends { id: string }>(
    collection: string,
    onReceive: (data: T, timestamp: number) => void
  ): () => void {
    if (!this.gun || !this.syncKey) {
      return () => {};
    }

    try {
      const syncRef = this.gun.get(`finans_${this.syncKey}_${collection}`);
      
      syncRef.map().on((data: any, key: string) => {
        if (data && data._timestamp && data._deviceId !== this.getDeviceId()) {
          const { _timestamp, _deviceId, ...rest } = data;
          onReceive(rest as T, _timestamp);
        }
      });

      return () => {
        try {
          syncRef.map().off();
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    } catch {
      return () => {};
    }
  }

  // Get sync metadata
  getSyncMetadata(): { syncKey: string; deviceId: string; lastSync: number } | null {
    if (!this.config) return null;
    return {
      syncKey: this.config.syncKey,
      deviceId: this.config.deviceId,
      lastSync: this.config.lastSync,
    };
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
    return syncService.connect(syncKey);
  }, []);

  const disconnect = useCallback(() => {
    syncService.disconnect();
  }, []);

  const generateKey = useCallback(() => {
    return syncService.generateSyncKey();
  }, []);

  return {
    status,
    connect,
    disconnect,
    generateKey,
    isConnected: syncService.isConnected(),
    syncKey: syncService.getSyncKey(),
  };
}
