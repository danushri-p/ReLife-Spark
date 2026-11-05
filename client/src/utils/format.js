// Workbench palette (matches VerdictBadge in components/app/ui.jsx)
export const verdictStyles = {
  REPAIR: 'bg-[#0d5b46] text-white',
  EITHER: 'bg-[#F5B83D]/25 text-[#7A5200]',
  REPLACE: 'bg-[#FF6B4A]/15 text-[#B23A1E]',
};

/** ₹ with Indian digit grouping, e.g. 129900 → ₹1,29,900. Shows an em dash for missing values. */
export const formatINR = (n) => (n === null || n === undefined || Number.isNaN(Number(n)) ? '—' : `₹${Math.round(Number(n)).toLocaleString('en-IN')}`);

/** Short date such as "5 Nov". Accepts ISO timestamps or Date objects. */
export const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** "Apple iPhone 15 Pro", "Dell XPS 13", … from an assessment. */
export const deviceName = (a) => [a?.brand, a?.model].filter(Boolean).join(' ') || 'Unknown device';

/** First sentence (or first ~70 chars) of the reported problem. */
export const shortIssue = (text) => {
  const t = String(text || '').trim();
  if (!t) return 'No description';
  const first = t.split(/(?<=[.!?])\s/)[0];
  return first.length > 70 ? `${first.slice(0, 67)}…` : first;
};

/** Short case reference from a Mongo id, e.g. "A1B2C3". */
export const caseRef = (id) => String(id || '').slice(-6).toUpperCase();

/** Where a case is in the flow, derived from what has been saved. */
export const caseProgress = (a) => {
  const photo = Boolean(a?.vision?.findings?.length);
  const quote = Boolean(a?.quote?.total);
  const decided = a?.status === 'COMPLETE';
  return {
    photo,
    quote,
    decided,
    label: decided ? 'Complete' : !photo ? 'Awaiting photo' : !quote ? 'Awaiting quote' : 'Awaiting decision',
  };
};
