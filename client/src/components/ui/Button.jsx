import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-mono font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-studio-950';

  const variants = {
    primary: 'bg-gradient-to-r from-cyan-400 to-cobalt-500 hover:from-cyan-300 hover:to-cobalt-400 text-slate-950 shadow-lg shadow-cyan-500/20 font-bold focus:ring-cyan-400',
    ai: 'bg-gradient-to-r from-violet-600 to-cobalt-500 hover:from-violet-500 hover:to-cobalt-400 text-white shadow-lg shadow-violet-500/20 font-bold focus:ring-violet-400',
    secondary: 'bg-studio-800 text-white hover:bg-studio-700 border border-white/10 focus:ring-slate-500 shadow-sm',
    outline: 'border border-white/10 bg-studio-900/90 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-studio-800/80 focus:ring-cyan-500',
    ghost: 'text-slate-400 hover:text-white hover:bg-studio-800/60 focus:ring-slate-600',
    danger: 'bg-coral-600 text-white hover:bg-coral-500 shadow-lg shadow-coral-600/20 focus:ring-coral-500',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2.5 gap-2',
    lg: 'text-sm sm:text-base px-6 py-3.5 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
