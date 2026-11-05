import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, SearchX, LoaderCircle, TriangleAlert, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import assessmentService, { CURRENT_CASE_KEY } from '../../services/assessmentService';
import { verdictStyles, formatINR, formatDate, deviceName, shortIssue, caseProgress, caseRef } from '../../utils/format';
import { DeviceIcon } from '../../data/deviceTypes';

const filters = [
  { key: 'All', label: 'All' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'REPAIR', label: 'Repair' },
  { key: 'EITHER', label: 'Either' },
  { key: 'REPLACE', label: 'Replace' },
];

const matches = (a, filter) => {
  if (filter === 'All') return true;
  if (filter === 'IN_PROGRESS') return a.status !== 'COMPLETE';
  return a.status === 'COMPLETE' && a.verdict === filter;
};

/** The user's cases. `embedded` renders it as a section inside another page (the profile). */
export const History = ({ embedded = false }) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [data, setData] = useState({ loading: true, error: '', cases: [] });
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let cancelled = false;
    assessmentService
      .list(user?.id)
      .then((res) => !cancelled && setData({ loading: false, error: '', cases: res.assessments || [] }))
      .catch((err) => !cancelled && setData({ loading: false, error: err?.message || 'Could not load your history.', cases: [] }));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const remove = async (a) => {
    if (!window.confirm(`Delete case #${caseRef(a._id)} (${deviceName(a)})? This can't be undone.`)) return;
    setDeleting(a._id);
    try {
      await assessmentService.remove(a._id);
      if (sessionStorage.getItem(CURRENT_CASE_KEY) === a._id) sessionStorage.removeItem(CURRENT_CASE_KEY);
      setData((d) => ({ ...d, cases: d.cases.filter((c) => c._id !== a._id) }));
    } catch (err) {
      setData((d) => ({ ...d, error: err?.message || 'Could not delete the case.' }));
    } finally {
      setDeleting(null);
    }
  };

  const rows = data.cases.filter((a) => matches(a, filter));

  return (
    <section id="history" className={`scroll-mt-24 space-y-6 ${embedded ? '' : 'mx-auto max-w-[1200px]'}`}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          {embedded ? (
            <h3 className="text-xl font-medium tracking-tight text-slate-900">Assessment history</h3>
          ) : (
            <h2 className="text-2xl font-medium tracking-tight text-slate-900">Assessment history</h2>
          )}
          <p className="mt-1 text-sm text-slate-500">Every device you&rsquo;ve checked, with its Repair Score and recommendation.</p>
        </div>

        <div role="tablist" aria-label="Filter by recommendation" className="flex flex-wrap gap-1 rounded-full border border-slate-200 bg-white p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              role="tab"
              type="button"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === f.key ? 'bg-[#0d5b46] text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {data.error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {data.error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_0.6fr_40px] gap-4 border-b border-slate-100 px-6 py-3.5 text-[11px] uppercase tracking-wider text-slate-400 md:grid">
          <span>Device</span>
          <span>Repair quote</span>
          <span>Replacement</span>
          <span>Recommendation</span>
          <span className="text-right">Score</span>
          <span />
        </div>

        {data.loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#0d5b46]" /> Loading your cases…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-slate-500">
            <SearchX className="h-6 w-6" />
            {data.cases.length ? 'No cases match this filter.' : 'You haven’t checked any devices yet.'}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((a) => {
              const done = a.status === 'COMPLETE';
              const repair = a.quote?.total || a.repairCost;
              const replace = a.replacementCost || a.estimate?.newPhonePrice;
              return (
                <li key={a._id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-4 md:grid-cols-[2fr_1fr_1fr_1fr_0.6fr_40px]">
                  <Link to={`/analysis?id=${a._id}`} className="group flex min-w-0 items-center gap-4">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#F3F4F2] text-slate-500">
                      <DeviceIcon type={a.deviceType} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-[15px] font-medium text-slate-900 group-hover:text-[#0d5b46] group-hover:underline">{deviceName(a)}</span>
                        <span className="flex-shrink-0 font-mono text-[11px] tracking-wider text-slate-400">#{caseRef(a._id)}</span>
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {shortIssue(a.problemDescription)} · {formatDate(a.createdAt)}
                        {!done && <span className="ml-1.5 text-amber-700">· {caseProgress(a).label}</span>}
                      </p>
                    </div>
                  </Link>
                  <span className="hidden text-sm tabular-nums text-slate-700 md:block">{repair ? formatINR(repair) : '—'}</span>
                  <span className="hidden text-sm tabular-nums text-slate-700 md:block">{replace ? formatINR(replace) : '—'}</span>
                  <span className="hidden md:block">
                    {done ? (
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${verdictStyles[a.verdict]}`}>{a.verdict}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Not decided</span>
                    )}
                  </span>
                  <span className="text-right text-2xl font-medium tabular-nums text-slate-900">{done ? a.score : '—'}</span>
                  <button
                    type="button"
                    onClick={() => remove(a)}
                    disabled={deleting === a._id}
                    aria-label={`Delete case #${caseRef(a._id)} for ${deviceName(a)}`}
                    className="justify-self-end rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleting === a._id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link
        to="/device"
        className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#0d5b46]/40 px-5 py-3 text-sm font-medium text-[#0d4a3e] transition hover:bg-white"
      >
        <Plus className="h-4 w-4" /> Assess another device
      </Link>
    </section>
  );
};

export default History;
