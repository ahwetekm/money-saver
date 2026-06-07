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
      whileHover={hover ? { scale: 1.01, y: -1 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }}
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        background: gradient || 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        willChange: hover ? 'transform' : 'auto',
      }}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none" />
    </motion.div>
  );
}

export function GlowText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 blur-lg bg-current opacity-50">{children}</span>
    </span>
  );
}

export function GradientText({ children, className = '', from = '#06b6d4', to = '#a855f7' }: { 
  children: ReactNode; 
  className?: string;
  from?: string;
  to?: string;
}) {
  return (
    <span 
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {children}
    </span>
  );
}

const neonButtonVariants: Record<string, string> = {
  primary: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25',
  secondary: 'from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-slate-500/25',
  danger: 'from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-red-500/25',
  success: 'from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-emerald-500/25',
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
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 600, damping: 28, mass: 0.4 }}
      className={`
        relative px-6 py-3 rounded-xl font-semibold text-white
        bg-gradient-to-r ${neonButtonVariants[variant]}
        shadow-lg transition-colors duration-100
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-cyan-500/50
        ${className}
      `}
    >
      <span className="relative z-10">{children}</span>
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
        w-full px-4 py-3 rounded-xl
        bg-white/5 border border-white/10
        text-white placeholder-white/30
        focus:outline-none focus:border-cyan-500/50 focus:bg-white/10
        transition-colors duration-100
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
        w-full px-4 py-3 rounded-xl
        bg-white/5 border border-white/10
        text-white
        focus:outline-none focus:border-cyan-500/50
        transition-colors duration-100
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
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  danger: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export function Badge({ children, variant = 'info', className = '' }: { 
  children: ReactNode; 
  variant?: 'success' | 'danger' | 'warning' | 'info';
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badgeVariants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// Renk map'i - Tailwind dynamic class'lar generate edilmediği için inline style kullanıyoruz
const progressColors: Record<string, string> = {
  cyan: '#06b6d4',
  purple: '#a855f7',
  red: '#ef4444',
  amber: '#f59e0b',
  emerald: '#10b981',
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
    <div className={`relative h-2 rounded-full bg-white/10 overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          backgroundColor: barColor,
          boxShadow: `0 0 20px ${barColor}50`,
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
        className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-white/40" />
      </div>
      <h3 className="text-xl font-semibold text-white/80 mb-2">{title}</h3>
      <p className="text-white/50 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
