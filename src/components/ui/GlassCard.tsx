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
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        background: gradient || 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
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

export function GradientText({ children, className = '', from = 'cyan', to = 'purple' }: { 
  children: ReactNode; 
  className?: string;
  from?: string;
  to?: string;
}) {
  return (
    <span 
      className={`bg-gradient-to-r from-${from}-400 to-${to}-400 bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
      }}
    >
      {children}
    </span>
  );
}

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
  const variants = {
    primary: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25',
    secondary: 'from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 shadow-purple-500/25',
    danger: 'from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-red-500/25',
    success: 'from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-emerald-500/25',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 
        bg-gradient-to-r ${variants[variant]} shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

export function GlassInput({ 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  className = '',
}: { 
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white 
        placeholder-white/40 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 
        transition-all duration-300 ${className}`}
    />
  );
}

export function GlassSelect({ 
  value, 
  onChange, 
  options, 
  placeholder,
  className = '',
}: { 
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white 
        focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 
        transition-all duration-300 appearance-none cursor-pointer ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '20px',
      }}
    >
      {placeholder && <option value="" className="bg-slate-900">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-slate-900">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function Badge({ children, variant = 'default', className = '' }: { 
  children: ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) {
  const variants = {
    default: 'bg-white/10 text-white/80',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, max, className = '', color = 'cyan' }: { 
  value: number; 
  max: number; 
  className?: string;
  color?: string;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const isWarning = percent >= 80;
  const isDanger = percent >= 100;

  return (
    <div className={`relative h-2 rounded-full bg-white/10 overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`absolute inset-y-0 left-0 rounded-full ${
          isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : `bg-${color}-500`
        }`}
        style={{
          boxShadow: `0 0 20px ${isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#06b6d4'}50`,
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
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
