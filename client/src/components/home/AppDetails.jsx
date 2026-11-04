import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Smartphone,
  ScanLine,
  FileText,
  Gauge,
  BookOpenText,
  Leaf,
  Check,
  Info,
  Recycle,
  Cloud,
  IndianRupee,
} from 'lucide-react';

/* ── Content (mirrors the README's functional requirements) ── */

const features = [
  {
    id: 'device',
    icon: Smartphone,
    title: 'Device profile',
    tagline: 'Context for every answer',
    summary:
      'Start by telling ReLife-Spark about your phone. Every diagnosis, quote check and recommendation that follows is tailored to this profile.',
    provide: ['Brand and model', 'Device age and overall condition', 'Warranty status', 'A short description of the problem'],
    get: ['A saved device context reused across every tool', 'Validated inputs, so the maths later on is reliable'],
    tech: ['React form', 'Express Validator', 'MongoDB Atlas'],
    sample: { label: 'Profile', value: 'Galaxy S23 · 2 yrs · Out of warranty' },
    cta: { label: 'Add my device', to: '/device' },
  },
  {
    id: 'photo',
    icon: ScanLine,
    title: 'Photo diagnosis',
    tagline: 'See what the damage really is',
    summary:
      'Upload a photo of the damaged phone. Gemini inspects visible damage and describes the likely issues and how serious they appear.',
    provide: ['One clear image of the damage (JPG or PNG)'],
    get: ['Possible issues, in plain language', 'An estimated severity level', 'What a technician should check in person'],
    tech: ['Gemini 1.5 Flash (vision)', 'Multer uploads'],
    sample: { label: 'Sample finding', value: 'Front glass cracked · Severity: moderate' },
    cta: { label: 'Upload a photo', to: '/analysis' },
  },
  {
    id: 'quote',
    icon: FileText,
    title: 'Quote analysis',
    tagline: 'Is this price fair?',
    summary:
      'Upload the quotation you received. ReLife-Spark extracts each line item and compares it with reference repair prices for your model.',
    provide: ['Repair quotation as a PDF or image'],
    get: [
      'Parts, labour charges and total, extracted automatically',
      'Comparison against reference prices',
      'Questions worth asking your technician',
    ],
    tech: ['Gemini extraction', 'Reference price data', 'PDF & image support'],
    sample: { label: 'Sample check', value: 'Screen ₹6,500 · within reference range' },
    cta: { label: 'Check a quote', to: '/analysis' },
  },
  {
    id: 'score',
    icon: Gauge,
    title: 'Repair Score',
    tagline: 'One number, one clear recommendation',
    summary:
      'A transparent, weighted score from 0 to 100 that weighs repair cost against replacement and the state of your device, then recommends a path.',
    provide: ['Repair cost (from your quote)', 'Replacement price you are considering'],
    get: ['A Repair Score out of 100', 'REPAIR, EITHER or REPLACE', 'A plain-language explanation of why'],
    tech: ['Deterministic JavaScript formula', 'Gemini for explanations only'],
    sample: { label: 'Sample result', value: 'Score 68 · REPAIR' },
    cta: { label: 'Get my score', to: '/analysis' },
  },
  {
    id: 'knowledge',
    icon: BookOpenText,
    title: 'Knowledge assistant',
    tagline: 'Answers you can trace',
    summary:
      'Ask repair or warranty questions. Answers are grounded in repair manuals, warranty policies and repair guides, with the sources shown.',
    provide: ['Any question about your repair, parts or warranty'],
    get: ['A clear answer', 'References to the documents it came from'],
    tech: ['Gemini text-embedding-004', 'MongoDB Atlas Vector Search', 'RAG'],
    sample: { label: 'Sample source', value: 'Cited: OEM warranty policy, §4.2' },
    cta: { label: 'Ask a question', to: '/assistant' },
  },
  {
    id: 'impact',
    icon: Leaf,
    title: 'Environmental impact',
    tagline: 'The cost to the planet, too',
    summary:
      'See what repairing instead of replacing could mean beyond your wallet: e-waste avoided, carbon impact and the money you keep.',
    provide: ['Nothing extra; it uses your device and quote'],
    get: ['Estimated e-waste avoided', 'Estimated CO₂e impact, where reliable data exists', 'Cost difference: repair vs replace'],
    tech: ['Impact estimates', 'Dashboard'],
    sample: { label: 'Sample saving', value: 'Repair keeps ₹48,500 in your pocket' },
    cta: { label: 'View impact', to: '/dashboard' },
  },
];

const steps = [
  { icon: Smartphone, title: 'Tell us about your device', text: 'Model, age, condition, warranty and what went wrong.' },
  { icon: ScanLine, title: 'Show the damage', text: 'Upload a photo and get likely issues with a severity estimate.' },
  { icon: FileText, title: 'Share your quote', text: 'We extract parts and labour and compare them to reference prices.' },
  { icon: Gauge, title: 'Decide with confidence', text: 'Get your Repair Score, a recommendation and the reasoning behind it.' },
];

const weights = [
  { label: 'Repair cost vs replacement cost', value: 35 },
  { label: 'Device age', value: 25 },
  { label: 'Warranty status', value: 15 },
  { label: 'Repairability', value: 15 },
  { label: 'Overall device condition', value: 10 },
];

const bands = [
  { range: '60 – 100', verdict: 'REPAIR', text: 'Repairing is the better value.', tone: 'bg-[#0d5b46] text-white' },
  { range: '40 – 59', verdict: 'EITHER', text: 'Both options are reasonable.', tone: 'bg-amber-100 text-amber-800' },
  { range: '0 – 39', verdict: 'REPLACE', text: 'Replacing makes more sense.', tone: 'bg-slate-200 text-slate-700' },
];

/* ── Small building blocks ── */

const Eyebrow = ({ children }) => (
  <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#0d4a3e]">{children}</span>
);

const SectionTitle = ({ eyebrow, title, text }) => (
  <div className="max-w-2xl space-y-3">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="text-3xl font-medium tracking-tight text-[#16201d] sm:text-4xl">{title}</h2>
    {text && <p className="text-[15px] leading-relaxed text-slate-600">{text}</p>}
  </div>
);

const ListBlock = ({ title, items }) => (
  <div>
    <h4 className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{title}</h4>
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0d5b46]" />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

/* ── Sections ── */

export const AppDetails = () => {
  const [activeId, setActiveId] = useState('device');
  const active = features.find((f) => f.id === activeId);
  const ActiveIcon = active.icon;
  const sampleScore = 68;

  return (
    <>
      {/* 1 · Feature explorer */}
      <section id="layers-detail" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24">
        <SectionTitle
          eyebrow="How ReLife-Spark thinks"
          title="Everything you need before you pay for a repair."
          text="Six tools that work together: describe your device, check the damage and the quote, then get a clear, explainable recommendation."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* Feature list */}
          <div role="tablist" aria-label="ReLife-Spark features" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {features.map(({ id, icon: Icon, title, tagline }, i) => {
              const selected = id === activeId;
              return (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => setActiveId(id)}
                  className={`group flex items-center gap-4 rounded-lg border px-4 py-3.5 text-left transition-all ${
                    selected
                      ? 'border-[#0d4a3e] bg-white shadow-sm'
                      : 'border-transparent bg-white/50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                      selected ? 'bg-[#0d5b46] text-white' : 'bg-[#eaf3f0] text-[#0d4a3e]'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-slate-900">{title}</span>
                    <span className="block truncate text-[13px] text-slate-500">{tagline}</span>
                  </span>
                  <span className="text-xs tabular-nums text-slate-400">0{i + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div role="tabpanel" className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eaf3f0] text-[#0d4a3e]">
                  <ActiveIcon className="h-6 w-6" />
                </span>
                <div>
                  <Eyebrow>Feature overview</Eyebrow>
                  <h3 className="mt-0.5 text-2xl font-medium text-slate-900">{active.title}</h3>
                </div>
              </div>
              <Link
                to={active.cta.to}
                className="inline-flex items-center gap-2 rounded-md bg-[#0d5b46] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0a4a39]"
              >
                {active.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-slate-600">{active.summary}</p>

            <div className="mt-8 grid gap-8 border-t border-slate-100 pt-8 sm:grid-cols-2">
              <ListBlock title="You provide" items={active.provide} />
              <ListBlock title="You get" items={active.get} />
            </div>

            <div className="mt-auto flex flex-col gap-5 pt-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h4 className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Under the hood</h4>
                <div className="flex flex-wrap gap-2">
                  {active.tech.map((t) => (
                    <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-[#0d4a3e]/15 bg-[#f3f8f6] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{active.sample.label}</p>
                <p className="mt-0.5 text-sm font-medium text-[#0d4a3e]">{active.sample.value}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 · How it works */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionTitle
            eyebrow="How it works"
            title="From broken screen to clear decision in four steps."
            text="Each step adds context, so the final recommendation reflects your device, not an average one."
          />

          <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
            <span aria-hidden="true" className="absolute left-5 right-5 top-5 hidden h-px bg-gradient-to-r from-[#0d4a3e]/40 via-[#0d4a3e]/20 to-transparent md:block" />
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#0d4a3e]/20 bg-white text-[#0d4a3e] shadow-sm">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <p className="mt-5 text-xs tabular-nums text-slate-400">Step 0{i + 1}</p>
                <h3 className="mt-1 text-lg font-medium text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </li>
            ))}
          </ol>

          <Link
            to="/device"
            className="mt-12 inline-flex items-center gap-2 text-[15px] font-medium text-[#0d4a3e] hover:underline"
          >
            Start with your device <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 3 · Repair Score */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle
              eyebrow="The Repair Score"
              title="Transparent maths, not a black box."
              text="Your score is calculated with a fixed, weighted formula, so the same inputs always give the same answer. Gemini explains the result; it never decides the number."
            />

            <div className="mt-10 space-y-5">
              {weights.map(({ label, value }) => (
                <div key={label}>
                  <div className="mb-2 flex items-baseline justify-between text-sm">
                    <span className="text-slate-700">{label}</span>
                    <span className="tabular-nums font-medium text-slate-900">{value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-300/60">
                    <div className="h-full rounded-full bg-[#0d5b46]" style={{ width: `${(value / 35) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <div className="flex items-center justify-between">
              <Eyebrow>Sample result</Eyebrow>
              <span className="text-xs text-slate-400">Galaxy S23 · illustrative</span>
            </div>

            <div className="mt-6 flex items-end gap-4">
              <span className="text-7xl font-medium leading-none tracking-tight text-[#16201d]">{sampleScore}</span>
              <span className="pb-2 text-lg text-slate-400">/ 100</span>
              <span className="mb-2 ml-auto rounded-full bg-[#0d5b46] px-3 py-1 text-sm font-medium text-white">REPAIR</span>
            </div>

            {/* Score track */}
            <div className="relative mt-8">
              <div className="flex h-2.5 overflow-hidden rounded-full">
                <span className="w-[40%] bg-slate-300" />
                <span className="w-[20%] bg-amber-300" />
                <span className="w-[40%] bg-[#0d5b46]" />
              </div>
              <span
                className="absolute -top-1.5 h-5 w-1 -translate-x-1/2 rounded-full bg-[#16201d] ring-2 ring-white"
                style={{ left: `${sampleScore}%` }}
              />
              <div className="relative mt-2 h-4 text-[11px] tabular-nums text-slate-400">
                <span className="absolute left-0">0</span>
                <span className="absolute left-[40%] -translate-x-1/2">40</span>
                <span className="absolute left-[60%] -translate-x-1/2">60</span>
                <span className="absolute right-0">100</span>
              </div>
            </div>

            <div className="mt-8 space-y-2.5">
              {bands.map(({ range, verdict, text, tone }) => (
                <div key={verdict} className="flex items-center gap-4 rounded-md border border-slate-100 px-4 py-3">
                  <span className={`w-[76px] rounded-full px-2.5 py-1 text-center text-[11px] font-medium ${tone}`}>{verdict}</span>
                  <span className="flex-1 text-sm text-slate-600">{text}</span>
                  <span className="text-xs tabular-nums text-slate-400">{range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4 · Impact & honesty */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <SectionTitle
          eyebrow="Our impact"
          title="Smarter for your wallet. Better for the planet."
          text="Every repairable phone that stays in use is one less device in a landfill. ReLife-Spark shows you what your choice means."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { icon: Recycle, title: 'E-waste avoided', text: 'An estimate of the device weight kept out of the waste stream when you repair.' },
            { icon: Cloud, title: 'CO₂e impact', text: 'Estimated emissions saved by not manufacturing a new phone, shown only where reliable data exists.' },
            { icon: IndianRupee, title: 'Money kept', text: 'The cost difference between your repair quote and the replacement you were considering.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#eaf3f0] text-[#0d4a3e]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-medium text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-5 text-sm leading-relaxed text-amber-900">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            <span className="font-medium">An informational tool, not a technician.</span> ReLife-Spark does not
            conclusively diagnose hardware faults, guarantee unbiased decisions, or judge a technician&rsquo;s honesty
            based on price. Use it to ask better questions and decide with more context.
          </p>
        </div>
      </section>

      {/* 5 · Closing CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 overflow-hidden rounded-2xl bg-[#0d4a3e] px-8 py-12 text-white sm:px-12 md:flex-row md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#9fe3c9]">Know before you pay</p>
            <h2 className="mt-3 max-w-xl text-3xl font-medium tracking-tight sm:text-4xl">
              Get a second opinion on your repair in minutes.
            </h2>
          </div>
          <Link
            to="/device"
            className="inline-flex flex-shrink-0 items-center gap-3 rounded-md bg-white px-6 py-4 text-[16px] font-medium text-[#0d4a3e] transition hover:bg-[#eaf3f0]"
          >
            Start Free Assessment
            <ArrowUpRight className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default AppDetails;
