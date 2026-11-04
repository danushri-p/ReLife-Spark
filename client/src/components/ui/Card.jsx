import React from 'react';

export const Card = ({ children, className = '', hover = true, ...props }) => {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-studio-900/85 backdrop-blur-xl p-6 shadow-xl shadow-black/40 ${
        hover ? 'transition-all duration-200 hover:border-cyan-500/30 hover:shadow-cyan-500/5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, icon: Icon, badge, action, iconColor = 'text-cyan-400 bg-studio-950 border-cyan-500/30' }) => {
  return (
    <div className="flex items-start justify-between mb-5 gap-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-base tracking-tight font-mono">{title}</h3>
            {badge && (
              <span className="studio-pill px-2 py-0.5 rounded bg-studio-950 text-cyan-400 border border-cyan-500/30">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default Card;
