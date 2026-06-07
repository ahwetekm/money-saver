export const initErrorLogger = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && typeof event.reason.message === 'string' && 
        (event.reason.message.includes('WebSocket') || event.reason.message.includes('gun'))) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (event.message && (
        event.message.includes('ResizeObserver') || 
        event.message.includes('WebSocket') ||
        event.message.includes('gun')
    )) {
      event.preventDefault();
    }
  });
};