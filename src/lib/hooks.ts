import { useState, useEffect, useRef, RefObject } from 'react';

// Hook to safely render charts only when container has dimensions
export function useChartReady(containerRef?: RefObject<HTMLElement | null>, minWidth = 50, minHeight = 50) {
  const [isReady, setIsReady] = useState(false);
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = containerRef || internalRef;

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      // Fallback: set ready after a short delay
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }

    const checkDimensions = () => {
      const { offsetWidth, offsetHeight } = element;
      if (offsetWidth >= minWidth && offsetHeight >= minHeight) {
        setIsReady(true);
      }
    };

    // Check immediately
    checkDimensions();

    // Check after a short delay for late layout
    const timer = setTimeout(checkDimensions, 50);

    // Observe resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width >= minWidth && height >= minHeight) {
          setIsReady(true);
        }
      }
    });

    resizeObserver.observe(element);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [minWidth, minHeight, ref]);

  return { isReady, ref: ref as RefObject<HTMLDivElement> };
}

// Hook for window size
export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Hook for mobile detection
export function useIsMobile(breakpoint = 1024) {
  const { width } = useWindowSize();
  return width < breakpoint;
}

// Hook for debounced value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Hook for local storage
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

// Hook for online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
