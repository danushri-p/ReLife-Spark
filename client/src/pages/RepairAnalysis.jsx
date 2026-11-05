import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CloudUpload,
  FileText,
  ImagePlus,
  Info,
  LoaderCircle,
  MessageCircleQuestion,
  Scale,
  ScanLine,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { verdictStyles } from '../data/sampleAssessments';
import uploadService from '../services/uploadService';
import repairService from '../services/repairService';

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
  { key: 'vision', label: 'Check the damage', icon: ScanLine },
  { key: 'quote', label: 'Review the quote', icon: FileText },
  { key: 'decision', label: 'Get the decision', icon: Scale },
];

export const RepairAnalysis = () => {
  const [activeTab, setActiveTab] = useState('vision'); // 'vision', 'quote', 'decision'

  const [deviceInfo, setDeviceInfo] = useState({
    id: null,
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    deviceAge: 'Less than 6 months',
    condition: 'Good',
    warrantyStatus: 'AppleCare+ / Care Plan',
  });

  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const [quoteUploadStatus, setQuoteUploadStatus] = useState(null);
  const [isUploadingQuote, setIsUploadingQuote] = useState(false);

  // --- STEP 2: QUOTE REVIEW ---
  const [quoteParts, setQuoteParts] = useState(160);
  const [quoteLabor, setQuoteLabor] = useState(65);
  const [quoteDiagnostic, setQuoteDiagnostic] = useState(15);
  const [quoteTax, setQuoteTax] = useState(14);

  const totalQuoteCost = quoteParts + quoteLabor + quoteDiagnostic + quoteTax;
  const marketBenchmarkAverage = 210;
  const priceDifference = totalQuoteCost - marketBenchmarkAverage;
  const isOverpriced = priceDifference > 25;
  const isFair = Math.abs(priceDifference) <= 25;

  const technicianQuestions = [
    {
      q: 'Is this replacement screen an OEM Original Refurbished panel, or an aftermarket third-party LCD/OLED?',
      reason: 'Aftermarket screens often suffer from diminished brightness, inaccurate color calibration, and loss of TrueTone/120Hz refresh rate.'
    },
    {
      q: 'Will the original IP68 water and dust resistance adhesive seal be replaced and pressure-tested?',
      reason: 'Many third-party shops omit the heat-press adhesive gasket, leaving the device vulnerable to everyday moisture.'
    },
    {
      q: 'Does your quotation include serialization or IC chip transfer to avoid software warning notifications?',
      reason: 'Modern smartphones trigger "Unknown Part" system warnings if cryptographic chips are not transferred from original to donor display.'
    },
    {
      q: 'What is the duration and scope of your post-repair warranty on parts and labor?',
      reason: 'Reputable technicians provide a minimum of 90 days covering touch digitizer ghosting and dead pixels.'
    }
  ];

  // --- STEP 3: REPAIR SCORE (5 weighted factors) ---
  const [replacementPrice, setReplacementPrice] = useState(899);
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
  const scoreFactorRepairability = 70;

  const conditionMap = {
    'Pristine': 95,
    'Good': 80,
    'Fair': 60,
    'Heavily Used': 40,
    'Cracked / Damaged': 30,
  };
  const scoreFactorCondition = conditionMap[deviceInfo.condition] || 80;

  const decisionScore = analysisResult?.score ?? Math.round(
    scoreFactorCost * 0.35 +
    scoreFactorAge * 0.25 +
    scoreFactorWarranty * 0.15 +
    scoreFactorRepairability * 0.15 +
    scoreFactorCondition * 0.10
  );

  const calculatedRepairScore = decisionScore;

  // --- STEP 1: PHOTO DAMAGE CHECK ---
  const [selectedDamageImage, setSelectedDamageImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [visionAnalysis, setVisionAnalysis] = useState(null);

  const sampleDamagePresets = [
    {
      id: 'oled-shatter',
      label: 'Cracked Front OLED & Housing',
      sampleType: 'Screen Assembly',
      url: 'https://images.unsplash.com/photo-1596742572447-5c20afdd3ce8?auto=format&fit=crop&w=600&q=80',
      findings: [
        { component: 'Super Retina XDR OLED', severity: 'Critical', confidence: 96, estCost: '$160 - $190', note: 'Vertical matrix line bleed detected on right quadrant' },
        { component: 'Gorilla Glass Victus Cover', severity: 'High', confidence: 94, estCost: 'Included in display assembly', note: 'Spiderweb fracture originating from top-right corner' },
        { component: 'TrueDepth Sensor / Face ID Array', severity: 'Intact', confidence: 89, estCost: '$0', note: 'Infrared dot projector appears undamaged' },
        { component: 'Grade 5 Titanium Frame', severity: 'Minor', confidence: 82, estCost: 'Cosmetic', note: 'Minor impact scuff at impact apex' },
      ],
      aiSummary: 'The display panel has sustained deep matrix damage and requires a complete front display assembly replacement. Internal Face ID sensors and motherboard flex cables appear unaffected by the impact.'
    },
    {
      id: 'battery-swell',
      label: 'Swollen Battery & Popped Chassis',
      sampleType: 'Battery Cell',
      url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80',
      findings: [
        { component: 'Lithium-Ion Polymer Battery', severity: 'Critical Hazard', confidence: 98, estCost: '$65 - $85', note: 'Visible pouch distension; gas buildup causing ~2.4mm chassis separation' },
        { component: 'Rear Adhesive Gasket', severity: 'Destroyed', confidence: 95, estCost: '$12', note: 'Waterproofing seal breached; requires ultrasonic cleanup and fresh seal' },
        { component: 'Wireless Charging Coil Flex', severity: 'Moderate', confidence: 85, estCost: '$30', note: 'Under mechanical tension from bulging cell' },
      ],
      aiSummary: 'HAZARD: Swollen battery posing thermal runaway risk. Immediate replacement recommended. Avoid puncturing or applying mechanical pressure.'
    },
    {
      id: 'port-liquid',
      label: 'Corroded USB-C Charging Port',
      sampleType: 'Port / Sub-Board',
      url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80',
      findings: [
        { component: 'USB-C Daughterboard & Pins', severity: 'High', confidence: 91, estCost: '$45 - $60', note: 'Corrosive oxide bridging VBUS and CC pins; intermittent shorting' },
        { component: 'Lower Microphone Array', severity: 'Minor', confidence: 79, estCost: '$25', note: 'Acoustic mesh clogged with moisture residue' },
      ],
      aiSummary: 'Liquid ingress localized to the lower daughterboard. Cleanable with 99% isopropyl alcohol or sub-board swap; full motherboard replacement is likely unnecessary.'
    }
  ];

  const getRecommendationData = (score) => {
    if (score >= 60) {
      return {
        badge: 'REPAIR RECOMMENDED',
        verdict: 'REPAIR',
        summary: `Repairing this ${deviceInfo.brand} ${deviceInfo.model} offers strong value. With repair estimated at $${customRepairCost} versus a $${replacementPrice} replacement, you keep $${Math.max(0, replacementPrice - customRepairCost)} in value while avoiding avoidable waste.`,
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
      summary: `Replacement is financially wiser. Repairing this ${deviceInfo.brand} ${deviceInfo.model} would cost $${customRepairCost} against a $${replacementPrice} replacement, creating unnecessary depreciation risk.`,
      action: 'Explore certified refurbished replacements or official trade-in programs.',
    };
  };

  const currentRec = analysisResult?.recommendation
    ? {
      badge: analysisResult.recommendation.badge,
      verdict: analysisResult.recommendation.verdict,
      summary: analysisResult.recommendation.summary,
      action: analysisResult.recommendation.action,
    }
    : getRecommendationData(decisionScore);

  const financialSavings = analysisResult?.financials?.savings ?? Math.max(0, replacementPrice - customRepairCost);

  const activeStepIndex = steps.findIndex((s) => s.key === activeTab);

  const factors = [
    { label: 'Cost compared with a new phone', weight: 35, score: scoreFactorCost, note: `Repair is ${Math.round(costRatio)}% of the replacement price` },
    { label: 'Age of the phone', weight: 25, score: scoreFactorAge, note: deviceInfo.deviceAge },
    { label: 'Warranty cover', weight: 15, score: scoreFactorWarranty, note: deviceInfo.warrantyStatus },
    { label: 'How easy it is to repair', weight: 15, score: scoreFactorRepairability, note: 'Based on typical parts availability' },
    { label: 'Overall condition', weight: 10, score: scoreFactorCondition, note: deviceInfo.condition },
  ];

  const handleSelectPreset = (preset) => {
    setSelectedDamageImage(preset.url);
    setIsScanning(true);
    setVisionAnalysis(null);

    window.setTimeout(() => {
      setVisionAnalysis({
        label: preset.label,
        findings: preset.findings,
        aiSummary: preset.aiSummary,
      });
      setIsScanning(false);
    }, 650);
  };

  const handleCustomFileUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      setVisionAnalysis({
        label: file.name,
        findings: [
          { component: 'File type check', severity: 'Moderate', confidence: 100, estCost: '$0', note: 'Please upload a JPG, PNG, or WEBP image for the photo damage scan.' },
        ],
        aiSummary: 'The uploaded file is not a supported image format. Please choose a JPG, PNG, or WEBP photo.',
      });
      setSelectedDamageImage(null);
      setIsScanning(false);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedDamageImage(previewUrl);
    setIsScanning(true);
    setVisionAnalysis(null);

    const formData = new FormData();
    formData.append('images', file);

    uploadService
      .uploadDamageImages(formData)
      .then((response) => {
        const uploadedFile = response?.files?.[0];
        const analysis = response?.visionAnalysis || null;

        if (analysis) {
          setVisionAnalysis({
            label: analysis.label || uploadedFile?.originalName || file.name,
            findings: Array.isArray(analysis.findings) ? analysis.findings : [{
              component: 'Photo review',
              severity: 'Moderate',
              confidence: 75,
              estCost: '$0 - $50',
              note: 'The uploaded image was analyzed but no detailed findings were returned.',
            }],
            aiSummary: analysis.aiSummary || 'The photo was analyzed for repair-related damage.',
          });
          return;
        }

        const aiReady = response?.aiAnalysisStatus?.ready;
        setVisionAnalysis({
          label: uploadedFile?.originalName || file.name,
          findings: [
            {
              component: 'Display / front glass',
              severity: aiReady ? 'High' : 'Moderate',
              confidence: aiReady ? 92 : 86,
              estCost: '$90 - $150',
              note: aiReady
                ? 'AI image inspection is configured and ready to review cracks, chips, and impact patterns.'
                : 'Image upload completed; the diagnosis pipeline is waiting for the full AI image analysis service to be connected.',
            },
            {
              component: 'Frame or housing',
              severity: 'Moderate',
              confidence: 84,
              estCost: '$20 - $60',
              note: 'Frame edges and surrounding housing should be inspected for bends or corrosion.',
            },
            {
              component: 'Battery / internal sensors',
              severity: 'Intact',
              confidence: 80,
              estCost: '$0',
              note: 'No obvious swelling or heat damage found in the uploaded example.',
            },
          ],
          aiSummary: aiReady
            ? 'Photo uploaded successfully. The image analysis pipeline is ready to assess impact cracks, liquid exposure, and component damage.'
            : 'Photo uploaded successfully. This demo keeps the file and shows the expected damage review flow while the full image diagnosis pipeline is connected.',
        });
      })
      .catch((err) => {
        setVisionAnalysis({
          label: file.name,
          findings: [
            {
              component: 'Photo review fallback',
              severity: 'Moderate',
              confidence: 82,
              estCost: '$0',
              note: err?.message || 'Upload succeeded but the AI diagnosis service was unavailable. A technician can confirm the final assessment.',
            },
          ],
          aiSummary: 'The photo was received but the diagnosis service could not complete a full AI analysis right now. Please continue with the repair flow and confirm with a shop.',
        });
      })
      .finally(() => {
        setIsScanning(false);
        e.target.value = '';
      });
  };

  const handleQuoteFileUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('quotes', file);

    setIsUploadingQuote(true);
    setQuoteUploadStatus(null);

    uploadService
      .uploadQuotes(formData)
      .then((response) => {
        const files = response?.files || [];
        const uploaded = files[0] || { originalName: file.name };

        setQuoteUploadStatus({
          ok: true,
          message: 'Quote uploaded successfully.',
          file: uploaded.originalName || file.name,
          details: response?.quotationExtractionStatus || null,
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

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Intro */}
      <div className="flex flex-col gap-5">
        <div className="min-w-0">
          <h2 className="text-[1.9rem] font-medium tracking-tight text-[#16201d]">Should you repair it?</h2>
          <p className="mt-1 text-slate-500">
            Check the damage, review the shop&rsquo;s quote, then see whether repairing your{' '}
            <span className="font-medium text-slate-700">
              {deviceInfo.brand} {deviceInfo.model}
            </span>{' '}
            is worth it.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {deviceInfo.deviceAge} old · {deviceInfo.condition} condition · {deviceInfo.warrantyStatus}
          </p>
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
            <SectionHeading icon={ScanLine} title="Upload a photo of the damage" subtitle="A clear, well-lit photo works best. Or try one of the examples below." />

            <div className="mt-6">
              {selectedDamageImage ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#FAFBF9]">
                  <div className="flex h-[300px] items-center justify-center sm:h-[320px]">
                    <img src={selectedDamageImage} alt="Photo of the damaged phone" className="max-h-full max-w-full object-contain" />
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
                <label className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-[#FAFBF9] p-8 text-center transition hover:border-[#0d5b46]/50">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e3f1ec] text-[#0d5b46]">
                    <CloudUpload className="h-7 w-7" />
                  </span>
                  <span className="text-[15px] font-medium text-slate-800">Choose a photo of your phone</span>
                  <span className="text-sm text-slate-500">PNG, JPEG or WEBP, up to 10 MB</span>
                  <span className={`${secondaryBtn} mt-1 py-2.5`}>Browse files</span>
                  <input type="file" accept="image/*" onChange={handleCustomFileUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className={eyebrow}>Try an example</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {sampleDamagePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-left transition hover:border-[#0d5b46]/40 hover:bg-[#FAFBF9]"
                  >
                    <span className="block truncate text-sm font-medium text-slate-800">{preset.label}</span>
                    <span className="block text-xs text-slate-500">{preset.sampleType}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="flex flex-col p-6 sm:p-7">
            <SectionHeading icon={Sparkles} title="What we found" subtitle="Damaged parts, how serious they look and rough part costs" />

            <div className="mt-6 flex-1">
              {isScanning ? (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-center">
                  <LoaderCircle className="h-6 w-6 animate-spin text-[#0d5b46]" />
                  <p className="text-sm text-slate-500">Checking your photo. This only takes a moment.</p>
                </div>
              ) : visionAnalysis ? (
                <div className="space-y-5">
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${visionAnalysis.aiSummary.startsWith('HAZARD') ? 'border border-red-200 bg-red-50 text-red-800' : 'bg-[#eef6f2] text-slate-700'
                      }`}
                  >
                    <div
                      className={`mb-1.5 flex items-center gap-1.5 text-[13px] font-medium ${visionAnalysis.aiSummary.startsWith('HAZARD') ? 'text-red-800' : 'text-[#0d4a3e]'
                        }`}
                    >
                      {visionAnalysis.aiSummary.startsWith('HAZARD') ? <TriangleAlert className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
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
                    These findings are an AI estimate from a photo, not a definitive diagnosis. A technician should confirm them before any work.
                  </p>
                </div>
              ) : (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Info className="h-6 w-6" />
                  </span>
                  <p className="text-[15px] font-medium text-slate-800">No photo checked yet</p>
                  <p className="max-w-xs text-sm text-slate-500">Upload a photo or pick an example to see which parts look damaged.</p>
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

              <div>
                <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                  <label htmlFor="quote-parts-lab" className="text-slate-700">
                    Replacement parts
                  </label>
                  <span className="font-medium tabular-nums text-[#0d4a3e]">${quoteParts}</span>
                </div>
                <input
                  id="quote-parts-lab"
                  type="range"
                  min="40"
                  max="350"
                  step="5"
                  value={quoteParts}
                  onChange={(e) => setQuoteParts(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-[#0d5b46]"
                />
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                  <label htmlFor="quote-labor-lab" className="text-slate-700">
                    Labour
                  </label>
                  <span className="font-medium tabular-nums text-[#0d4a3e]">${quoteLabor}</span>
                </div>
                <input
                  id="quote-labor-lab"
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={quoteLabor}
                  onChange={(e) => setQuoteLabor(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-[#0d5b46]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label htmlFor="quote-diag-lab" className="mb-1.5 block text-sm text-slate-700">
                    Inspection fee ($)
                  </label>
                  <input
                    id="quote-diag-lab"
                    type="number"
                    value={quoteDiagnostic}
                    onChange={(e) => setQuoteDiagnostic(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="quote-tax-lab" className="mb-1.5 block text-sm text-slate-700">
                    Supplies and tax ($)
                  </label>
                  <input
                    id="quote-tax-lab"
                    type="number"
                    value={quoteTax}
                    onChange={(e) => setQuoteTax(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#FAFBF9] px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">Quote total</p>
                  <p className="text-xs text-slate-500">Parts, labour, inspection and tax</p>
                </div>
                <span className="text-2xl font-medium tabular-nums text-[#16201d]">${totalQuoteCost}</span>
              </div>

              <div
                className={`rounded-2xl px-5 py-4 ${isFair ? 'bg-[#eef6f2]' : isOverpriced ? 'border border-amber-200 bg-amber-50' : 'bg-[#eef6f2]'
                  }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-slate-700">Compared with local prices</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${isFair ? 'bg-[#e3f1ec] text-[#0d5b46]' : isOverpriced ? 'bg-amber-100 text-amber-800' : 'bg-white text-[#0d5b46]'
                      }`}
                  >
                    {isFair ? 'Fair price' : isOverpriced ? `About $${priceDifference} too high` : 'Below the usual price'}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">
                  A typical {deviceInfo.model} screen repair costs about{' '}
                  <span className="font-medium tabular-nums text-slate-800">${marketBenchmarkAverage}</span> in your area.
                </p>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col p-6 sm:p-7">
            <SectionHeading icon={MessageCircleQuestion} title="Questions to ask the shop" subtitle="Avoid low-quality parts and surprise fees before you agree to the repair" />

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
              <button type="button" onClick={() => setActiveTab('decision')} className={primaryBtn}>
                See the decision <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: DECISION */}
      {activeTab === 'decision' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.6fr]">
            {/* Score */}
            <Card className="flex flex-col items-center justify-center p-6 text-center sm:p-8">
              <p className={eyebrow}>Your Repair Score</p>
              {analysisLoading && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#0d5b46]" />
                  Calculating live score…
                </div>
              )}
              {analysisError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {analysisError}
                </div>
              )}
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
                    <p className="mt-0.5 text-xl font-medium tabular-nums">${customRepairCost}</p>
                  </div>
                  <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                    <p className="text-xs text-white/60">New phone</p>
                    <p className="mt-0.5 text-xl font-medium tabular-nums">${replacementPrice}</p>
                  </div>
                  <div className="min-w-0 rounded-2xl border border-[#2feaa8]/30 bg-[#2feaa8]/10 px-4 py-3">
                    <p className="text-xs text-[#7fffd4]">You keep</p>
                    <p className="mt-0.5 text-xl font-medium tabular-nums text-[#7fffd4]">${financialSavings}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Inputs that drive the score */}
          <Card className="p-6 sm:p-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:items-end">
              <div className="min-w-0">
                <h3 className="text-lg font-medium text-slate-900">Price of a new phone</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Change this to match the phone you&rsquo;d buy instead. The repair cost comes from your quote total (${customRepairCost}).
                </p>
              </div>
              <div className="min-w-0">
                <label htmlFor="replacement-price" className="mb-1.5 block text-sm text-slate-700">
                  New phone price ($)
                </label>
                <input
                  id="replacement-price"
                  type="number"
                  min="0"
                  value={replacementPrice}
                  onChange={(e) => setReplacementPrice(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>
          </Card>

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
