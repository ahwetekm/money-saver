import { useState, useCallback, useEffect } from 'react';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  VALIDATION = 'VALIDATION',
  SYNC = 'SYNC',
  CHART = 'CHART',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',      // Minor issues, can continue
  MEDIUM = 'MEDIUM', // Feature degraded but app works
  HIGH = 'HIGH',    // Major feature broken
  CRITICAL = 'CRITICAL', // App unusable
}

interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  timestamp: number;
  recoverable: boolean;
  actions?: ErrorAction[];
}

interface ErrorAction {
  label: string;
  handler: () => void;
}

class ErrorManager {
  private errors: AppError[] = [];
  private listeners: Set<(errors: AppError[]) => void> = new Set();
  private maxErrors = 50;

  private notify(): void {
    this.listeners.forEach(listener => listener([...this.errors]));
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add a new error
  report(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    options?: {
      details?: string;
      recoverable?: boolean;
      actions?: ErrorAction[];
    }
  ): string {
    const error: AppError = {
      id: this.generateId(),
      type,
      severity,
      message,
      details: options?.details,
      timestamp: Date.now(),
      recoverable: options?.recoverable ?? true,
      actions: options?.actions,
    };

    this.errors.unshift(error);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    this.notify();
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${type}] ${message}`, options?.details || '');
    }

    return error.id;
  }

  // Clear an error
  dismiss(errorId: string): void {
    this.errors = this.errors.filter(e => e.id !== errorId);
    this.notify();
  }

  // Clear all errors
  clearAll(): void {
    this.errors = [];
    this.notify();
  }

  // Get all errors
  getErrors(): AppError[] {
    return [...this.errors];
  }

  // Get errors by severity
  getBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.filter(e => e.severity === severity);
  }

  // Get errors by type
  getByType(type: ErrorType): AppError[] {
    return this.errors.filter(e => e.type === type);
  }

  // Subscribe to error changes
  subscribe(callback: (errors: AppError[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Check if there are critical errors
  hasCriticalErrors(): boolean {
    return this.errors.some(e => e.severity === ErrorSeverity.CRITICAL);
  }

  // Get error count
  getCount(): number {
    return this.errors.length;
  }
}

// Singleton instance
export const errorManager = new ErrorManager();

// React hook for error management
export function useErrors() {
  const [errors, setErrors] = useState<AppError[]>(errorManager.getErrors());

  const refresh = useCallback(() => {
    setErrors(errorManager.getErrors());
  }, []);

  const dismiss = useCallback((id: string) => {
    errorManager.dismiss(id);
    refresh();
  }, [refresh]);

  const clearAll = useCallback(() => {
    errorManager.clearAll();
    refresh();
  }, [refresh]);

  const report = useCallback((
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    options?: Parameters<typeof errorManager.report>[3]
  ) => {
    return errorManager.report(type, severity, message, options);
  }, []);

  useEffect(() => {
    return errorManager.subscribe(setErrors);
  }, []);

  return {
    errors,
    dismiss,
    clearAll,
    report,
    hasErrors: errors.length > 0,
    hasCritical: errorManager.hasCriticalErrors(),
  };
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorManager.report(
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      'Beklenmeyen bir hata oluştu',
      {
        details: event.reason?.message || String(event.reason),
        recoverable: true,
      }
    );
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    // Ignore script loading errors from third parties
    if (event.filename?.includes('rrweb') || event.filename?.includes('cdn')) {
      return;
    }

    errorManager.report(
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      'Uygulama hatası',
      {
        details: event.message,
        recoverable: true,
      }
    );
  });
}

// Helper functions for common error scenarios
export const ErrorHelpers = {
  networkError: (message: string = 'Ağ bağlantısı hatası') => {
    return errorManager.report(
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM,
      message,
      {
        recoverable: true,
        actions: [
          { label: 'Tekrar Dene', handler: () => window.location.reload() },
        ],
      }
    );
  },

  storageError: (message: string = 'Veri kaydetme hatası') => {
    return errorManager.report(
      ErrorType.STORAGE,
      ErrorSeverity.HIGH,
      message,
      { recoverable: false }
    );
  },

  validationError: (message: string) => {
    return errorManager.report(
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      message,
      { recoverable: true }
    );
  },

  chartError: (details?: string) => {
    return errorManager.report(
      ErrorType.CHART,
      ErrorSeverity.LOW,
      'Grafik yükleme hatası',
      { details, recoverable: true }
    );
  },
};
