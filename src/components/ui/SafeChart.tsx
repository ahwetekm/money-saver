import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useChartReady } from '../../lib/hooks';
import { AlertTriangle } from 'lucide-react';

class ChartErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Chart Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
          <AlertTriangle className="w-6 h-6 mb-2 text-slate-400" />
          <span className="text-xs text-center">Grafik yüklenemedi</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export function SafeChart({ 
  children, 
  height = 200,
  className = ''
}: { 
  children: React.ReactNode; 
  height?: number;
  className?: string;
}) {
  const { isReady, ref } = useChartReady();

  return (
    <div 
      ref={ref} 
      style={{ 
        width: '100%', 
        height,
        /* 120Hz: Chart container'ı izole render scope
           - contain: layout style paint → chart reflow'u parent'ı etkilemez
           - content-visibility: auto → off-screen chart'lar render'ı atlar
           - contain-intrinsic-size → layout shift önleme
        */
        contain: 'layout style paint',
        contentVisibility: 'auto',
        containIntrinsicSize: `auto ${height}px`,
      }} 
      className={`relative ${className}`}
    >
      {isReady ? (
        <ChartErrorBoundary>
          {children}
        </ChartErrorBoundary>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/30">
          <div className="w-8 h-8 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
