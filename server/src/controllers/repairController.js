import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';
import geminiService from '../services/geminiService.js';
import { deviceNoun, normalizeDeviceType } from '../config/deviceTypes.js';

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
        questions: estimate?.questions ?? [],
      },
      community,
      note: estimate ? null : `AI estimate unavailable: ${ai.error}`,
    });
  } catch (error) {
    next(error);
  }
};
