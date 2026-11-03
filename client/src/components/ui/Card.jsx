import React from 'react';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm ${
        hover ? 'transition-all duration-200 hover:shadow-md hover:border-slate-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, icon: Icon, badge, action }) => {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
            {badge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default Card;

