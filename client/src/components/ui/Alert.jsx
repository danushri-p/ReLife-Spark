import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const Alert = ({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const types = {
    info: {
      bg: 'bg-studio-950/90 border-cyan-500/40 text-cyan-200',
      icon: Info,
      iconColor: 'text-cyan-400',
    },
    success: {
      bg: 'bg-studio-950/90 border-cobalt-500/40 text-cobalt-200',
      icon: CheckCircle2,
      iconColor: 'text-cyan-400',
    },
    warning: {
      bg: 'bg-studio-950/90 border-amber-500/40 text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    error: {
      bg: 'bg-studio-950/90 border-coral-500/40 text-coral-200',
      icon: AlertCircle,
      iconColor: 'text-coral-400',
    },
    ai: {
      bg: 'bg-studio-950/90 border-violet-500/40 text-violet-200',
      icon: Info,
      iconColor: 'text-violet-400',
    }
  };

  const current = types[type] || types.info;
  const Icon = current.icon;

  return (
    <div
      className={`rounded-2xl border p-4 flex items-start gap-3 text-sm backdrop-blur-xl shadow-lg ${current.bg} ${className}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1">
        {title && <h4 className="font-mono font-bold mb-1 text-white">{title}</h4>}
        <div className="text-slate-300 leading-relaxed text-xs sm:text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
