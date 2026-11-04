import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  RotateCcw,
  ArrowRight,
  CircleCheck,
  TriangleAlert,
  X,
  Sparkles,
  ShieldCheck,
  Scale,
  Info,
  LoaderCircle,
} from 'lucide-react';
import deviceService from '../services/deviceService';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0d5b46]/50 focus:ring-2 focus:ring-[#0d5b46]/10';
const labelCls = 'mb-2 block text-sm font-medium text-slate-700';
const chipCls = (selected) =>
  `rounded-full border px-3 py-1.5 text-xs transition ${
    selected
      ? 'border-[#0d5b46]/30 bg-[#e3f1ec] text-[#0d4a3e]'
      : 'border-slate-200 bg-white text-slate-600 hover:border-[#0d5b46]/30 hover:text-[#0d4a3e]'
  }`;

const Card = ({ className = '', children }) => (
  <section className={`min-w-0 rounded-[28px] border border-slate-200/70 bg-white ${className}`}>{children}</section>
);

const Required = () => (
  <span className="text-[#0d5b46]" aria-hidden="true">
    {' '}*
  </span>
);

const scoringWeights = [
  { label: 'Repair cost vs. a new phone', pct: 35 },
  { label: 'How old the phone is', pct: 25 },
  { label: 'Warranty cover', pct: 15 },
  { label: 'How easy it is to repair', pct: 15 },
  { label: 'Overall condition', pct: 10 },
];

export const DeviceDetails = () => {
  const navigate = useNavigate();

  const initialForm = {
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    deviceAge: 'Less than 6 months',
    condition: 'Good',
    warrantyStatus: 'AppleCare+ / Care Plan',
    problemDescription: 'Impact fracture on front display after concrete drop. Touch matrix functional but vertical distortion line visible on right quadrant. TrueDepth sensor unaffected.',
  };

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorResult, setErrorResult] = useState(null);

  const flagshipPresets = [
    { brand: 'Apple', model: 'iPhone 15 Pro', age: 'Less than 6 months', repairability: 7, replacementEst: 899, condition: 'Good' },
    { brand: 'Samsung', model: 'Galaxy S24 Ultra', age: 'Less than 6 months', repairability: 7, replacementEst: 999, condition: 'Good' },
    { brand: 'Google Pixel', model: 'Pixel 8 Pro', age: '6 to 12 months', repairability: 7, replacementEst: 749, condition: 'Good' },
    { brand: 'OnePlus', model: 'OnePlus 12', age: 'Less than 6 months', repairability: 6, replacementEst: 699, condition: 'Good' },
    { brand: 'Xiaomi', model: 'Xiaomi 14 Ultra', age: 'Less than 6 months', repairability: 6, replacementEst: 799, condition: 'Fair' },
  ];

  const symptomTags = [
    'Shattered Cover Glass',
    'AMOLED Matrix Lines / Bleed',
    'Battery Health Under 75%',
    'Swollen Battery Pouch',
    'Liquid Sensor Tripped',
    'USB-C Port Intermittent',
    'Face ID Dot Projector Fault',
    'Camera Lens Cracked',
  ];

  const brandOptions = [
    'Apple',
    'Samsung',
    'Google Pixel',
    'OnePlus',
    'Xiaomi',
    'Motorola',
    'Nothing',
    'Sony',
    'Oppo / Vivo',
    'Other Brand',
  ];

  const conditionOptions = [
    'Pristine',
    'Good',
    'Fair',
    'Heavily Used',
    'Cracked / Damaged',
  ];

  const warrantyOptions = [
    'AppleCare+ / Care Plan',
    'Under Warranty',
    'Third-Party Warranty',
    'Expired',
    'Unknown',
  ];

  const ageOptions = [
    'Less than 6 months',
    '6 to 12 months',
    '1 to 2 years',
    '2 to 3 years',
    '3 to 4 years',
    '4+ years',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      brand: preset.brand,
      model: preset.model,
      deviceAge: preset.age,
      condition: preset.condition,
    }));
  };

  const addSymptom = (symptom) => {
    setFormData((prev) => {
      const current = prev.problemDescription.trim();
      if (!current) return { ...prev, problemDescription: symptom };
      if (current.includes(symptom)) return prev;
      return { ...prev, problemDescription: `${current}. Reported: ${symptom}.` };
    });
  };

  const handleReset = () => {
    setFormData(initialForm);
    setSuccessResult(null);
    setErrorResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessResult(null);
    setErrorResult(null);

    if (!formData.brand.trim() || !formData.model.trim() || !formData.problemDescription.trim()) {
      setErrorResult('Please complete all required fields (brand, model, and problem description).');
      setLoading(false);
      return;
    }

    if (formData.problemDescription.trim().length < 10) {
      setErrorResult('Problem description must be at least 10 characters long.');
      setLoading(false);
      return;
    }

    try {
      const result = await deviceService.createDevice(formData);
      const savedId = result?.device?._id || result?._id || `DEV-${Math.floor(1000 + Math.random() * 9000)}`;

      setSuccessResult({
        message: 'Your phone details are saved. Next, add a photo of the damage.',
        device: { id: savedId, brand: formData.brand, model: formData.model },
      });

      sessionStorage.setItem('current_device', JSON.stringify({ id: savedId, ...formData }));
    } catch (err) {
      const mockId = `DEV-${Math.floor(1000 + Math.random() * 9000)}`;
      sessionStorage.setItem('current_device', JSON.stringify({ id: mockId, ...formData }));
      setSuccessResult({
        message: 'Your phone details are saved on this device. Next, add a photo of the damage.',
        device: { id: mockId, brand: formData.brand, model: formData.model }
      });
    } finally {
      setLoading(false);
    }
  };

  const isCovered = formData.warrantyStatus.includes('Warranty') || formData.warrantyStatus.includes('Care');

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Intro */}
      <div>
        <p className="text-[13px] uppercase tracking-[0.16em] text-[#0d4a3e]">Step 1 of 3</p>
        <h2 className="mt-1 text-[1.9rem] font-medium tracking-tight text-[#16201d]">Tell us about your phone</h2>
        <p className="mt-1 text-slate-500">
          A few details about your phone and what&rsquo;s wrong help us work out whether a repair is worth it.
        </p>
      </div>

      {/* Quick fill */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <Sparkles className="h-4 w-4 text-[#0d5b46]" />
            Quick fill
          </h3>
          <span className="text-sm text-slate-500">Pick a popular phone to fill in the basics</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {flagshipPresets.map((preset, idx) => {
            const selected = formData.brand === preset.brand && formData.model === preset.model;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                aria-pressed={selected}
                className={`inline-flex items-center gap-1.5 ${chipCls(selected)}`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                {preset.model}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Feedback */}
      {errorResult && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Something&rsquo;s missing</p>
            <p className="mt-0.5 text-sm">{errorResult}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorResult(null)}
            aria-label="Dismiss"
            className="flex-shrink-0 rounded-full p-1 transition hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successResult && (
        <section className="relative min-w-0 overflow-hidden rounded-[28px] bg-[#0d2f27] p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#2feaa8]/15 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <CircleCheck className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#2feaa8]" />
              <div className="min-w-0">
                <p className="text-lg font-medium">{successResult.message}</p>
                <p className="mt-1 truncate text-sm text-white/60">
                  {successResult.device.brand} {successResult.device.model} · Reference{' '}
                  <span className="tabular-nums text-[#7fffd4]">{successResult.device.id}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/analysis')}
              className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-full bg-[#2feaa8] px-5 py-3 text-sm font-medium text-[#0b2a23] transition hover:bg-[#7fffd4]"
            >
              Continue to photo check <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <Card className="p-6 sm:p-8 lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900">Your phone</h3>
              <p className="mt-1 text-sm text-slate-500">Fields marked * are required.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="brand" className={labelCls}>
                  Brand<Required />
                </label>
                <select id="brand" name="brand" value={formData.brand} onChange={handleChange} className={inputCls} required>
                  <option value="">Choose a brand</option>
                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label htmlFor="model" className={labelCls}>
                  Model<Required />
                </label>
                <input
                  id="model"
                  type="text"
                  name="model"
                  placeholder="e.g. Galaxy S24 Ultra 512GB"
                  value={formData.model}
                  onChange={handleChange}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="min-w-0">
                <label htmlFor="deviceAge" className={labelCls}>How old is it?</label>
                <select id="deviceAge" name="deviceAge" value={formData.deviceAge} onChange={handleChange} className={inputCls}>
                  {ageOptions.map((age) => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label htmlFor="condition" className={labelCls}>Overall condition</label>
                <select id="condition" name="condition" value={formData.condition} onChange={handleChange} className={inputCls}>
                  {conditionOptions.map((cond) => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label htmlFor="warrantyStatus" className={labelCls}>Warranty</label>
                <select id="warrantyStatus" name="warrantyStatus" value={formData.warrantyStatus} onChange={handleChange} className={inputCls}>
                  {warrantyOptions.map((warr) => (
                    <option key={warr} value={warr}>{warr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor="problemDescription" className="text-lg font-medium text-slate-900">
                  What&rsquo;s wrong?<Required />
                </label>
                <span className="text-xs tabular-nums text-slate-400">
                  {formData.problemDescription.length} characters
                </span>
              </div>
              <p className="text-sm text-slate-500">Tap any that apply, then add anything else in your own words.</p>

              <div className="flex flex-wrap gap-2">
                {symptomTags.map((tag, i) => {
                  const added = formData.problemDescription.includes(tag);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addSymptom(tag)}
                      aria-pressed={added}
                      className={chipCls(added)}
                    >
                      {added ? '✓' : '+'} {tag}
                    </button>
                  );
                })}
              </div>

              <textarea
                id="problemDescription"
                name="problemDescription"
                rows={5}
                placeholder="e.g. The screen cracked after a drop, touch still works, and the battery drains from 100% to 20% in an hour…"
                value={formData.problemDescription}
                onChange={handleChange}
                className={`${inputCls} leading-relaxed`}
                required
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Start over
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0d5b46] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0a4a39] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    Save and continue <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>

        {/* Sidebar */}
        <div className="min-w-0 space-y-6 lg:col-span-4">
          <Card className="p-6 sm:p-7">
            <p className="text-[13px] uppercase tracking-[0.16em] text-slate-500">Your summary</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#e3f1ec] text-[#0d4a3e]">
                <Smartphone className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-[#16201d]">{formData.model || 'No model yet'}</p>
                <p className="truncate text-sm text-slate-500">{formData.brand || 'No brand chosen'}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex-shrink-0 text-slate-500">Age</dt>
                <dd className="min-w-0 truncate text-right text-slate-800">{formData.deviceAge}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex-shrink-0 text-slate-500">Condition</dt>
                <dd className="min-w-0 truncate text-right text-slate-800">{formData.condition}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex-shrink-0 text-slate-500">Warranty</dt>
                <dd className="min-w-0 truncate text-right text-slate-800">{formData.warrantyStatus}</dd>
              </div>
            </dl>
            <div
              className={`mt-5 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
                isCovered ? 'bg-[#eef6f2] text-slate-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isCovered ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0d4a3e]" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              )}
              <p>
                {isCovered
                  ? 'You may be covered. Check with the manufacturer before paying for a repair.'
                  : 'No active cover, so you would likely pay for the repair yourself.'}
              </p>
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <h3 className="flex items-center gap-2 text-lg font-medium text-slate-900">
              <Scale className="h-4 w-4 text-[#0d5b46]" />
              How we weigh it
            </h3>
            <p className="mt-1 text-sm text-slate-500">What goes into your repair score.</p>
            <ul className="mt-5 space-y-4">
              {scoringWeights.map(({ label, pct }) => (
                <li key={label}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 text-slate-700">{label}</span>
                    <span className="tabular-nums text-slate-500">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-[#0d5b46]" style={{ width: `${(pct / 35) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-slate-400">
              Your details are shared with our AI (Google Gemini) to assess the damage and find similar repair cases.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetails;
