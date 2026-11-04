import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Plus, SendHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sampleAssessments, formatINR, formatDate } from '../../data/sampleAssessments';
import { Panel, InkPanel, Label, PageTitle, SampleTag, VerdictBadge, btn } from '../../components/app/ui';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const activeCase = sampleAssessments[0];

const parts = [
  { label: 'Screen', status: 'Damaged', bad: true },
  { label: 'Battery', status: 'Healthy · 89%' },
  { label: 'Charging port', status: 'Working' },
  { label: 'Cameras', status: 'Working' },
];

const steps = [
  { label: 'Device added', done: true },
  { label: 'Photo checked', done: true },
  { label: 'Quote reviewed', current: true, to: '/analysis' },
  { label: 'Decision', todo: true },
];

const prompts = ['Will a third-party screen void my warranty?', 'Is ₹6,500 fair for an S23 screen?', 'Repair now or wait?'];

/** Dotted-leader row, like a printed receipt. */
const ReceiptRow = ({ label, value, strong = false }) => (
  <div className="flex items-baseline gap-2">
    <span className={strong ? 'text-[#141414]' : 'text-[#6B6760]'}>{label}</span>
    <span className="mb-1 flex-1 border-b border-dotted border-[#CFC8BA]" />
    <span className={`tabular-nums ${strong ? 'rounded bg-[#0d5b46] px-1.5 font-medium text-white' : 'text-[#141414]'}`}>{value}</span>
  </div>
);

export const Overview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const firstName = (user?.name || '').split(' ')[0];

  const ask = (text) => {
    const q = (text ?? prompt).trim();
    if (q) navigate('/assistant', { state: { prompt: q } });
  };

  const decided = sampleAssessments.filter((a) => a.status === 'Complete');
  const repaired = decided.filter((a) => a.verdict === 'REPAIR');
  const kept = repaired.reduce((s, a) => s + (a.replaceCost - a.repairCost), 0);
  const keep = activeCase.replaceCost - activeCase.repairCost;

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · ${greeting()}${firstName ? `, ${firstName}` : ''}`}
        title={
          <>
            Your <em className="italic">Galaxy S23</em> is worth repairing.
          </>
        }
        intro="Here's where your current case stands. One step left: check the shop's quote, then decide."
        actions={
          <>
            <Link to="/analysis" className={btn.primary}>
              Continue case <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/device" className={btn.secondary}>
              <Plus className="h-4 w-4" /> New case
            </Link>
          </>
        }
      />

      {/* ── Case ticket ── */}
      <Panel className="relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3DED3] px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Label className="text-[#141414]">Case #{activeCase.id.toUpperCase()}</Label>
            <span className="font-mono text-[11px] text-[#9A958B]">opened {formatDate(activeCase.date)}</span>
            <SampleTag />
          </div>
          <Link to="/history" className={btn.ghost}>
            All cases <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto_1.2fr_auto_1fr]">
          {/* Score */}
          <div className="p-6 sm:p-8">
            <Label>Repair score</Label>
            <div className="mt-3 flex items-end gap-2">
              <span className="font-display text-[6.5rem] leading-[0.8] tracking-tight">{activeCase.score}</span>
              <span className="pb-1 font-mono text-sm text-[#9A958B]">/100</span>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <VerdictBadge verdict={activeCase.verdict} />
              <span className="text-sm text-[#6B6760]">recommended</span>
            </div>
            {/* threshold strip */}
            <div className="relative mt-6">
              <div className="flex h-1.5 overflow-hidden rounded-full">
                <span className="w-[40%] bg-[#FF6B4A]/40" />
                <span className="w-[20%] bg-[#F5B83D]/60" />
                <span className="w-[40%] bg-[#0d5b46]" />
              </div>
              <span className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 bg-[#141414]" style={{ left: `${activeCase.score}%` }} />
              <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[#9A958B]">
                <span>Replace</span>
                <span>Either</span>
                <span>Repair</span>
              </div>
            </div>
          </div>

          {/* perforation */}
          <div aria-hidden="true" className="relative hidden w-px border-l border-dashed border-[#CFC8BA] lg:block">
            <span className="absolute -top-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border border-[#E3DED3] bg-[#F4F1EA]" />
            <span className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border border-[#E3DED3] bg-[#F4F1EA]" />
          </div>

          {/* Receipt */}
          <div className="border-t border-dashed border-[#CFC8BA] p-6 sm:p-8 lg:border-t-0">
            <Label>The numbers</Label>
            <div className="mt-4 space-y-3 text-[15px]">
              <ReceiptRow label="Repair quote" value={formatINR(activeCase.repairCost)} />
              <ReceiptRow label="New phone" value={formatINR(activeCase.replaceCost)} />
              <ReceiptRow label="Repair costs" value={`${Math.round((activeCase.repairCost / activeCase.replaceCost) * 100)}% of new`} />
              <div className="pt-2">
                <ReceiptRow label="You keep" value={formatINR(keep)} strong />
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[#6B6760]">
              Only the glass is damaged and the phone is two years old, so a repair gives you the most for your money.
            </p>
          </div>

          <div aria-hidden="true" className="relative hidden w-px border-l border-dashed border-[#CFC8BA] lg:block">
            <span className="absolute -top-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border border-[#E3DED3] bg-[#F4F1EA]" />
            <span className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border border-[#E3DED3] bg-[#F4F1EA]" />
          </div>

          {/* Parts */}
          <div className="border-t border-dashed border-[#CFC8BA] p-6 sm:p-8 lg:border-t-0">
            <Label>Parts check · {activeCase.device}</Label>
            <ul className="mt-4 divide-y divide-[#E3DED3]">
              {parts.map((p) => (
                <li key={p.label} className="flex items-center justify-between py-2.5 text-[15px]">
                  <span className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${p.bad ? 'bg-[#FF6B4A]' : 'bg-[#141414]/25'}`} />
                    {p.label}
                  </span>
                  <span className={`font-mono text-xs uppercase tracking-wider ${p.bad ? 'text-[#B23A1E]' : 'text-[#9A958B]'}`}>{p.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Progress */}
        <div className="border-t border-[#E3DED3] px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.label}>
                <div className={`h-1.5 rounded-full ${s.done ? 'bg-[#141414]' : s.current ? 'bg-[#0d5b46]' : 'bg-[#E3DED3]'}`} />
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <p className={`text-sm ${s.todo ? 'text-[#9A958B]' : 'text-[#141414]'}`}>
                    <span className="mr-1.5 font-mono text-[11px] text-[#9A958B]">0{i + 1}</span>
                    {s.label}
                  </p>
                  {s.current && (
                    <Link to={s.to} className="font-mono text-[11px] uppercase tracking-wider text-[#0d5b46] hover:underline">
                      Do this →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* ── Lower grid ── */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Cases */}
        <Panel>
          <div className="flex items-center justify-between border-b border-[#E3DED3] px-6 py-4">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl">Your cases</h2>
              <SampleTag />
            </div>
            <Link to="/history" className={btn.ghost}>
              History <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-[#E3DED3]">
            {sampleAssessments.map((a) => (
              <li key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3.5 sm:grid-cols-[1fr_auto_auto]">
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-[#141414]">{a.device}</p>
                  <p className="truncate text-xs text-[#9A958B]">
                    {a.issue} · {formatDate(a.date)}
                  </p>
                </div>
                <VerdictBadge verdict={a.verdict} className="hidden sm:inline-flex" />
                <span className="w-12 text-right font-display text-3xl leading-none">{a.score}</span>
              </li>
            ))}
          </ul>
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
            <div className="flex items-center justify-between">
              <Label>Your impact</Label>
              <SampleTag />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div>
                <p className="font-display text-5xl leading-none">
                  {repaired.length}
                  <span className="text-2xl text-[#9A958B]">/{decided.length}</span>
                </p>
                <p className="mt-2 text-sm text-[#6B6760]">phones repaired instead of replaced</p>
              </div>
              <div>
                <p className="font-display text-5xl leading-none">₹{Math.round(kept / 1000)}k</p>
                <p className="mt-2 text-sm text-[#6B6760]">kept by choosing repair ({formatINR(kept)})</p>
              </div>
            </div>
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
