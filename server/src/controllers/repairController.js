/**
 * Handle repair vs replacement analysis request
 * POST /api/repair/analyze
 */
const normalizeWarranty = (value) => {
  if (!value) return 'Unknown';
  const sanitized = String(value).trim();
  if (sanitized === 'AppleCare+ / Care Plan') return 'AppleCare+ / Care Plan';
  if (sanitized === 'Under Warranty') return 'Under Warranty';
  if (sanitized === 'Third-Party Warranty') return 'Third-Party Warranty';
  if (sanitized === 'Expired') return 'Expired';
  if (sanitized === 'Unknown') return 'Unknown';
  if (sanitized.includes('Care')) return 'AppleCare+ / Care Plan';
  return sanitized;
};

const normalizeAge = (value) => {
  if (!value) return '1 to 2 years';
  const sanitized = String(value).trim();
  return sanitized;
};

const scoreFactorCost = (repairCost, replacementCost) => {
  if (!replacementCost || Number(replacementCost) <= 0) return 50;
  const ratio = (Number(repairCost) / Number(replacementCost)) * 100;
  return Math.max(0, Math.min(100, Math.round(100 - ratio * 1.35)));
};

const scoreFactorAge = (deviceAge) => {
  const ageMap = {
    'Less than 6 months': 95,
    '6 to 12 months': 85,
    '1 to 2 years': 70,
    '2 to 3 years': 50,
    '3 to 4 years': 30,
    '4+ years': 15,
    'Less than 1 year': 85,
  };
  return ageMap[deviceAge] || 75;
};

const scoreFactorWarranty = (warrantyStatus) => {
  const warrantyMap = {
    'AppleCare+ / Care Plan': 95,
    'Under Warranty': 90,
    'Third-Party Warranty': 75,
    'Expired': 45,
    Unknown: 40,
  };

  const normalized = normalizeWarranty(warrantyStatus);
  return warrantyMap[normalized] || 75;
};

const scoreFactorRepairability = () => 70;

const scoreFactorCondition = (condition) => {
  const conditionMap = {
    Pristine: 95,
    Good: 80,
    Fair: 60,
    'Heavily Used': 40,
    'Cracked / Damaged': 30,
  };

  return conditionMap[condition] || 80;
};

const getRecommendation = (score, repairCost, replacementCost) => {
  if (score >= 60) {
    return {
      badge: 'REPAIR RECOMMENDED',
      verdict: 'REPAIR',
      summary: `Repairing this device offers a strong economic and practical advantage. With repair estimated at $${repairCost} versus an $${replacementCost} replacement, you retain $${Math.max(0, replacementCost - repairCost)} in value while reducing e-waste.`,
      action: 'Proceed to authorize repair with a verified technician.',
    };
  }

  if (score >= 40) {
    return {
      badge: 'CONSIDER EITHER',
      verdict: 'EITHER',
      summary: `The decision is borderline. Repair costs are a meaningful share of replacement value, so a negotiated quote or trade-in may be a better route depending on how long you plan to keep the phone.`,
      action: 'Negotiate the quotation and compare trade-in values before committing.',
    };
  }

  return {
    badge: 'REPLACE RECOMMENDED',
    verdict: 'REPLACE',
    summary: `Replacement is the financially sound strategy. Repairing this device is likely too expensive relative to residual value, especially if the damage is severe or the phone is older.`,
    action: 'Explore certified refurbished replacements or official trade-in programs.',
  };
};

export const analyzeRepairDecision = async (req, res) => {
  try {
    const {
      deviceId,
      repairCost,
      replacementCost,
      deviceAge,
      condition,
      warrantyStatus,
      brand,
      model,
    } = req.body;

    const safeRepairCost = Number(repairCost) || 0;
    const safeReplacementCost = Number(replacementCost) || 0;

    const costScore = scoreFactorCost(safeRepairCost, safeReplacementCost);
    const ageScore = scoreFactorAge(deviceAge || '1 to 2 years');
    const warrantyScore = scoreFactorWarranty(warrantyStatus || 'Unknown');
    const repairabilityScore = scoreFactorRepairability();
    const conditionScore = scoreFactorCondition(condition || 'Good');

    const score = Math.round(
      costScore * 0.35 +
      ageScore * 0.25 +
      warrantyScore * 0.15 +
      repairabilityScore * 0.15 +
      conditionScore * 0.1
    );

    const recommendation = getRecommendation(score, safeRepairCost, safeReplacementCost);
    const savings = Math.max(0, safeReplacementCost - safeRepairCost);
    const costRatio = safeReplacementCost > 0 ? Math.round((safeRepairCost / safeReplacementCost) * 100) : 50;

    res.status(200).json({
      success: true,
      score,
      verdict: recommendation.verdict,
      recommendation,
      device: {
        id: deviceId || null,
        brand: brand || null,
        model: model || null,
      },
      financials: {
        repairCost: safeRepairCost,
        replacementCost: safeReplacementCost,
        savings,
        costRatio,
      },
      factors: [
        {
          label: 'Cost compared with a new phone',
          weight: 35,
          score: costScore,
          note: `Repair is ${costRatio}% of the replacement price`,
        },
        {
          label: 'Age of the phone',
          weight: 25,
          score: ageScore,
          note: normalizeAge(deviceAge),
        },
        {
          label: 'Warranty cover',
          weight: 15,
          score: warrantyScore,
          note: normalizeWarranty(warrantyStatus),
        },
        {
          label: 'How easy it is to repair',
          weight: 15,
          score: repairabilityScore,
          note: 'Based on typical parts availability',
        },
        {
          label: 'Overall condition',
          weight: 10,
          score: conditionScore,
          note: condition || 'Good',
        },
      ],
      message: 'Repair decision analyzed successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to analyze repair decision.',
      error: error.message,
    });
  }
};

