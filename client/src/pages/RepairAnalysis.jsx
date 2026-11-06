import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  CloudUpload,
  FileText,
  ImagePlus,
  Info,
  LoaderCircle,
  MessageCircleQuestion,
  PenLine,
  Plus,
  Save,
  Scale,
  ScanLine,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { verdictStyles, formatINR, caseRef } from '../utils/format';
import assessmentService, { CURRENT_CASE_KEY } from '../services/assessmentService';
import { DEFAULT_DEVICE_TYPE, deviceNoun, getDeviceType } from '../data/deviceTypes';
import { SOFTWARE_SYMPTOMS, normalizeProblemType, wantsPhoto } from '../data/problemTypes';
import ProblemTypePicker from '../components/app/ProblemTypePicker';
import uploadService from '../services/uploadService';
import repairService from '../services/repairService';

/* ───────── quote fairness (plain code, no AI) ───────── */

const GST_RATE = 0.18;

/** Fair up to the usual high price, High up to 25% above it, Overpriced beyond that. */
const judgeLine = (amount, range) => {
  if (!amount || !range) return null;
  const [low, high] = range;
  if (amount <= high) return { level: 'fair', label: amount < low ? 'Below usual' : 'Fair' };
  if (amount <= high * 1.25) return { level: 'high', label: 'High' };
  return { level: 'over', label: 'Overpriced' };
};

const FLAG_STYLE = {
  fair: 'bg-[#e3f1ec] text-[#0d5b46]',
  high: 'bg-amber-100 text-amber-800',
  over: 'bg-red-50 text-red-700',
};
const FLAG_DOT = { fair: 'bg-[#0d5b46]', high: 'bg-amber-500', over: 'bg-red-600' };

const FlagPill = ({ flag }) =>
  flag ? (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${FLAG_STYLE[flag.level]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${FLAG_DOT[flag.level]}`} aria-hidden="true" />
      {flag.label}
    </span>
  ) : null;

/* ───────── local building blocks ───────── */

const Card = ({ className = '', children }) => (
  <section className={`min-w-0 rounded-[28px] border border-slate-200/70 bg-white ${className}`}>{children}</section>
);

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3">
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#0d5b46]">
      <Icon className="h-5 w-5" />
    </span>
    <div className="min-w-0">
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  </div>
);

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#0d5b46] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0a4a39]';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';
const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] tabular-nums text-slate-800 placeholder:text-slate-400 focus:border-[#0d5b46]/50 focus:outline-none focus:ring-2 focus:ring-[#0d5b46]/10';
const eyebrow = 'text-[13px] uppercase tracking-[0.16em] text-slate-500';

const severityStyle = (severity) => {
  if (severity.includes('Critical') || severity.includes('Destroyed')) return 'bg-red-50 text-red-800 border border-red-200';
  if (severity.includes('High') || severity.includes('Moderate')) return 'bg-amber-100 text-amber-800';
  if (severity.includes('Intact')) return 'bg-[#e3f1ec] text-[#0d5b46]';
  return 'bg-slate-100 text-slate-600';
};

/** Semicircle gauge for the Repair Score, with the 40 / 60 thresholds marked. */
const ScoreGauge = ({ score }) => {
  const len = Math.PI * 80;
  const tick = (v) => {
    const a = Math.PI * (1 - v / 100);
    return { x1: 100 + 70 * Math.cos(a), y1: 100 - 70 * Math.sin(a), x2: 100 + 92 * Math.cos(a), y2: 100 - 92 * Math.sin(a) };
  };
  return (
    <svg viewBox="0 0 200 112" className="w-full max-w-[260px]" role="img" aria-label={`Repair Score ${score} out of 100`}>
      <defs>
        <linearGradient id="analysis-gauge" x1="0" x2="1">
          <stop offset="0" stopColor="#7fd6b5" />
          <stop offset="1" stopColor="#0d5b46" />
        </linearGradient>
      </defs>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#edf1ee" strokeWidth="16" strokeLinecap="round" />
      <path
        d="M20 100 A80 80 0 0 1 180 100"
        fill="none"
        stroke="url(#analysis-gauge)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray={`${(len * score) / 100} ${len}`}
        style={{ transition: 'stroke-dasharray 400ms ease' }}
      />
      {[40, 60].map((v) => (
        <line key={v} {...tick(v)} stroke="#ffffff" strokeWidth="2.5" />
      ))}
      <text x="100" y="92" textAnchor="middle" className="fill-[#16201d]" style={{ fontSize: 40, fontWeight: 500 }}>
        {score}
      </text>
      <text x="100" y="108" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9, letterSpacing: 2 }}>
        REPAIR SCORE
      </text>
    </svg>
  );
};

const steps = [
  { key: 'vision', label: 'Check the problem', icon: ScanLine },
  { key: 'quote', label: 'Review the quote', icon: FileText },
  { key: 'decision', label: 'Get the decision', icon: Scale },
];

export const RepairAnalysis = () => {
  const [activeTab, setActiveTab] = useState('vision'); // 'vision', 'quote', 'decision'

  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('id') || sessionStorage.getItem(CURRENT_CASE_KEY);
  const [caseState, setCaseState] = useState({ loading: Boolean(caseId), error: '' });

  const [deviceInfo, setDeviceInfo] = useState({
    id: null,
    deviceType: DEFAULT_DEVICE_TYPE,
    brand: '',
    model: '',
    deviceAge: '',
    condition: '',
    warrantyStatus: '',
    problemType: 'unsure',
    problemDescription: '',
  });

  const noun = deviceNoun(deviceInfo.deviceType);

  const [savedDecision, setSavedDecision] = useState(null); // what is stored on the server
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [quoteUploadStatus, setQuoteUploadStatus] = useState(null);
  const [isUploadingQuote, setIsUploadingQuote] = useState(false);

  // --- STEP 2: QUOTE REVIEW (amounts in rupees, filled from the uploaded quote or typed in) ---
  const [quoteParts, setQuoteParts] = useState(0);
  const [quoteLabor, setQuoteLabor] = useState(0);
  const [quoteDiagnostic, setQuoteDiagnostic] = useState(0);
  const [quoteTax, setQuoteTax] = useState(0);
  const [quoteMeta, setQuoteMeta] = useState({ shopName: null, fileName: null, notes: null });

  const totalQuoteCost = quoteParts + quoteLabor + quoteDiagnostic + quoteTax;
  const quotePayload = { parts: quoteParts, labour: quoteLabor, diagnostic: quoteDiagnostic, tax: quoteTax, ...quoteMeta };

  // Market estimate for this device + fault (AI, with community averages as a fallback)
  const [estimate, setEstimate] = useState(null);
  const [estimateState, setEstimateState] = useState({ loading: false, error: '' });

  const marketBenchmarkAverage = estimate?.typicalRepairCost || null;
  const priceDifference = marketBenchmarkAverage ? totalQuoteCost - marketBenchmarkAverage : 0;
  const priceTolerance = marketBenchmarkAverage ? Math.max(500, Math.round(marketBenchmarkAverage * 0.1)) : 0;
  const isOverpriced = Boolean(marketBenchmarkAverage) && priceDifference > priceTolerance;
  const isFair = Boolean(marketBenchmarkAverage) && Math.abs(priceDifference) <= priceTolerance;

  // Each quote line against the usual price for this model and fault. GST is checked against 18% of the rest.
  const lineRanges = estimate?.lineRanges || null;
  const quoteBase = quoteParts + quoteLabor + quoteDiagnostic;
  const gstRange = quoteBase > 0 ? [0, Math.round(quoteBase * GST_RATE * 1.1) + 100] : null;
  const lineChecks = {
    parts: { flag: judgeLine(quoteParts, lineRanges?.parts), range: lineRanges?.parts },
    labour: { flag: judgeLine(quoteLabor, lineRanges?.labour), range: lineRanges?.labour },
    diagnostic: { flag: judgeLine(quoteDiagnostic, lineRanges?.diagnostic), range: lineRanges?.diagnostic },
    tax: { flag: judgeLine(quoteTax, gstRange), range: gstRange, isTax: true },
  };
  const flaggedLines = Object.values(lineChecks).filter((c) => c.flag && c.flag.level !== 'fair').length;

  // Used when no model-specific questions could be generated.
  const genericQuestions = [
    {
      q: 'Is the replacement part original (OEM) or a third-party copy?',
      reason: 'Third-party parts are cheaper but can have weaker brightness, colour, battery life or touch response.',
    },
    {
      q: 'Will any water-resistance seals or adhesive be replaced?',
      reason: 'Opening a sealed device breaks the factory seal; many shops skip replacing it.',
    },
    {
      q: 'Does the price include all parts, labour and GST?',
      reason: 'Some quotes leave out tax or small parts, so the final bill ends up higher.',
    },
    {
      q: 'How long is the warranty on the repair, and what does it cover?',
      reason: 'Reputable shops give at least 90 days on parts and labour.',
    },
  ];
  const technicianQuestions = estimate?.questions?.length ? estimate.questions : genericQuestions;

  // --- STEP 3: REPAIR SCORE (5 weighted factors) ---
  const [replacementPrice, setReplacementPrice] = useState(0);
  const [customRepairCost, setCustomRepairCost] = useState(totalQuoteCost);

  useEffect(() => {
    setCustomRepairCost(totalQuoteCost);
  }, [totalQuoteCost]);

  const costRatio = replacementPrice > 0 ? (customRepairCost / replacementPrice) * 100 : 50;
  const scoreFactorCost = Math.max(0, Math.min(100, Math.round(100 - (costRatio * 1.35))));

  const ageMap = {
    'Less than 6 months': 95,
    '6 to 12 months': 85,
    '1 to 2 years': 70,
    '2 to 3 years': 50,
    '3 to 4 years': 30,
    '4+ years': 15,
  };
  const scoreFactorAge = ageMap[deviceInfo.deviceAge] || 75;

  const warrantyMap = {
    'AppleCare+ / Care Plan': 95,
    'Under Warranty': 90,
    'Third-Party Warranty': 75,
    'Expired': 45,
    'Unknown': 40,
  };
  const scoreFactorWarranty = warrantyMap[deviceInfo.warrantyStatus] || 75;
  const scoreFactorRepairability = estimate?.repairability ?? 70;

  const conditionMap = {
    'Pristine': 95,
    'Good': 80,
    'Fair': 60,
    'Heavily Used': 40,
    'Cracked / Damaged': 30,
  };
  const scoreFactorCondition = conditionMap[deviceInfo.condition] || 80;

  const decisionScore = Math.round(
    scoreFactorCost * 0.35 +
    scoreFactorAge * 0.25 +
    scoreFactorWarranty * 0.15 +
    scoreFactorRepairability * 0.15 +
    scoreFactorCondition * 0.10
  );

  const calculatedRepairScore = decisionScore;

  // --- STEP 1: PHOTO DAMAGE CHECK ---
  const [selectedDamageImage, setSelectedDamageImage] = useState(null);
  const [selectedDamageFile, setSelectedDamageFile] = useState(null);
  const [description, setDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [visionAnalysis, setVisionAnalysis] = useState(null);
  const [visionError, setVisionError] = useState('');

  const getRecommendationData = (score) => {
    if (score >= 60) {
      return {
        badge: 'REPAIR RECOMMENDED',
        verdict: 'REPAIR',
        summary: `Repairing this ${deviceInfo.brand} ${deviceInfo.model} offers strong value. With repair estimated at ${formatINR(customRepairCost)} versus a ${formatINR(replacementPrice)} replacement, you keep ${formatINR(Math.max(0, replacementPrice - customRepairCost))} in value while avoiding avoidable waste.`,
        action: 'Proceed to authorize repair with a verified technician.',
      };
    }

    if (score >= 40) {
      return {
        badge: 'CONSIDER EITHER',
        verdict: 'EITHER',
        summary: `The decision is borderline. Repairing this ${deviceInfo.brand} ${deviceInfo.model} costs ${Math.round(costRatio)}% of the replacement price, so negotiation or a trade-in may be a better route depending on your priorities.`,
        action: 'Negotiate the quotation and compare trade-in values before committing.',
      };
    }

    return {
      badge: 'REPLACE RECOMMENDED',
      verdict: 'REPLACE',
      summary: `Replacement is financially wiser. Repairing this ${deviceInfo.brand} ${deviceInfo.model} would cost ${formatINR(customRepairCost)} against a ${formatINR(replacementPrice)} replacement, creating unnecessary depreciation risk.`,
      action: 'Explore certified refurbished replacements or official trade-in programs.',
    };
  };

  const currentRec = getRecommendationData(decisionScore);

  const financialSavings = Math.max(0, replacementPrice - customRepairCost);
  const decisionReady = totalQuoteCost > 0 && replacementPrice > 0;
  const decisionSaved =
    Boolean(savedDecision) && savedDecision.repairCost === customRepairCost && savedDecision.replacementCost === replacementPrice;

  const activeStepIndex = steps.findIndex((s) => s.key === activeTab);

  const factors = [
    { label: `Cost compared with a new ${noun}`, weight: 35, score: scoreFactorCost, note: `Repair is ${Math.round(costRatio)}% of the replacement price` },
    { label: `Age of the ${noun}`, weight: 25, score: scoreFactorAge, note: deviceInfo.deviceAge },
    { label: 'Warranty cover', weight: 15, score: scoreFactorWarranty, note: deviceInfo.warrantyStatus },
    { label: 'How easy it is to repair', weight: 15, score: scoreFactorRepairability, note: estimate?.repairability != null ? `Estimated for the ${deviceInfo.model}` : `Typical for this kind of ${noun}` },
    { label: 'Overall condition', weight: 10, score: scoreFactorCondition, note: deviceInfo.condition },
  ];

  // "Why this verdict": explained from the repair guides with sources, refreshed when the numbers settle.
  const [explanation, setExplanation] = useState({ loading: false, error: '', data: null });
  const explainSeq = useRef(0);
  useEffect(() => {
    if (activeTab !== 'decision' || !decisionReady) return undefined;
    const seq = ++explainSeq.current;
    const timer = setTimeout(() => {
      setExplanation((e) => ({ ...e, loading: true, error: '' }));
      repairService
        .explain({
          verdict: currentRec.verdict,
          score: decisionScore,
          deviceType: deviceInfo.deviceType,
          brand: deviceInfo.brand,
          model: deviceInfo.model,
          problemDescription: deviceInfo.problemDescription,
          warrantyStatus: deviceInfo.warrantyStatus,
          deviceAge: deviceInfo.deviceAge,
          condition: deviceInfo.condition,
          repairCost: customRepairCost,
          replacementCost: replacementPrice,
          factors: factors.map(({ label, weight, score, note }) => ({ label, weight, score, note })),
        })
        .then((res) => seq === explainSeq.current && setExplanation({ loading: false, error: '', data: res }))
        .catch((err) => seq === explainSeq.current && setExplanation({ loading: false, error: err?.message || 'Could not load the explanation.', data: null }));
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, decisionReady, currentRec.verdict, decisionScore, customRepairCost, replacementPrice, deviceInfo.id]);

  /** Saves part of the case; failures are shown but don't block the flow. */
  const saveProgress = (patch) => {
    if (!deviceInfo.id) return Promise.resolve();
    return assessmentService.update(deviceInfo.id, patch).catch((err) => setSaveError(err?.message || 'Could not save your progress.'));
  };

  const fetchEstimate = (device, findings) => {
    const id = device._id || device.id;
    setEstimateState({ loading: true, error: '' });
    repairService
      .estimate({ deviceType: device.deviceType, brand: device.brand, model: device.model, problemDescription: device.problemDescription, findings })
      .then((res) => {
        const est = { ...res.estimate, source: res.source };
        if (!est.typicalRepairCost && !est.newPhonePrice) {
          setEstimateState({ loading: false, error: res.note || `No price estimate is available for this ${deviceNoun(device)} yet.` });
          return;
        }
        setEstimate(est);
        setReplacementPrice((prev) => prev || est.newPhonePrice || 0);
        setEstimateState({ loading: false, error: '' });
        if (id) assessmentService.update(id, { estimate: est }).catch(() => {});
      })
      .catch((err) => setEstimateState({ loading: false, error: err?.message || 'Could not load typical prices.' }));
  };

  // Load the case from the server.
  useEffect(() => {
    if (!caseId) return undefined;
    let cancelled = false;
    setCaseState({ loading: true, error: '' });

    assessmentService
      .get(caseId)
      .then((res) => {
        if (cancelled) return;
        const a = res.assessment;
        sessionStorage.setItem(CURRENT_CASE_KEY, a._id);
        setDeviceInfo({
          id: a._id,
          deviceType: a.deviceType || DEFAULT_DEVICE_TYPE,
          brand: a.brand,
          model: a.model,
          deviceAge: a.deviceAge,
          condition: a.condition,
          warrantyStatus: a.warrantyStatus,
          problemType: normalizeProblemType(a.problemType),
          problemDescription: a.problemDescription,
        });
        setDescription(a.problemDescription || '');
        if (a.vision?.findings?.length) setVisionAnalysis(a.vision);
        if (a.quote) {
          setQuoteParts(a.quote.parts || 0);
          setQuoteLabor(a.quote.labour || 0);
          setQuoteDiagnostic(a.quote.diagnostic || 0);
          setQuoteTax(a.quote.tax || 0);
          setQuoteMeta({ shopName: a.quote.shopName || null, fileName: a.quote.fileName || null, notes: a.quote.notes || null });
        }
        if (a.estimate) setEstimate(a.estimate);
        setReplacementPrice(a.replacementCost || a.estimate?.newPhonePrice || 0);
        if (a.status === 'COMPLETE') {
          setSavedDecision({ score: a.score, verdict: a.verdict, repairCost: a.repairCost, replacementCost: a.replacementCost });
        }
        setActiveTab(a.status === 'COMPLETE' || a.quote?.total ? 'decision' : a.vision?.findings?.length ? 'quote' : 'vision');
        setCaseState({ loading: false, error: '' });
        if (!a.estimate?.lineRanges) fetchEstimate(a, a.vision?.findings);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status === 404 || err?.status === 400) sessionStorage.removeItem(CURRENT_CASE_KEY);
        setCaseState({ loading: false, error: err?.message || 'Could not load this case.' });
      });

    return () => {
      cancelled = true;
    };
    // (deps intentionally limited to caseId)
  }, [caseId]);

  /** Diagnose from a photo, the written description, or both. */
  const runCheck = (file, text) => {
    const described = (text || '').trim();
    if (!file && described.length < 5) {
      setVisionError('Add a photo, or describe the problem in a few words.');
      return Promise.resolve();
    }

    setIsScanning(true);
    setVisionAnalysis(null);
    setVisionError('');

    const formData = new FormData();
    if (file) formData.append('images', file);
    formData.append('deviceType', deviceInfo.deviceType);
    formData.append('brand', deviceInfo.brand);
    formData.append('model', deviceInfo.model);
    formData.append('problemDescription', described);
    formData.append('problemType', deviceInfo.problemType);

    // Keep the case's description in step with what was checked, so the estimate uses it too.
    const device = { ...deviceInfo, problemDescription: described };
    if (described !== (deviceInfo.problemDescription || '')) {
      setDeviceInfo(device);
      saveProgress({ problemDescription: described });
    }

    return uploadService
      .uploadDamageImages(formData)
      .then((response) => {
        const analysis = response?.visionAnalysis;
        if (!analysis?.findings?.length) {
          setVisionError(
            response?.aiAnalysisStatus?.note ||
              (file ? 'The photo could not be analysed. Try a clearer, well-lit photo.' : 'Your description could not be analysed. Try adding a bit more detail.')
          );
          return;
        }
        const vision = {
          label: analysis.label || (file ? file.name : 'Your description'),
          aiSummary: analysis.aiSummary || '',
          findings: analysis.findings,
          fileName: file?.name || null,
          described: described || null,
        };
        setVisionAnalysis(vision);
        saveProgress({ vision });
        fetchEstimate(device, analysis.findings);
      })
      .catch((err) => setVisionError(err?.message || 'The check could not be completed. Please try again.'))
      .finally(() => setIsScanning(false));
  };

  const handleCustomFileUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setVisionError('Please choose a JPG, PNG or WEBP photo.');
      e.target.value = '';
      return;
    }

    setSelectedDamageImage(URL.createObjectURL(file));
    setSelectedDamageFile(file);
    runCheck(file, description).finally(() => {
      e.target.value = '';
    });
  };

  const addProblem = (label) =>
    setDescription((prev) => {
      const t = prev.trim();
      if (t.toLowerCase().includes(label.toLowerCase())) return prev;
      return t ? `${t.replace(/[.,;]$/, '')}, ${label.toLowerCase()}` : label;
    });

  const problemType = deviceInfo.problemType;
  const showPhoto = wantsPhoto(problemType);
  const deviceSymptoms = getDeviceType(deviceInfo.deviceType).symptoms;
  const problemChips =
    problemType === 'software'
      ? SOFTWARE_SYMPTOMS
      : problemType === 'hardware'
        ? deviceSymptoms
        : [...deviceSymptoms, ...SOFTWARE_SYMPTOMS.filter((x) => !deviceSymptoms.includes(x))];
  // A photo picked earlier is ignored once the user says it's a software problem.
  const photoForCheck = showPhoto ? selectedDamageFile : null;

  const chooseProblemType = (value) => {
    if (value === problemType) return;
    setDeviceInfo((prev) => ({ ...prev, problemType: value }));
    saveProgress({ problemType: value });
    setVisionError('');
  };

  const handleQuoteFileUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('quotes', file);
    formData.append('deviceType', deviceInfo.deviceType);
    formData.append('brand', deviceInfo.brand);
    formData.append('model', deviceInfo.model);

    setIsUploadingQuote(true);
    setQuoteUploadStatus(null);

    uploadService
      .uploadQuotes(formData)
      .then((response) => {
        const q = response?.quote;
        if (q) {
          setQuoteParts(q.parts || 0);
          setQuoteLabor(q.labour || 0);
          setQuoteDiagnostic(q.diagnostic || 0);
          setQuoteTax(q.tax || 0);
          const meta = { shopName: q.shopName || null, fileName: file.name, notes: q.notes || null };
          setQuoteMeta(meta);
          saveProgress({ quote: { parts: q.parts, labour: q.labour, diagnostic: q.diagnostic, tax: q.tax, ...meta } });
        } else {
          setQuoteMeta((m) => ({ ...m, fileName: file.name }));
        }
        setQuoteUploadStatus({
          ok: Boolean(q),
          message: response?.message || 'Quote uploaded.',
          file: q?.shopName ? `${file.name} · ${q.shopName}` : file.name,
        });
      })
      .catch((err) => {
        setQuoteUploadStatus({
          ok: false,
          message: err?.message || 'Quote upload failed. Please try again.',
          file: file.name,
        });
      })
      .finally(() => {
        setIsUploadingQuote(false);
        e.target.value = '';
      });
  };

  const goToDecision = () => {
    saveProgress({ quote: quotePayload });
    setActiveTab('decision');
  };

  const saveDecision = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await assessmentService.update(deviceInfo.id, {
        quote: quotePayload,
        replacementCost: replacementPrice,
        finalize: true,
      });
      const a = res.assessment;
      setSavedDecision({ score: a.score, verdict: a.verdict, repairCost: a.repairCost, replacementCost: a.replacementCost });
    } catch (err) {
      setSaveError(err?.message || 'Could not save the decision.');
    } finally {
      setSaving(false);
    }
  };

  /* ───────── no case / loading / error ───────── */
  if (!caseId || caseState.loading || (caseState.error && !deviceInfo.id)) {
    return (
      <div className="mx-auto max-w-[720px]">
        <Card className="flex flex-col items-center gap-4 p-8 text-center sm:p-10">
          {caseState.loading ? (
            <>
              <LoaderCircle className="h-7 w-7 animate-spin text-[#0d5b46]" />
              <p className="text-slate-600">Loading your case…</p>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#0d5b46]">
                {caseState.error ? <TriangleAlert className="h-6 w-6" /> : <ScanLine className="h-6 w-6" />}
              </span>
              <div>
                <h2 className="text-xl font-medium text-slate-900">{caseState.error ? 'Could not open this case' : 'No case open'}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {caseState.error || 'Add your device first, then come back here to check the damage, the quote and the decision.'}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/device" className={primaryBtn}>
                  <Plus className="h-4 w-4" /> Add your device
                </Link>
                <Link to="/profile#history" className={secondaryBtn}>
                  Open a previous case
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Intro */}
      <div className="flex flex-col gap-5">
        <div className="min-w-0">
          <h2 className="text-[1.9rem] font-medium tracking-tight text-[#16201d]">Should you repair it?</h2>
          <p className="mt-1 text-slate-500">
            Check the problem, review the shop&rsquo;s quote, then see whether repairing your{' '}
            <span className="font-medium text-slate-700">
              {deviceInfo.brand} {deviceInfo.model}
            </span>{' '}
            is worth it.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Case #{caseRef(deviceInfo.id)} · {deviceInfo.deviceAge} old · {deviceInfo.condition} condition · {deviceInfo.warrantyStatus}
          </p>
          {saveError && <p className="mt-2 text-sm text-red-700">{saveError}</p>}
        </div>

        {/* Stepper */}
        <nav aria-label="Analysis steps" className="min-w-0">
          <ol className="flex w-full max-w-xl rounded-full border border-slate-200/70 bg-white p-1">
            {steps.map(({ key, label }, i) => {
              const isActive = activeTab === key;
              const isDone = i < activeStepIndex;
              return (
                <li key={key} className="min-w-0 flex-1 lg:flex-none">
                  <button
                    type="button"
                    onClick={() => setActiveTab(key)}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex w-full items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm transition sm:px-4 ${isActive ? 'bg-[#0d5b46] font-medium text-white' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs tabular-nums ${isActive ? 'bg-white/20 text-white' : isDone ? 'bg-[#e3f1ec] text-[#0d5b46]' : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="hidden truncate sm:inline">{label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-center text-xs text-slate-500 sm:hidden">
            Step {activeStepIndex + 1} of 3 · {steps[activeStepIndex]?.label}
          </p>
        </nav>
      </div>

      {/* STEP 1: PHOTO DAMAGE CHECK */}
      {activeTab === 'vision' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6 sm:p-7">
            <SectionHeading
              icon={ScanLine}
              title={problemType === 'hardware' ? 'Show or describe the damage' : problemType === 'software' ? 'Describe the problem' : 'Show or describe the problem'}
              subtitle={
                problemType === 'hardware'
                  ? 'A photo helps but isn\u2019t required. You can just describe the damage instead.'
                  : problemType === 'software'
                    ? 'No photo needed. Tell us what happens and when it started.'
                    : 'A photo for visible damage, words for things a photo can\u2019t show, or both.'
              }
            />

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-slate-700">Is it a hardware or software problem?</p>
              <ProblemTypePicker value={problemType} onChange={chooseProblemType} compact />
            </div>

            {showPhoto && (
            <div className="mt-6">
              {selectedDamageImage ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#FAFBF9]">
                  <div className="flex h-[240px] items-center justify-center">
                    <img src={selectedDamageImage} alt={`Photo of the damaged ${noun}`} className="max-h-full max-w-full object-contain" />
                  </div>

                  {!isScanning && visionAnalysis && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-[#0d5b46] shadow-sm">
                      <Check className="h-3.5 w-3.5" /> Photo checked
                    </span>
                  )}

                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 p-4 backdrop-blur-[2px]">
                      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
                        <LoaderCircle className="h-4 w-4 animate-spin text-[#0d5b46]" />
                        Looking for cracks and other damage…
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
                    <p className="min-w-0 truncate text-sm text-slate-500">{visionAnalysis?.label || 'Your photo'}</p>
                    <label className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 text-sm font-medium text-[#0d4a3e] hover:underline">
                      <ImagePlus className="h-4 w-4" /> Use another photo
                      <input type="file" accept="image/*" onChange={handleCustomFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-[#FAFBF9] p-8 text-center transition hover:border-[#0d5b46]/50">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e3f1ec] text-[#0d5b46]">
                    <CloudUpload className="h-7 w-7" />
                  </span>
                  <span className="text-[15px] font-medium text-slate-800">Add a photo of your {noun} <span className="font-normal text-slate-400">(optional)</span></span>
                  <span className="text-sm text-slate-500">Optional · PNG, JPEG or WEBP, up to 10 MB</span>
                  <span className={`${secondaryBtn} mt-1 py-2.5`}>Browse files</span>
                  <input type="file" accept="image/*" onChange={handleCustomFileUpload} className="hidden" />
                </label>
              )}
            </div>
            )}

            <div className="mt-6">
              <label htmlFor="problem-description" className="flex items-center gap-2 text-[15px] font-medium text-slate-800">
                <PenLine className="h-4 w-4 text-[#0d5b46]" /> What&rsquo;s wrong?
              </label>
              <p className="mt-1 text-sm text-slate-500">
                {problemType === 'hardware'
                  ? 'Describe the damage, add a photo above, or both.'
                  : 'Tap what applies, then say what happens and when it started.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {problemChips.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => addProblem(label)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-[#0d5b46]/40 hover:bg-[#eef6f2] hover:text-[#0d4a3e]"
                  >
                    + {label}
                  </button>
                ))}
              </div>
              <textarea
                id="problem-description"
                rows={4}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`e.g. My ${noun} only charges to 20% with the original charger, and the battery lasts about 10 minutes since a battery replacement last year.`}
                className="mt-3 w-full resize-y rounded-2xl border border-slate-200 bg-[#FAFBF9] px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0d5b46]/50 focus:bg-white"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  {photoForCheck ? 'Your photo will be checked together with this.' : showPhoto ? 'A photo is optional but helps.' : 'No photo needed.'}
                </span>
                <button
                  type="button"
                  onClick={() => runCheck(photoForCheck, description)}
                  disabled={isScanning || (!photoForCheck && description.trim().length < 5)}
                  className={`${primaryBtn} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {isScanning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {visionAnalysis ? 'Check again' : 'Check my problem'}
                </button>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col p-6 sm:p-7">
            <SectionHeading icon={Sparkles} title="What we found" subtitle="Damaged parts, how serious they look and rough part costs" />

            <div className="mt-6 flex-1">
              {isScanning ? (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-center">
                  <LoaderCircle className="h-6 w-6 animate-spin text-[#0d5b46]" />
                  <p className="text-sm text-slate-500">Checking your {photoForCheck ? 'photo and description' : 'description'}. This only takes a moment.</p>
                </div>
              ) : visionError ? (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                    <TriangleAlert className="h-6 w-6" />
                  </span>
                  <p className="text-[15px] font-medium text-slate-800">The check didn&rsquo;t work</p>
                  <p className="max-w-xs text-sm text-slate-500">{visionError}</p>
                </div>
              ) : visionAnalysis ? (
                <div className="space-y-5">
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${visionAnalysis.aiSummary?.startsWith('HAZARD') ? 'border border-red-200 bg-red-50 text-red-800' : 'bg-[#eef6f2] text-slate-700'
                      }`}
                  >
                    <div
                      className={`mb-1.5 flex items-center gap-1.5 text-[13px] font-medium ${visionAnalysis.aiSummary?.startsWith('HAZARD') ? 'text-red-800' : 'text-[#0d4a3e]'
                        }`}
                    >
                      {visionAnalysis.aiSummary?.startsWith('HAZARD') ? <TriangleAlert className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      Summary
                    </div>
                    {visionAnalysis.aiSummary}
                  </div>

                  <div>
                    <p className={eyebrow}>Parts checked</p>
                    <ul className="mt-3 space-y-2.5">
                      {visionAnalysis.findings.map((item, i) => (
                        <li key={i} className="rounded-2xl border border-slate-200/80 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <span className="min-w-0 text-[15px] font-medium text-slate-900">{item.component}</span>
                            <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${severityStyle(item.severity)}`}>
                              {item.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="text-slate-500">
                              Part cost: <span className="font-medium tabular-nums text-slate-800">{item.estCost}</span>
                            </span>
                            <span className="text-xs tabular-nums text-slate-400">{item.confidence}% confident</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    These findings are an AI estimate from your photo or description, not a definitive diagnosis. A technician should confirm them before any work.
                  </p>
                </div>
              ) : (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Info className="h-6 w-6" />
                  </span>
                  <p className="text-[15px] font-medium text-slate-800">Nothing checked yet</p>
                  <p className="max-w-xs text-sm text-slate-500">Add a photo or describe the problem to see the likely cause, the parts involved and what they usually cost to fix.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setActiveTab('quote')} className={primaryBtn}>
                Next: review the quote <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 2: QUOTE REVIEW */}
      {activeTab === 'quote' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6 sm:p-7">
            <SectionHeading icon={FileText} title="Enter the shop's quote" subtitle="Add each part of the price to see if it's fair for your area" />

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-[#FAFBF9] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Upload the quote</p>
                    <p className="text-xs text-slate-500">PDF, JPG, PNG, or WEBP</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0d5b46] px-4 py-2 text-sm font-medium text-white">
                    <CloudUpload className="h-4 w-4" />
                    {isUploadingQuote ? 'Uploading…' : 'Choose file'}
                    <input type="file" accept="application/pdf,image/*" onChange={handleQuoteFileUpload} className="hidden" />
                  </label>
                </div>

                {quoteUploadStatus && (
                  <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${quoteUploadStatus.ok ? 'bg-[#eef6f2] text-[#0d4a3e]' : 'border border-red-200 bg-red-50 text-red-700'}`}>
                    <div className="font-medium">{quoteUploadStatus.ok ? 'Quote uploaded' : 'Upload issue'}</div>
                    <div className="mt-0.5">{quoteUploadStatus.message}</div>
                    {quoteUploadStatus.file && (
                      <div className="mt-0.5 text-xs opacity-80">File: {quoteUploadStatus.file}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { id: 'quote-parts', label: 'Replacement parts (₹)', value: quoteParts, set: setQuoteParts, check: lineChecks.parts },
                  { id: 'quote-labour', label: 'Labour (₹)', value: quoteLabor, set: setQuoteLabor, check: lineChecks.labour },
                  { id: 'quote-diag', label: 'Inspection fee (₹)', value: quoteDiagnostic, set: setQuoteDiagnostic, check: lineChecks.diagnostic },
                  { id: 'quote-tax', label: 'Supplies and GST (₹)', value: quoteTax, set: setQuoteTax, check: lineChecks.tax },
                ].map((f) => (
                  <div key={f.id} className="min-w-0">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label htmlFor={f.id} className="block text-sm text-slate-700">
                        {f.label}
                      </label>
                      <FlagPill flag={f.check.flag} />
                    </div>
                    <input
                      id={f.id}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={f.value || ''}
                      placeholder="0"
                      onChange={(e) => f.set(Math.max(0, Number(e.target.value) || 0))}
                      className={inputCls}
                    />
                    {f.check.range && (
                      <p className="mt-1 text-xs text-slate-400">
                        {f.check.isTax
                          ? `GST is 18%: about ${formatINR(Math.round(quoteBase * GST_RATE))} here`
                          : `Usual: ${formatINR(f.check.range[0])} – ${formatINR(f.check.range[1])}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {lineRanges && totalQuoteCost > 0 && (
                <p
                  className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${
                    flaggedLines ? 'border border-amber-200 bg-amber-50 text-amber-800' : 'bg-[#eef6f2] text-[#0d4a3e]'
                  }`}
                >
                  {flaggedLines ? <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                  {flaggedLines
                    ? `${flaggedLines} line${flaggedLines > 1 ? 's are' : ' is'} above the usual price for the ${deviceInfo.model}. Ask the shop to explain ${flaggedLines > 1 ? 'them' : 'it'} before you agree.`
                    : `Every line is within the usual price for the ${deviceInfo.model}.`}
                </p>
              )}

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#FAFBF9] px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">Quote total</p>
                  <p className="text-xs text-slate-500">Parts, labour, inspection and tax</p>
                </div>
                <span className="text-2xl font-medium tabular-nums text-[#16201d]">{formatINR(totalQuoteCost)}</span>
              </div>

              {estimateState.loading ? (
                <div className="flex items-center gap-2 rounded-2xl bg-[#FAFBF9] px-5 py-4 text-sm text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#0d5b46]" /> Checking typical prices for the {deviceInfo.model}…
                </div>
              ) : !marketBenchmarkAverage ? (
                <div className="flex items-start gap-2 rounded-2xl bg-[#FAFBF9] px-5 py-4 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>
                    {estimateState.error || `No typical price is available for this ${noun} yet.`}{' '}
                    <button type="button" onClick={() => fetchEstimate(deviceInfo, visionAnalysis?.findings)} className="font-medium text-[#0d4a3e] hover:underline">
                      Try again
                    </button>
                  </span>
                </div>
              ) : (
                <div
                  className={`rounded-2xl px-5 py-4 ${isOverpriced ? 'border border-amber-200 bg-amber-50' : 'bg-[#eef6f2]'}`}
                >
                  {totalQuoteCost > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-slate-700">Compared with typical prices</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${isFair ? 'bg-[#e3f1ec] text-[#0d5b46]' : isOverpriced ? 'bg-amber-100 text-amber-800' : 'bg-white text-[#0d5b46]'
                          }`}
                      >
                        {isFair ? 'Fair price' : isOverpriced ? `About ${formatINR(priceDifference)} too high` : 'Below the usual price'}
                      </span>
                    </div>
                  )}
                  <p className={`text-sm text-slate-600 ${totalQuoteCost > 0 ? 'mt-1.5' : ''}`}>
                    A repair like this on a {deviceInfo.model} usually costs about{' '}
                    <span className="font-medium tabular-nums text-slate-800">{formatINR(marketBenchmarkAverage)}</span>
                    {estimate?.typicalRepairRange && (
                      <>
                        {' '}({formatINR(estimate.typicalRepairRange[0])}–{formatINR(estimate.typicalRepairRange[1])})
                      </>
                    )}{' '}
                    at independent shops in India.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {estimate?.source === 'community' ? 'Based on quotes other ReLife-Spark users saved for this model.' : 'AI estimate — prices vary by city and part quality.'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="flex flex-col p-6 sm:p-7">
            <SectionHeading icon={MessageCircleQuestion} title="Questions to ask the shop" subtitle={estimate?.questions?.length ? `Picked for your ${deviceInfo.model} and its fault` : 'Avoid low-quality parts and surprise fees before you agree to the repair'} />

            <ol className="mt-6 flex-1 space-y-3">
              {technicianQuestions.map((item, idx) => (
                <li key={idx} className="flex gap-3 rounded-2xl border border-slate-200/80 p-4">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#e3f1ec] text-xs font-medium tabular-nums text-[#0d5b46]">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium leading-snug text-slate-900">{item.q}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.reason}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => setActiveTab('vision')} className={secondaryBtn}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button type="button" onClick={goToDecision} className={primaryBtn}>
                See the decision <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: DECISION */}
      {activeTab === 'decision' && (
        <div className="space-y-6">
          {!decisionReady ? (
            <Card className="flex flex-col items-center gap-3 p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Info className="h-6 w-6" />
              </span>
              <p className="text-[15px] font-medium text-slate-800">A couple of numbers are missing</p>
              <p className="max-w-md text-sm text-slate-500">
                {totalQuoteCost === 0 ? 'Enter or upload the shop\u2019s quote' : `Enter the price of a new ${noun} below`} to work out your Repair Score.
              </p>
              {totalQuoteCost === 0 && (
                <button type="button" onClick={() => setActiveTab('quote')} className={secondaryBtn}>
                  <ArrowLeft className="h-4 w-4" /> Back to the quote
                </button>
              )}
            </Card>
          ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.6fr]">
            {/* Score */}
            <Card className="flex flex-col items-center justify-center p-6 text-center sm:p-8">
              <p className={eyebrow}>Your Repair Score</p>
              <div className="mt-4 flex w-full justify-center">
                <ScoreGauge score={calculatedRepairScore} />
              </div>
              <span className={`mt-4 rounded-full px-3 py-1 text-xs font-medium ${verdictStyles[currentRec.verdict]}`}>
                Recommended: {currentRec.verdict}
              </span>
              <p className="mt-3 max-w-[260px] text-xs leading-relaxed text-slate-500">
                60 or above means repair, 40 to 59 means either is reasonable, below 40 means replace.
              </p>
            </Card>

            {/* Recommendation */}
            <section className="relative min-w-0 overflow-hidden rounded-[28px] bg-[#0d2f27] p-6 text-white sm:p-8">
              <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#2feaa8]/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-[13px] uppercase tracking-[0.16em] text-[#7fffd4]">
                  <Scale className="h-4 w-4" /> {currentRec.badge.toLowerCase()}
                </div>
                <p className="mt-3 text-xl font-medium leading-snug sm:text-[1.35rem]">{currentRec.summary}</p>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  <span className="font-medium text-[#7fffd4]">Next step:</span> {currentRec.action}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                    <p className="text-xs text-white/60">Repair quote</p>
                    <p className="mt-0.5 text-xl font-medium tabular-nums">{formatINR(customRepairCost)}</p>
                  </div>
                  <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                    <p className="text-xs text-white/60">New {noun}</p>
                    <p className="mt-0.5 text-xl font-medium tabular-nums">{formatINR(replacementPrice)}</p>
                  </div>
                  {currentRec.verdict === 'REPLACE' ? (
                    // Replacing saves nothing, so show why: how much of a new device the repair would eat up.
                    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                      <p className="text-xs text-white/60">Repair costs</p>
                      <p className="mt-0.5 text-xl font-medium tabular-nums">{Math.round(costRatio)}% of new</p>
                    </div>
                  ) : (
                    <div className="min-w-0 rounded-2xl border border-[#2feaa8]/30 bg-[#2feaa8]/10 px-4 py-3">
                      <p className="text-xs text-[#7fffd4]">{currentRec.verdict === 'REPAIR' ? 'You keep' : 'Saved if you repair'}</p>
                      <p className="mt-0.5 text-xl font-medium tabular-nums text-[#7fffd4]">{formatINR(financialSavings)}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
          )}

          {/* Inputs that drive the score */}
          <Card className="p-6 sm:p-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:items-end">
              <div className="min-w-0">
                <h3 className="text-lg font-medium text-slate-900">Price of a new {noun}</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  {estimate?.newPhonePrice
                    ? `Pre-filled with ${formatINR(estimate.newPhonePrice)}${estimate.newPhoneLabel ? ` (${estimate.newPhoneLabel})` : ''}. `
                    : ''}
                  Change this to match the {noun} you&rsquo;d buy instead. The repair cost comes from your quote total ({formatINR(customRepairCost)}).
                </p>
              </div>
              <div className="min-w-0">
                <label htmlFor="replacement-price" className="mb-1.5 block text-sm text-slate-700">
                  New {noun} price (₹)
                </label>
                <input
                  id="replacement-price"
                  type="number"
                  min="0"
                  value={replacementPrice || ''}
                  placeholder="0"
                  onChange={(e) => setReplacementPrice(Math.max(0, Number(e.target.value) || 0))}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {decisionSaved ? (
                  <span className="inline-flex items-center gap-1.5 text-[#0d5b46]">
                    <CircleCheck className="h-4 w-4" /> Saved to your history
                  </span>
                ) : savedDecision ? (
                  'You changed the numbers since this decision was saved.'
                ) : (
                  'Save the decision to add it to your history and impact.'
                )}
              </p>
              <button
                type="button"
                onClick={saveDecision}
                disabled={!decisionReady || saving || decisionSaved}
                className={`${primaryBtn} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : savedDecision ? 'Update decision' : 'Save decision'}
              </button>
            </div>
          </Card>

          {/* Why this verdict (RAG over the repair guides, with sources) */}
          {decisionReady && (
            <Card className="p-6 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#0d5b46]">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-medium text-slate-900">Why {currentRec.verdict.toLowerCase()}?</h3>
                  <p className="mt-0.5 text-sm text-slate-500">Explained from our repair guides. The score decides the verdict; this explains it.</p>
                </div>
              </div>

              {explanation.loading && !explanation.data ? (
                <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#0d5b46]" /> Reading the repair guides…
                </p>
              ) : explanation.error ? (
                <p className="mt-5 text-sm text-red-700">{explanation.error}</p>
              ) : explanation.data ? (
                <div className={`mt-5 space-y-4 transition-opacity ${explanation.loading ? 'opacity-60' : ''}`}>
                  <p className="text-[15px] leading-relaxed text-slate-800">{explanation.data.summary}</p>
                  <ul className="space-y-2.5">
                    {explanation.data.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                        <span className="mt-[0.5em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#0d5b46]" />
                        <span className="min-w-0">
                          {p.text}{' '}
                          <sup className="whitespace-nowrap font-medium text-[#0d5b46]">[{p.source}]</sup>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-100 pt-4">
                    <p className={eyebrow}>Sources</p>
                    <ol className="mt-2 space-y-1 text-xs text-slate-500">
                      {explanation.data.sources.map((s) => (
                        <li key={s.id}>
                          <span className="font-medium text-slate-700">[{s.id}] {s.title}</span> · {s.source}, {s.page}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ) : null}
            </Card>
          )}

          {/* Factor breakdown */}
          <Card className="p-6 sm:p-7">
            <h3 className="text-lg font-medium text-slate-900">How the score was worked out</h3>
            <p className="mt-0.5 text-sm text-slate-500">Five things are weighed. Each gets a score out of 100, and the weights add up to 100%.</p>

            <ul className="mt-6 space-y-4">
              {factors.map((f) => (
                <li key={f.label} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center sm:gap-5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{f.label}</p>
                    <p className="truncate text-xs text-slate-500">{f.note}</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <span className="block h-2 rounded-full bg-[#0d5b46]" style={{ width: `${f.score}%` }} />
                  </div>
                  <div className="flex items-baseline gap-3 text-sm tabular-nums sm:justify-end">
                    <span className="font-medium text-slate-900">{f.score}/100</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{f.weight}% weight</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RepairAnalysis;
