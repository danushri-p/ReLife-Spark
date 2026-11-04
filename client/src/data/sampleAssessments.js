/*
 * Sample assessments shown in the signed-in area until real history is stored.
 * Everything here is illustrative and is labelled "Sample" in the UI.
 */
export const sampleAssessments = [
  {
    id: 'a-1042',
    device: 'Samsung Galaxy S23',
    issue: 'Cracked front glass',
    date: '2026-11-02',
    score: 82,
    verdict: 'REPAIR',
    repairCost: 6500,
    replaceCost: 55000,
    status: 'Complete',
  },
  {
    id: 'a-1038',
    device: 'iPhone 13',
    issue: 'Battery drains quickly',
    date: '2026-10-28',
    score: 74,
    verdict: 'REPAIR',
    repairCost: 5200,
    replaceCost: 52000,
    status: 'Complete',
  },
  {
    id: 'a-1031',
    device: 'Pixel 6a',
    issue: 'Charging port loose',
    date: '2026-10-19',
    score: 51,
    verdict: 'EITHER',
    repairCost: 3800,
    replaceCost: 21000,
    status: 'Awaiting quote',
  },
  {
    id: 'a-1024',
    device: 'OnePlus 8T',
    issue: 'Display lines, liquid damage',
    date: '2026-10-07',
    score: 33,
    verdict: 'REPLACE',
    repairCost: 14500,
    replaceCost: 24000,
    status: 'Complete',
  },
];

// Workbench palette (matches VerdictBadge in components/app/ui.jsx)
export const verdictStyles = {
  REPAIR: 'bg-[#0d5b46] text-white',
  EITHER: 'bg-[#F5B83D]/25 text-[#7A5200]',
  REPLACE: 'bg-[#FF6B4A]/15 text-[#B23A1E]',
};

export const formatINR = (n) => `₹${n.toLocaleString('en-IN')}`;

export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
