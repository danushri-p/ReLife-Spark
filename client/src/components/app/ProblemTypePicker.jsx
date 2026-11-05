import React from 'react';
import { PROBLEM_TYPES } from '../../data/problemTypes';

/** "Is it hardware or software?" — used on Assess and on the Analyze damage step. */
const ProblemTypePicker = ({ value, onChange, compact = false }) => (
  <div role="radiogroup" aria-label="Kind of problem" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
    {PROBLEM_TYPES.map(({ value: v, label, hint, icon: Icon }) => {
      const selected = value === v;
      return (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onChange(v)}
          className={`flex min-w-0 items-start gap-3 rounded-2xl border text-left transition ${compact ? 'px-3 py-2.5' : 'px-4 py-3'} ${
            selected
              ? 'border-[#0d5b46]/40 bg-[#e3f1ec] text-[#0d4a3e]'
              : 'border-slate-200 bg-white text-slate-700 hover:border-[#0d5b46]/30 hover:text-[#0d4a3e]'
          }`}
        >
          <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm font-medium">{label}</span>
            {!compact && <span className="mt-0.5 block text-xs leading-snug text-slate-500">{hint}</span>}
          </span>
        </button>
      );
    })}
  </div>
);

export default ProblemTypePicker;
