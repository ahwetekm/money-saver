import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  gradient?: string;
}

export function GlassCard({ children, className = '', onClick, hover = true, gradient }: GlassCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative overflow-hidden rounded-2xl bg-slate-900 border border-white/5 shadow-premium ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        background: gradient ? undefined : '#0e1524',
        backgroundImage: gradient || undefined,
        willChange: hover ? 'transform' : 'auto',
      }}
    >
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export function GlowText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block font-bold tracking-tight text-white ${className}`}>
      {children}
    </span>
  );
}

export function GradientText({ children, className = '', from = '#00c2ff', to = '#8b5cf6' }: { 
  children: ReactNode; 
  className?: string;
  from?: string;
  to?: string;
}) {
  return (
    <span 
      className={`bg-clip-text text-transparent font-semibold ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {children}
    </span>
  );
}

const neonButtonVariants: Record<string, string> = {
  primary: 'bg-[#00c2ff] hover:bg-[#33ceff] text-slate-950 font-semibold shadow-premium',
  secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium',
  danger: 'bg-rose-500 hover:bg-rose-600 text-white font-medium',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white font-medium',
};

export function NeonButton({ 
  children, 
  onClick, 
  variant = 'primary',
  className = '',
  disabled = false,
}: { 
  children: ReactNode; 
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={`
        relative px-5 py-2.5 rounded-xl text-sm
        flex items-center justify-center gap-2
        transition-colors duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-[#00c2ff]/30
        ${neonButtonVariants[variant]}
        ${className}
      `}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}

export function GlassInput({ 
  value, 
  onChange, 
  placeholder = '', 
  type = 'text',
  className = '',
  ...props
}: { 
  value: string | number; 
  onChange: (value: string) => void; 
  placeholder?: string;
  type?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full px-4 py-2.5 rounded-xl text-sm
        bg-white/5 border border-white/5
        text-white placeholder-white/30
        focus:outline-none focus:border-[#00c2ff]/40 focus:bg-white/10 focus:ring-1 focus:ring-[#00c2ff]/40
        transition-all duration-150
        ${className}
      `}
      {...props}
    />
  );
}

export function GlassSelect({ 
  value, 
  onChange, 
  options = [],
  className = '',
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        w-full px-4 py-2.5 rounded-xl text-sm
        bg-white/5 border border-white/5
        text-white
        focus:outline-none focus:border-[#00c2ff]/40 focus:ring-1 focus:ring-[#00c2ff]/40
        transition-all duration-150
        cursor-pointer
        [&>option]:bg-slate-900 [&>option]:text-white
        ${className}
      `}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

const badgeVariants: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/15',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
  info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/15',
};

export function Badge({ children, variant = 'info', className = '' }: { 
  children: ReactNode; 
  variant?: 'success' | 'danger' | 'warning' | 'info';
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeVariants[variant]} ${className}`}>
      {children}
    </span>
  );
}

const progressColors: Record<string, string> = {
  cyan: '#00c2ff',
  purple: '#a855f7',
  red: '#ef4444',
  amber: '#f59e0b',
  emerald: '#22c55e',
  blue: '#3b82f6',
  pink: '#ec4899',
  green: '#22c55e',
};

export function ProgressBar({ value, max, className = '', color = 'cyan' }: { 
  value: number; 
  max: number; 
  className?: string;
  color?: string;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const isWarning = percent >= 80;
  const isDanger = percent >= 100;

  const barColor = isDanger 
    ? progressColors.red 
    : isWarning 
      ? progressColors.amber 
      : (progressColors[color] || progressColors.cyan);

  return (
    <div className={`relative h-1.5 rounded-full bg-white/5 overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          backgroundColor: barColor,
        }}
      />
    </div>
  );
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        className="w-6 h-6 border-2 border-[#00c2ff] border-t-transparent rounded-full"
      />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
        <Icon className="w-6 h-6 text-white/40" />
      </div>
      <h3 className="text-base font-semibold text-white/80 mb-1">{title}</h3>
      <p className="text-sm text-white/40 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}
