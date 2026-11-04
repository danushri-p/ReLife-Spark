import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Plus, FlaskConical, SearchX } from 'lucide-react';
import { sampleAssessments, verdictStyles, formatINR, formatDate } from '../../data/sampleAssessments';

const filters = ['All', 'REPAIR', 'EITHER', 'REPLACE'];

export const History = () => {
  const [filter, setFilter] = useState('All');
  const rows = filter === 'All' ? sampleAssessments : sampleAssessments.filter((a) => a.verdict === filter);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-900">Assessment history</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            Every device you&rsquo;ve checked, with its Repair Score and recommendation.
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
              <FlaskConical className="h-3 w-3" /> Sample
            </span>
          </p>
        </div>

        <div role="tablist" aria-label="Filter by recommendation" className="flex gap-1 rounded-full border border-slate-200 bg-white p-1">
          {filters.map((f) => (
            <button
              key={f}
              role="tab"
              type="button"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === f ? 'bg-[#0d5b46] text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
        {/* Column headings (desktop) */}
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_0.8fr] gap-4 border-b border-slate-100 px-6 py-3.5 text-[11px] uppercase tracking-wider text-slate-400 md:grid">
          <span>Device</span>
          <span>Repair quote</span>
          <span>Replacement</span>
          <span>Recommendation</span>
          <span className="text-right">Score</span>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-slate-500">
            <SearchX className="h-6 w-6" />
            No assessments with this recommendation yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((a) => (
              <li key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 md:grid-cols-[2fr_1fr_1fr_1fr_0.8fr]">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#F3F4F2] text-slate-500">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-slate-900">{a.device}</p>
                    <p className="truncate text-sm text-slate-500">
                      {a.issue} · {formatDate(a.date)}
                      {a.status !== 'Complete' && <span className="ml-1.5 text-amber-700">· {a.status}</span>}
                    </p>
                  </div>
                </div>
                <span className="hidden text-sm tabular-nums text-slate-700 md:block">{formatINR(a.repairCost)}</span>
                <span className="hidden text-sm tabular-nums text-slate-700 md:block">{formatINR(a.replaceCost)}</span>
                <span className="hidden md:block">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${verdictStyles[a.verdict]}`}>{a.verdict}</span>
                </span>
                <span className="text-right text-2xl font-medium tabular-nums text-slate-900">{a.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to="/device"
        className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#0d5b46]/40 px-5 py-3 text-sm font-medium text-[#0d4a3e] transition hover:bg-white"
      >
        <Plus className="h-4 w-4" /> Assess another device
      </Link>
    </div>
  );
};

export default History;
