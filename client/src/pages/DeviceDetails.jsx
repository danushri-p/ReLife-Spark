import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  ArrowRight,
  CircleCheck,
  TriangleAlert,
  X,
  ShieldCheck,
  Scale,
  Info,
  LoaderCircle,
} from 'lucide-react';
import deviceService from '../services/deviceService';
import assessmentService, { CURRENT_CASE_KEY } from '../services/assessmentService';
import { useAuth } from '../context/AuthContext';
import { caseRef } from '../utils/format';
import { DEVICE_TYPES, DEFAULT_DEVICE_TYPE, getDeviceType } from '../data/deviceTypes';

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
  { label: 'Repair cost vs. buying new', pct: 35 },
  { label: 'How old the device is', pct: 25 },
  { label: 'Warranty cover', pct: 15 },
  { label: 'How easy it is to repair', pct: 15 },
  { label: 'Overall condition', pct: 10 },
];

export const DeviceDetails = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialForm = {
    deviceType: DEFAULT_DEVICE_TYPE,
    brand: '',
    model: '',
    deviceAge: '',
    condition: '',
    warrantyStatus: '',
    problemDescription: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorResult, setErrorResult] = useState(null);



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

  const typeInfo = getDeviceType(formData.deviceType);
  const symptomTags = typeInfo.symptoms;
  const brandOptions = typeInfo.brands;
  const TypeIcon = typeInfo.icon;

  /** Switching device type keeps the brand only if it also makes that kind of device. */
  const chooseType = (value) => {
    setFormData((prev) =>
      prev.deviceType === value
        ? prev
        : { ...prev, deviceType: value, brand: getDeviceType(value).brands.includes(prev.brand) ? prev.brand : '' }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (
      !formData.brand.trim() ||
      !formData.model.trim() ||
      !formData.deviceAge ||
      !formData.condition ||
      !formData.warrantyStatus ||
      !formData.problemDescription.trim()
    ) {
      setErrorResult('Please complete all required fields.');
      setLoading(false);
      return;
    }

    if (formData.problemDescription.trim().length < 10) {
      setErrorResult('Problem description must be at least 10 characters long.');
      setLoading(false);
      return;
    }

    try {
      const deviceRes = await deviceService.createDevice(formData);
      const deviceId = deviceRes?.device?._id || deviceRes?._id || null;

      const caseRes = await assessmentService.create({ ...formData, deviceId, userId: user?.id });
      const caseId = caseRes?.assessment?._id;
      if (!caseId) throw new Error('The server did not return a case id.');

      sessionStorage.setItem(CURRENT_CASE_KEY, caseId);
      setSuccessResult({
        message: `Your ${typeInfo.noun} details are saved. Next, add a photo of the damage.`,
        device: { id: caseId, brand: formData.brand, model: formData.model },
      });
    } catch (err) {
      const details = Array.isArray(err?.errors) ? err.errors.map((e) => e.message || e.msg).filter(Boolean).join(' ') : '';
      setErrorResult(`${err?.message || 'Could not save your device details.'}${details ? ` ${details}` : ''}`);
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
        <h2 className="mt-1 text-[1.9rem] font-medium tracking-tight text-[#16201d]">Tell us about your device</h2>
        <p className="mt-1 text-slate-500">
          A few details about your device and what&rsquo;s wrong help us work out whether a repair is worth it.
        </p>
      </div>

      {/* Feedback */}
      {errorResult && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Couldn&rsquo;t save yet</p>
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
                  {successResult.device.brand} {successResult.device.model} · Case{' '}
                  <span className="tabular-nums text-[#7fffd4]">#{caseRef(successResult.device.id)}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/analysis?id=${successResult.device.id}`)}
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
              <h3 className="text-lg font-medium text-slate-900">Your device</h3>
              <p className="mt-1 text-sm text-slate-500">Fields marked * are required.</p>
            </div>

            <fieldset className="min-w-0">
              <legend className={labelCls}>
                What kind of device?<Required />
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {DEVICE_TYPES.map(({ value, icon: Icon }) => {
                  const selected = formData.deviceType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => chooseType(value)}
                      aria-pressed={selected}
                      className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-xs transition ${
                        selected
                          ? 'border-[#0d5b46]/40 bg-[#e3f1ec] text-[#0d4a3e]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-[#0d5b46]/30 hover:text-[#0d4a3e]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="leading-tight">{value}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="brand" className={labelCls}>
                  Brand<Required />
                </label>
                <input
                  id="brand"
                  type="text"
                  name="brand"
                  list="brand-options"
                  autoComplete="off"
                  placeholder={brandOptions.length ? `e.g. ${brandOptions.slice(0, 2).join(', ')}` : 'Who made it?'}
                  value={formData.brand}
                  onChange={handleChange}
                  className={inputCls}
                  maxLength={50}
                  required
                />
                <datalist id="brand-options">
                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
              </div>

              <div className="min-w-0">
                <label htmlFor="model" className={labelCls}>
                  Model<Required />
                </label>
                <input
                  id="model"
                  type="text"
                  name="model"
                  placeholder={typeInfo.modelPlaceholder}
                  value={formData.model}
                  onChange={handleChange}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="min-w-0">
                <label htmlFor="deviceAge" className={labelCls}>How old is it?<Required /></label>
                <select id="deviceAge" name="deviceAge" value={formData.deviceAge} onChange={handleChange} className={inputCls} required>
                  <option value="">Choose…</option>
                  {ageOptions.map((age) => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label htmlFor="condition" className={labelCls}>Overall condition<Required /></label>
                <select id="condition" name="condition" value={formData.condition} onChange={handleChange} className={inputCls} required>
                  <option value="">Choose…</option>
                  {conditionOptions.map((cond) => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label htmlFor="warrantyStatus" className={labelCls}>Warranty<Required /></label>
                <select id="warrantyStatus" name="warrantyStatus" value={formData.warrantyStatus} onChange={handleChange} className={inputCls} required>
                  <option value="">Choose…</option>
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
                placeholder="e.g. It stopped working after a drop, the screen is cracked, and the battery drains much faster than before…"
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
                <TypeIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-[#16201d]">{formData.model || 'No model yet'}</p>
                <p className="truncate text-sm text-slate-500">
                  {formData.deviceType} · {formData.brand || 'no brand yet'}
                </p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex-shrink-0 text-slate-500">Age</dt>
                <dd className="min-w-0 truncate text-right text-slate-800">{formData.deviceAge || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex-shrink-0 text-slate-500">Condition</dt>
                <dd className="min-w-0 truncate text-right text-slate-800">{formData.condition || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex-shrink-0 text-slate-500">Warranty</dt>
                <dd className="min-w-0 truncate text-right text-slate-800">{formData.warrantyStatus || '—'}</dd>
              </div>
            </dl>
            {formData.warrantyStatus && (
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
            )}
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
