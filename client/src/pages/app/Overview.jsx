import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, LoaderCircle, Plus, SendHorizontal, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import assessmentService from '../../services/assessmentService';
import { formatINR, formatDate, deviceName, shortIssue, caseRef, caseProgress } from '../../utils/format';
import { Panel, InkPanel, Label, PageTitle, VerdictBadge, btn } from '../../components/app/ui';
import { deviceNoun } from '../../data/deviceTypes';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const verdictHeadline = {
  REPAIR: 'is worth repairing.',
  EITHER: 'could go either way.',
  REPLACE: 'is better replaced.',
};

/** Dotted-leader row, like a printed receipt. */
const ReceiptRow = ({ label, value, strong = false }) => (
  <div className="flex items-baseline gap-2">
    <span className={strong ? 'text-[#141414]' : 'text-[#6B6760]'}>{label}</span>
    <span className="mb-1 flex-1 border-b border-dotted border-[#CFC8BA]" />
    <span className={`tabular-nums ${strong ? 'rounded bg-[#0d5b46] px-1.5 font-medium text-white' : 'text-[#141414]'}`}>{value}</span>
  </div>
);

const Perforation = () => (
  <div aria-hidden="true" className="relative hidden w-px border-l border-dashed border-[#CFC8BA] lg:block">
    <span className="absolute -top-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border border-[#E3DED3] bg-[#F4F1EA]" />
    <span className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border border-[#E3DED3] bg-[#F4F1EA]" />
  </div>
);

export const Overview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [data, setData] = useState({ loading: true, error: '', cases: [], stats: null });
  const firstName = (user?.name || '').split(' ')[0];

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      Promise.all([assessmentService.list(user?.id, { limit: 50 }), assessmentService.stats(user?.id)])
        .then(([list, stats]) => {
          if (!cancelled) setData({ loading: false, error: '', cases: list.assessments || [], stats: stats.personal });
        })
        .catch((err) => {
          // Keep what is already on screen if a background refresh fails.
          if (!cancelled) setData((d) => ({ ...d, loading: false, error: err?.message || 'Could not load your cases.' }));
        });

    load();
    // Refresh when the user comes back to this tab, so work done elsewhere shows up.
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [user?.id]);

  const ask = (text) => {
    const q = (text ?? prompt).trim();
    if (q) navigate('/assistant', { state: { prompt: q } });
  };

  const eyebrow = `${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · ${greeting()}${
    firstName ? `, ${firstName}` : ''
  }`;

  const { cases, stats } = data;
  // The case worked on most recently (the list comes back newest-updated first).
  const active = cases[0] || null;
  const progress = active ? caseProgress(active) : null;
  const caseLink = active ? `/analysis?id=${active._id}` : '/device';

  const repairCost = active?.quote?.total || active?.repairCost || 0;
  const replaceCost = active?.replacementCost || active?.estimate?.newPhonePrice || 0;
  const keep = Math.max(0, replaceCost - repairCost);

  const parts = (active?.vision?.findings || []).slice(0, 4).map((f) => ({
    label: f.component,
    status: f.severity,
    bad: !['Intact', 'Minor'].includes(f.severity),
  }));

  const steps = active
    ? [
        { label: 'Device added', done: true },
        { label: 'Photo checked', done: progress.photo },
        { label: 'Quote reviewed', done: progress.quote },
        { label: 'Decision', done: progress.decided },
      ]
    : [];
  const currentStep = steps.findIndex((s) => !s.done);

  const prompts = active
    ? [
        repairCost ? `Is ${formatINR(repairCost)} fair for a ${active.model} repair?` : `What does a ${active.model} repair usually cost?`,
        `Will a third-party part void my ${active.brand} warranty?`,
        'Repair now or wait?',
      ]
    : ['How do I know if a repair quote is fair?', 'Original vs third-party screens?', 'When is a device not worth repairing?'];

  /* ───────── loading / error / empty ───────── */
  if (data.loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#6B6760]">
        <LoaderCircle className="h-5 w-5 animate-spin text-[#0d5b46]" /> Loading your cases…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow={eyebrow}
        title={
          !active ? (
            <>Let&rsquo;s check your first device.</>
          ) : active.status === 'COMPLETE' ? (
            <>
              Your <em className="italic">{active.model}</em> {verdictHeadline[active.verdict] || 'has a decision.'}
            </>
          ) : (
            <>
              Let&rsquo;s finish checking your <em className="italic">{active.model}</em>.
            </>
          )
        }
        intro={
          !active
            ? 'Add your device, upload a photo of the damage and the shop’s quote, and we’ll tell you whether repairing it is worth it.'
            : active.status === 'COMPLETE'
              ? active.recommendation?.action || 'Your decision is saved.'
              : `Next step: ${steps[currentStep]?.label.toLowerCase() || 'decide'}.`
        }
        actions={
          <>
            <Link to={caseLink} className={btn.primary}>
              {active ? (
                <>
                  {active.status === 'COMPLETE' ? 'Open case' : 'Continue case'} <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add your device
                </>
              )}
            </Link>
            {active && (
              <Link to="/device" className={btn.secondary}>
                <Plus className="h-4 w-4" /> New case
              </Link>
            )}
          </>
        }
      />

      {data.error && (
        <Panel className="flex items-start gap-3 border-red-200 p-5 text-sm text-red-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {data.error}
        </Panel>
      )}

      {/* ── Case ticket ── */}
      {active && (
        <Panel className="relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3DED3] px-6 py-3.5">
            <div className="flex items-center gap-3">
              <Label className="text-[#141414]">Case #{caseRef(active._id)}</Label>
              <span className="font-mono text-[11px] text-[#9A958B]">opened {formatDate(active.createdAt)}</span>
            </div>
            <Link to="/profile#history" className={btn.ghost}>
              All cases <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid lg:grid-cols-[1fr_auto_1.2fr_auto_1fr]">
            {/* Score */}
            <div className="p-6 sm:p-8">
              <Label>Repair score</Label>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-display text-[6.5rem] leading-[0.8] tracking-tight">{progress.decided ? active.score : '—'}</span>
                <span className="pb-1 font-mono text-sm text-[#9A958B]">/100</span>
              </div>
              <div className="mt-5 flex items-center gap-2">
                {progress.decided ? (
                  <>
                    <VerdictBadge verdict={active.verdict} />
                    <span className="text-sm text-[#6B6760]">recommended</span>
                  </>
                ) : (
                  <span className="text-sm text-[#6B6760]">{progress.label}</span>
                )}
              </div>
              <div className="relative mt-6">
                <div className="flex h-1.5 overflow-hidden rounded-full">
                  <span className="w-[40%] bg-[#FF6B4A]/40" />
                  <span className="w-[20%] bg-[#F5B83D]/60" />
                  <span className="w-[40%] bg-[#0d5b46]" />
                </div>
                {progress.decided && (
                  <span className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 bg-[#141414]" style={{ left: `${active.score}%` }} />
                )}
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[#9A958B]">
                  <span>Replace</span>
                  <span>Either</span>
                  <span>Repair</span>
                </div>
              </div>
            </div>

            <Perforation />

            {/* Receipt */}
            <div className="border-t border-dashed border-[#CFC8BA] p-6 sm:p-8 lg:border-t-0">
              <Label>The numbers</Label>
              <div className="mt-4 space-y-3 text-[15px]">
                <ReceiptRow label="Repair quote" value={repairCost ? formatINR(repairCost) : 'not added'} />
                <ReceiptRow label={`New ${deviceNoun(active)}`} value={replaceCost ? formatINR(replaceCost) : 'not added'} />
                {repairCost > 0 && replaceCost > 0 && (
                  <>
                    <ReceiptRow label="Repair costs" value={`${Math.round((repairCost / replaceCost) * 100)}% of new`} />
                    {/* Replacing saves nothing, so the "kept" line only makes sense when repair is on the table. */}
                    {active.verdict !== 'REPLACE' && (
                      <div className="pt-2">
                        <ReceiptRow label={active.verdict === 'REPAIR' ? 'You keep' : 'Saved if you repair'} value={formatINR(keep)} strong />
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-[#6B6760]">
                {active.status === 'COMPLETE'
                  ? active.recommendation?.summary
                  : active.vision?.aiSummary || shortIssue(active.problemDescription)}
              </p>
            </div>

            <Perforation />

            {/* Parts */}
            <div className="border-t border-dashed border-[#CFC8BA] p-6 sm:p-8 lg:border-t-0">
              <Label>Parts check · {deviceName(active)}</Label>
              {parts.length ? (
                <ul className="mt-4 divide-y divide-[#E3DED3]">
                  {parts.map((p) => (
                    <li key={p.label} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${p.bad ? 'bg-[#FF6B4A]' : 'bg-[#141414]/25'}`} />
                        <span className="truncate">{p.label}</span>
                      </span>
                      <span className={`flex-shrink-0 font-mono text-xs uppercase tracking-wider ${p.bad ? 'text-[#B23A1E]' : 'text-[#9A958B]'}`}>
                        {p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[#6B6760]">
                  No photo checked yet.{' '}
                  <Link to={caseLink} className="font-medium text-[#0d5b46] hover:underline">
                    Add one
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="border-t border-[#E3DED3] px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s.label}>
                  <div className={`h-1.5 rounded-full ${s.done ? 'bg-[#141414]' : i === currentStep ? 'bg-[#0d5b46]' : 'bg-[#E3DED3]'}`} />
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <p className={`text-sm ${!s.done && i !== currentStep ? 'text-[#9A958B]' : 'text-[#141414]'}`}>
                      <span className="mr-1.5 font-mono text-[11px] text-[#9A958B]">0{i + 1}</span>
                      {s.label}
                    </p>
                    {i === currentStep && (
                      <Link to={caseLink} className="font-mono text-[11px] uppercase tracking-wider text-[#0d5b46] hover:underline">
                        Do this →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* ── Lower grid ── */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Cases */}
        <Panel>
          <div className="flex items-center justify-between border-b border-[#E3DED3] px-6 py-4">
            <h2 className="font-display text-2xl">Your cases</h2>
            <Link to="/profile#history" className={btn.ghost}>
              History <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          {cases.length ? (
            <ul className="divide-y divide-[#E3DED3]">
              {cases.slice(0, 6).map((a) => (
                <li key={a._id}>
                  <Link
                    to={`/analysis?id=${a._id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3.5 transition hover:bg-[#F4F1EA]/60 sm:grid-cols-[1fr_auto_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-[#141414]">{deviceName(a)}</p>
                      <p className="truncate text-xs text-[#9A958B]">
                        {shortIssue(a.problemDescription)} · {formatDate(a.createdAt)}
                      </p>
                    </div>
                    {a.status === 'COMPLETE' ? (
                      <VerdictBadge verdict={a.verdict} className="hidden sm:inline-flex" />
                    ) : (
                      <span className="hidden font-mono text-[11px] uppercase tracking-wider text-amber-700 sm:inline">{caseProgress(a).label}</span>
                    )}
                    <span className="w-12 text-right font-display text-3xl leading-none">{a.status === 'COMPLETE' ? a.score : '—'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-[#6B6760]">
              No cases yet.{' '}
              <Link to="/device" className="font-medium text-[#0d5b46] hover:underline">
                Add your first device
              </Link>
            </div>
          )}
        </Panel>

        <div className="grid gap-6">
          {/* Ask */}
          <InkPanel className="p-6">
            <Label className="text-[#9fe3c9]">Ask before you pay</Label>
            <p className="mt-3 font-display text-[1.9rem] leading-[1.1]">
              Unsure about a quote or a part? <em className="italic text-[#9fe3c9]">Just ask.</em>
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask();
              }}
              className="mt-5 flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] py-1.5 pl-3.5 pr-1.5 focus-within:border-[#9fe3c9]/60"
            >
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="The shop says I need a new display assembly…"
                aria-label="Ask the assistant"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#FFFDF8] outline-none placeholder:text-white/40"
              />
              <button type="submit" aria-label="Send" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[#0d5b46] text-white hover:bg-[#0a4a39]">
                <SendHorizontal className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => ask(p)}
                  className="rounded-md border border-white/12 px-2.5 py-1 text-xs text-white/65 transition hover:border-[#9fe3c9]/50 hover:text-[#FFFDF8]"
                >
                  {p}
                </button>
              ))}
            </div>
          </InkPanel>

          {/* Impact */}
          <Panel className="p-6">
            <Label>Your impact</Label>
            {stats?.complete ? (
              <div className="mt-4 grid grid-cols-2 gap-6">
                <div>
                  <p className="font-display text-5xl leading-none">
                    {stats.repaired}
                    <span className="text-2xl text-[#9A958B]">/{stats.complete}</span>
                  </p>
                  <p className="mt-2 text-sm text-[#6B6760]">devices repaired instead of replaced</p>
                </div>
                <div>
                  <p className="font-display text-5xl leading-none">
                    {stats.moneyKept >= 1000 ? `₹${Math.round(stats.moneyKept / 1000)}k` : formatINR(stats.moneyKept)}
                  </p>
                  <p className="mt-2 text-sm text-[#6B6760]">kept by choosing repair ({formatINR(stats.moneyKept)})</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#6B6760]">Save your first decision to see how much you keep by repairing.</p>
            )}
            <Link to="/dashboard" className={`${btn.ghost} mt-5`}>
              See full impact <ArrowRight className="h-4 w-4" />
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default Overview;
