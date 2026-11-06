import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';
import geminiService from '../services/geminiService.js';
import { deviceNoun, normalizeDeviceType } from '../config/deviceTypes.js';
import { searchKnowledgeBase } from '../services/knowledgeBaseService.js';

/* ───────── scoring (shared by /repair/analyze and saving an assessment) ───────── */

const normalizeWarranty = (value) => {
  if (!value) return 'Unknown';
  const sanitized = String(value).trim();
  if (sanitized.includes('Care')) return 'AppleCare+ / Care Plan';
  return sanitized;
};

/** Formats a number as Indian Rupees, e.g. 129900 -> ₹1,29,900. */
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const scoreFactorCost = (repairCost, replacementCost) => {
  if (!replacementCost || Number(replacementCost) <= 0) return 50;
  const ratio = (Number(repairCost) / Number(replacementCost)) * 100;
  return Math.max(0, Math.min(100, Math.round(100 - ratio * 1.35)));
};

const AGE_SCORES = {
  'Less than 6 months': 95,
  '6 to 12 months': 85,
  '1 to 2 years': 70,
  '2 to 3 years': 50,
  '3 to 4 years': 30,
  '4+ years': 15,
};

const WARRANTY_SCORES = {
  'AppleCare+ / Care Plan': 95,
  'Under Warranty': 90,
  'Third-Party Warranty': 75,
  Expired: 45,
  Unknown: 40,
};

const CONDITION_SCORES = {
  Pristine: 95,
  Good: 80,
  Fair: 60,
  'Heavily Used': 40,
  'Cracked / Damaged': 30,
};

/** Default repairability when no model-specific estimate is available. */
const DEFAULT_REPAIRABILITY = 70;

const getRecommendation = (score, device, repairCost, replacementCost, costRatio) => {
  const noun = deviceNoun(device.deviceType);
  const name = [device.brand, device.model].filter(Boolean).join(' ') || `this ${noun}`;
  if (score >= 60) {
    return {
      badge: 'REPAIR RECOMMENDED',
      verdict: 'REPAIR',
      summary: `Repairing your ${name} offers strong value. With repair at ${inr(repairCost)} versus a ${inr(replacementCost)} replacement, you keep ${inr(Math.max(0, replacementCost - repairCost))} while avoiding unnecessary e-waste.`,
      action: 'Go ahead with the repair at a verified technician.',
    };
  }
  if (score >= 40) {
    return {
      badge: 'CONSIDER EITHER',
      verdict: 'EITHER',
      summary: `The decision is borderline. Repairing your ${name} costs ${costRatio}% of a new ${noun}, so negotiating the quote or a trade-in may be the better route depending on how long you plan to keep it.`,
      action: 'Negotiate the quote and compare trade-in values before committing.',
    };
  }
  return {
    badge: 'REPLACE RECOMMENDED',
    verdict: 'REPLACE',
    summary: `Replacing is the better financial choice. Repairing your ${name} would cost ${inr(repairCost)} against a ${inr(replacementCost)} replacement, which is poor value for the ${noun}'s remaining life.`,
    action: `Look at a certified refurbished ${noun} or official trade-in programmes.`,
  };
};

/** Computes the Repair Score, verdict, recommendation, financials and factor breakdown. */
export const computeDecision = ({ repairCost, replacementCost, deviceAge, condition, warrantyStatus, repairability, deviceType, brand, model }) => {
  const safeRepairCost = Math.max(0, Number(repairCost) || 0);
  const safeReplacementCost = Math.max(0, Number(replacementCost) || 0);
  const warranty = normalizeWarranty(warrantyStatus);
  const repairabilityScore = Number.isFinite(Number(repairability)) && repairability !== null ? Number(repairability) : DEFAULT_REPAIRABILITY;

  const costScore = scoreFactorCost(safeRepairCost, safeReplacementCost);
  const ageScore = AGE_SCORES[deviceAge] ?? 75;
  const warrantyScore = WARRANTY_SCORES[warranty] ?? 75;
  const conditionScore = CONDITION_SCORES[condition] ?? 80;

  const score = Math.round(costScore * 0.35 + ageScore * 0.25 + warrantyScore * 0.15 + repairabilityScore * 0.15 + conditionScore * 0.1);
  const costRatio = safeReplacementCost > 0 ? Math.round((safeRepairCost / safeReplacementCost) * 100) : 50;
  const recommendation = getRecommendation(score, { deviceType, brand, model }, safeRepairCost, safeReplacementCost, costRatio);

  const noun = deviceNoun(deviceType);
  return {
    score,
    verdict: recommendation.verdict,
    recommendation,
    financials: {
      repairCost: safeRepairCost,
      replacementCost: safeReplacementCost,
      savings: Math.max(0, safeReplacementCost - safeRepairCost),
      costRatio,
    },
    factors: [
      { label: `Cost compared with a new ${noun}`, weight: 35, score: costScore, note: `Repair is ${costRatio}% of the replacement price` },
      { label: `Age of the ${noun}`, weight: 25, score: ageScore, note: deviceAge || 'Unknown age' },
      { label: 'Warranty cover', weight: 15, score: warrantyScore, note: warranty },
      {
        label: 'How easy it is to repair',
        weight: 15,
        score: repairabilityScore,
        note: repairability !== null && repairability !== undefined ? `Estimated for the ${model || 'model'}` : `Typical for this kind of ${noun}`,
      },
      { label: 'Overall condition', weight: 10, score: conditionScore, note: condition || 'Unknown condition' },
    ],
  };
};

/**
 * Repair vs replacement analysis
 * POST /api/repair/analyze
 */
export const analyzeRepairDecision = async (req, res) => {
  try {
    const decision = computeDecision(req.body || {});
    res.status(200).json({
      success: true,
      ...decision,
      device: { id: req.body?.deviceId || null, deviceType: req.body?.deviceType || null, brand: req.body?.brand || null, model: req.body?.model || null },
      message: 'Repair decision analyzed successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to analyze repair decision.', error: error.message });
  }
};

/**
 * Typical local repair price, new-device price and shop questions for a device + fault.
 * Uses Gemini; falls back to the average of saved assessments for the same model.
 * POST /api/repair/estimate  { deviceType?, brand, model, problemDescription, findings? }
 */
export const estimateRepair = async (req, res, next) => {
  try {
    const { deviceType, brand, model, problemDescription, findings } = req.body || {};
    if (!brand || !model) {
      return res.status(400).json({ success: false, message: 'Brand and model are required for an estimate.' });
    }

    const damaged = Array.isArray(findings)
      ? findings.filter((f) => f && f.severity && f.severity !== 'Intact').map((f) => `${f.component} (${f.severity})`)
      : [];

    const ai = await geminiService.estimateRepair({
      deviceType: normalizeDeviceType(deviceType),
      brand,
      model,
      reportedProblem: problemDescription || undefined,
      damagedParts: damaged.length ? damaged : undefined,
    });

    // Community data: what people checking the same model actually got quoted.
    let community = null;
    if (mongoose.connection.readyState === 1) {
      const [agg] = await Assessment.aggregate([
        { $match: { brand, model, status: 'COMPLETE', repairCost: { $gt: 0 } } },
        { $group: { _id: null, avgRepair: { $avg: '$repairCost' }, avgReplace: { $avg: '$replacementCost' }, count: { $sum: 1 } } },
      ]);
      if (agg) {
        community = { avgRepairCost: Math.round(agg.avgRepair), avgReplacementCost: Math.round(agg.avgReplace) || null, count: agg.count };
      }
    }

    const estimate = ai.success ? ai.estimate : null;
    const typicalRepairCost = estimate?.typicalRepairCost ?? community?.avgRepairCost ?? null;
    const newPhonePrice = estimate?.newPhonePrice ?? community?.avgReplacementCost ?? null;

    res.status(200).json({
      success: true,
      source: estimate ? 'ai' : community ? 'community' : 'none',
      estimate: {
        typicalRepairCost,
        typicalRepairRange: estimate?.typicalRepairRange ?? null,
        newPhonePrice,
        newPhoneLabel: estimate?.newPhoneLabel ?? null,
        repairability: estimate?.repairability ?? null,
        lineRanges: estimate?.lineRanges ?? null,
        questions: estimate?.questions ?? [],
      },
      community,
      note: estimate ? null : `AI estimate unavailable: ${ai.error}`,
    });
  } catch (error) {
    next(error);
  }
};

/* ───────── "Why this verdict": explained from the repair guides (RAG), with sources ───────── */

const VERDICT_WORDS = { REPAIR: 'repair worth fixing', EITHER: 'repair or replacement trade-off', REPLACE: 'replacement replace upgrade' };

const plainText = (v) => String(v ?? '').replace(/[*_#`]+/g, '').replace(/\s+/g, ' ').trim();

/**
 * Explains a verdict the score already decided. The guides are retrieved for this device, fault and verdict,
 * and every point names the guide it came from. The AI never changes the verdict or the numbers.
 * POST /api/repair/explain  { verdict, score, deviceType, brand, model, problemDescription, warrantyStatus, deviceAge,
 *                             condition, repairCost, replacementCost, factors: [{ label, score, weight, note }] }
 */
export const explainVerdict = async (req, res, next) => {
  try {
    const b = req.body || {};
    const verdict = ['REPAIR', 'EITHER', 'REPLACE'].includes(b.verdict) ? b.verdict : null;
    if (!verdict) return res.status(400).json({ success: false, message: 'A verdict (REPAIR, EITHER or REPLACE) is required.' });

    const noun = deviceNoun(b.deviceType);
    const query = [b.problemDescription, VERDICT_WORDS[verdict], b.warrantyStatus, 'repair vs replacement decision', noun]
      .filter(Boolean)
      .join(' ');
    const guides = searchKnowledgeBase(query, 3);
    const sources = guides.map((g, i) => ({ id: i + 1, title: g.title, source: g.source, page: g.page }));

    const factors = Array.isArray(b.factors) ? b.factors.slice(0, 6) : [];
    let reply = null;

    if (geminiService.isConfigured() && guides.length) {
      const prompt = `
        You explain a repair decision to a customer in India. The decision is already made by a scoring formula:
        verdict ${verdict}, Repair Score ${Number(b.score) || 0}/100. Do not change the verdict or any number.

        Device: ${[b.brand, b.model].filter(Boolean).join(' ')} (${noun}), age ${b.deviceAge || 'unknown'}, condition ${b.condition || 'unknown'},
        warranty ${b.warrantyStatus || 'unknown'}. Problem: ${b.problemDescription || 'not described'}.
        Repair quote ₹${Number(b.repairCost) || 0}, new ${noun} ₹${Number(b.replacementCost) || 0}.
        Score factors: ${JSON.stringify(factors)}

        Repair guides (cite them by number):
        ${guides.map((g, i) => `[${i + 1}] ${g.title} (${g.source}, ${g.page}): ${g.summary} ${g.content}`).join('\n')}

        Reply with JSON only:
        {
          "summary": "one sentence (max 30 words) on why this verdict fits",
          "points": [{ "text": "one practical sentence (max 25 words)", "source": 1 }]
        }
        Give 3 points. Each point must be supported by the guide it cites ("source" is that guide's number).
        Plain text only, no Markdown, no asterisks. Use ₹ for money.
      `;
      const result = await Promise.race([
        geminiService.generateJson([prompt]),
        new Promise((resolve) => setTimeout(() => resolve(null), 30000)),
      ]);
      const d = result?.success ? result.data : null;
      if (d?.summary && Array.isArray(d.points)) {
        const points = d.points
          .map((p) => ({ text: plainText(p?.text), source: Number(p?.source) }))
          .filter((p) => p.text && sources.some((s) => s.id === p.source))
          .slice(0, 4);
        if (points.length) reply = { summary: plainText(d.summary), points, source: 'ai' };
      }
    }

    // Without AI: the strongest factors, each paired with the closest guide's own advice.
    if (!reply) {
      const ranked = [...factors].sort((a, z) => Math.abs((z.score ?? 50) - 50) * (z.weight ?? 1) - Math.abs((a.score ?? 50) - 50) * (a.weight ?? 1));
      reply = {
        summary:
          verdict === 'REPAIR'
            ? `Repair scores ${b.score}/100: fixing this ${noun} is the better value.`
            : verdict === 'REPLACE'
              ? `Repair scores ${b.score}/100: replacing this ${noun} is the better value.`
              : `Repair scores ${b.score}/100: either choice is reasonable, so compare carefully.`,
        points: guides.slice(0, 3).map((g, i) => ({
          text: plainText(`${ranked[i] ? `${ranked[i].label}: ${ranked[i].note}. ` : ''}${g.summary}`),
          source: i + 1,
        })),
        source: 'guides',
      };
    }

    res.status(200).json({ success: true, verdict, ...reply, sources });
  } catch (error) {
    next(error);
  }
};
