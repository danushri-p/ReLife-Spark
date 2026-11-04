import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CircleAlert,
  CircleCheck,
  FlaskConical,
  Info,
  Leaf,
  LoaderCircle,
  Plus,
  Recycle,
  Scale,
  ScanLine,
  Smartphone,
  Wallet,
} from 'lucide-react';
import healthService from '../services/healthService';
import { sampleAssessments, verdictStyles, formatINR, formatDate } from '../data/sampleAssessments';

/* ───────── helpers ───────── */

const SampleTag = ({ dark = false }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
      dark ? 'border border-white/15 text-white/60' : 'border border-slate-200 bg-slate-50 text-slate-500'
    }`}
  >
    <FlaskConical className="h-3 w-3" /> Sample
  </span>
);

const Card = ({ className = '', children }) => (
  <section className={`min-w-0 rounded-[28px] border border-slate-200/70 bg-white ${className}`}>{children}</section>
);

/** Rough CO₂e avoided per phone kept in use instead of replaced (same figure the platform stats use). */
const CO2E_KG_PER_PHONE = 48;

/* ───────── platform stats (sample) ───────── */

const platformStats = {
  decisions: '1,284',
  decisionsTrend: '+18% from last month',
  avgScore: '64.2',
  repairShare: 68,
  co2eTons: '61.6',
  savings: '$342,800',
  avgSavings: '$267',
};

const nextSteps = [
  {
    title: 'Add a device',
    description: 'Tell us the brand, model, age, warranty and what is wrong with it.',
    link: '/device',
    linkText: 'Start an assessment',
    icon: Smartphone,
  },
  {
    title: 'Check the damage and quote',
    description: 'Upload a photo of the damage and your repair quote to see if the price is fair.',
    link: '/analysis',
    linkText: 'Open repair analysis',
    icon: ScanLine,
  },
  {
    title: 'Ask a repair question',
    description: 'Get plain answers based on manufacturer repair guides and warranty terms.',
    link: '/assistant',
    linkText: 'Ask the assistant',
    icon: BookOpen,
  },
];

/* ───────── page ───────── */

export const Dashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await healthService.getHealth();
        setHealthData(data);
      } catch (err) {
        setHealthData(null);
      } finally {
        setLoadingHealth(false);
      }
    };
    fetchHealth();
  }, []);

  /* Personal impact, derived from the sample assessments */
  const decided = sampleAssessments.filter((a) => a.status === 'Complete');
  const repaired = decided.filter((a) => a.verdict === 'REPAIR');
  const kept = repaired.reduce((s, a) => s + (a.replaceCost - a.repairCost), 0);
  const co2eKg = repaired.length * CO2E_KG_PER_PHONE;
  const ringPct = decided.length ? repaired.length / decided.length : 0;
  const ringLen = 2 * Math.PI * 52;
  const costMax = Math.max(...sampleAssessments.map((a) => a.replaceCost));

  const online = !loadingHealth && healthData;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Intro */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h2 className="text-[1.9rem] font-medium tracking-tight text-[#16201d]">Your repair impact</h2>
          <p className="mt-1 text-sm text-slate-500">
            What choosing repair over a new phone saves &mdash; for your wallet and for the planet.
          </p>
        </div>
        <Link
          to="/device"
          className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-full bg-[#16201d] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0d5b46] sm:self-auto"
        >
          <Plus className="h-4 w-4" /> New assessment
        </Link>
      </div>

      {/* ── Hero stats ── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Phones kept (dark) */}
        <section className="relative min-w-0 overflow-hidden rounded-[28px] bg-[#0d2f27] p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#2feaa8]/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[13px] uppercase tracking-[0.16em] text-[#7fffd4]">
                <Recycle className="h-4 w-4" /> Kept in use
              </span>
              <SampleTag dark />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <svg viewBox="0 0 120 120" className="h-20 w-20 flex-shrink-0 -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#2feaa8"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${ringLen * ringPct} ${ringLen}`}
                />
              </svg>
              <div className="min-w-0">
                <p className="text-4xl font-medium tabular-nums">
                  {repaired.length}
                  <span className="text-lg text-white/50"> / {decided.length}</span>
                </p>
                <p className="text-sm text-white/60">of your phones repaired, not replaced</p>
              </div>
            </div>
          </div>
        </section>

        {/* Money kept */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[13px] uppercase tracking-[0.16em] text-slate-500">
              <Wallet className="h-4 w-4" /> Money kept
            </span>
            <SampleTag />
          </div>
          <p className="mt-5 text-3xl font-medium tabular-nums text-[#16201d] sm:text-4xl">{formatINR(kept)}</p>
          <p className="mt-1 text-sm text-slate-500">compared with buying new phones</p>
        </Card>

        {/* CO2e */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[13px] uppercase tracking-[0.16em] text-slate-500">
              <Leaf className="h-4 w-4" /> CO₂e avoided
            </span>
            <SampleTag />
          </div>
          <p className="mt-5 text-3xl font-medium tabular-nums text-[#16201d] sm:text-4xl">
            ~{co2eKg} <span className="text-lg text-slate-400">kg</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">estimate, about {CO2E_KG_PER_PHONE} kg per phone</p>
        </Card>

        {/* Score */}
        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[13px] uppercase tracking-[0.16em] text-slate-500">
              <Scale className="h-4 w-4" /> Decisions
            </span>
            <SampleTag />
          </div>
          <p className="mt-5 text-3xl font-medium tabular-nums text-[#16201d] sm:text-4xl">{sampleAssessments.length}</p>
          <p className="mt-1 text-sm text-slate-500">
            devices checked, {sampleAssessments.length - decided.length} still waiting on a quote
          </p>
        </Card>
      </div>

      {/* ── Breakdowns ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Repair vs replace bars */}
        <Card className="p-6 sm:p-7 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-slate-900">Repair cost vs. a new phone</h3>
              <SampleTag />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0d5b46]" /> Repair
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#cfe7dd]" /> New phone
              </span>
            </div>
          </div>
          <ul className="mt-6 space-y-5">
            {sampleAssessments.map((a) => (
              <li key={a.id} className="min-w-0">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-slate-700">{a.device}</span>
                  <span className="flex-shrink-0 text-xs tabular-nums text-slate-500">
                    {formatINR(a.repairCost)} <span className="text-slate-400">vs {formatINR(a.replaceCost)}</span>
                  </span>
                </div>
                <div className="relative mt-2 h-2.5 rounded-full bg-slate-100">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-[#cfe7dd]"
                    style={{ width: `${(a.replaceCost / costMax) * 100}%` }}
                  />
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-[#0d5b46]"
                    style={{ width: `${Math.max(1.5, (a.repairCost / costMax) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Repair is {Math.round((a.repairCost / a.replaceCost) * 100)}% of the price of a new phone
                </p>
              </li>
            ))}
          </ul>
        </Card>

        {/* Platform-wide */}
        <Card className="flex flex-col p-6 sm:p-7">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-medium text-slate-900">Across ReLife-Spark</h3>
            <SampleTag />
          </div>
          <p className="mt-1 text-xs text-slate-500">Illustrative totals for everyone using the app</p>
          <dl className="mt-5 divide-y divide-slate-100">
            <div className="flex items-baseline justify-between gap-3 py-3">
              <dt className="text-sm text-slate-600">Decisions made</dt>
              <dd className="text-right">
                <span className="text-xl font-medium tabular-nums text-[#16201d]">{platformStats.decisions}</span>
                <span className="block text-xs text-[#0d5b46]">{platformStats.decisionsTrend}</span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-3">
              <dt className="text-sm text-slate-600">Average Repair Score</dt>
              <dd className="text-xl font-medium tabular-nums text-[#16201d]">
                {platformStats.avgScore}
                <span className="text-sm text-slate-400"> / 100</span>
              </dd>
            </div>
            <div className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-slate-600">Told to repair</dt>
                <dd className="text-xl font-medium tabular-nums text-[#16201d]">{platformStats.repairShare}%</dd>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#eef6f2]">
                <span className="block h-full rounded-full bg-[#0d5b46]" style={{ width: `${platformStats.repairShare}%` }} />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-3">
              <dt className="text-sm text-slate-600">CO₂e avoided (est.)</dt>
              <dd className="text-xl font-medium tabular-nums text-[#16201d]">
                ~{platformStats.co2eTons}
                <span className="text-sm text-slate-400"> tonnes</span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-3">
              <dt className="text-sm text-slate-600">Money saved</dt>
              <dd className="text-right">
                <span className="text-xl font-medium tabular-nums text-[#16201d]">{platformStats.savings}</span>
                <span className="block text-xs text-slate-500">about {platformStats.avgSavings} per person</span>
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* ── Recent decisions ── */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 sm:px-7">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-slate-900">Recent decisions</h3>
            <SampleTag />
          </div>
          <Link to="/history" className="inline-flex items-center gap-1 text-sm font-medium text-[#0d4a3e] hover:underline">
            All history <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {sampleAssessments.map((a) => {
            const saved = a.replaceCost - a.repairCost;
            return (
              <li key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 sm:px-7 md:grid-cols-[2fr_1fr_1fr_auto]">
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
                <span className="hidden text-sm text-slate-500 md:block">
                  Score <span className="font-medium tabular-nums text-slate-900">{a.score}</span>
                </span>
                <span className="hidden text-sm tabular-nums text-slate-600 md:block">
                  {a.verdict === 'REPAIR' ? (
                    <>
                      <span className="font-medium text-[#0d4a3e]">{formatINR(saved)}</span> kept
                    </>
                  ) : (
                    <span className="text-slate-400">&mdash;</span>
                  )}
                </span>
                <span className={`justify-self-end rounded-full px-2.5 py-1 text-[11px] font-medium ${verdictStyles[a.verdict]}`}>{a.verdict}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* ── Next steps ── */}
      <div className="grid gap-6 md:grid-cols-3">
        {nextSteps.map(({ title, description, link, linkText, icon: Icon }) => (
          <Card key={title} className="flex flex-col p-6 sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef6f2] text-[#0d5b46]">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-medium text-slate-900">{title}</h3>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{description}</p>
            <Link to={link} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#0d4a3e] hover:underline">
              {linkText} <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        ))}
      </div>

      {/* ── Methodology ── */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Info className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-medium text-slate-900">How we work these out</h3>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">
                <li>
                  Money kept is the price of a new phone minus the repair quote, counted only when the recommendation was to repair.
                </li>
                <li>
                  CO₂e is a rough estimate of about {CO2E_KG_PER_PHONE} kg for each phone kept in use instead of replaced. The real figure
                  depends on the model and how it was made.
                </li>
                <li className="text-amber-800">
                  The numbers on this page are sample data for now. Your own figures will appear here once your assessments are saved.
                </li>
              </ul>
            </div>
          </div>

          <span
            className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              loadingHealth ? 'bg-slate-100 text-slate-500' : online ? 'bg-[#e3f1ec] text-[#0d5b46]' : 'bg-amber-100 text-amber-800'
            }`}
            title={online && healthData.timestamp ? `Last checked ${new Date(healthData.timestamp).toLocaleTimeString()}` : undefined}
          >
            {loadingHealth ? (
              <>
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Checking service…
              </>
            ) : online ? (
              <>
                <CircleCheck className="h-3.5 w-3.5" /> Service online
              </>
            ) : (
              <>
                <CircleAlert className="h-3.5 w-3.5" /> Service unreachable
              </>
            )}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
