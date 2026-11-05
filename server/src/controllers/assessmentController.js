import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';
import { computeDecision } from './repairController.js';
import { normalizeDeviceType } from '../config/deviceTypes.js';

const dbUnavailable = (res) =>
    res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify your MONGODB_URI configuration in server/.env.',
    });

const isDbReady = () => mongoose.connection.readyState === 1;

const num = (v) => Math.max(0, Math.round(Number(v) || 0));

/** Keeps only the quote fields we store, with rupee amounts as whole numbers. */
const cleanQuote = (q) => {
    if (!q || typeof q !== 'object') return null;
    const quote = {
        parts: num(q.parts),
        labour: num(q.labour),
        diagnostic: num(q.diagnostic),
        tax: num(q.tax),
        shopName: q.shopName || null,
        fileName: q.fileName || null,
        notes: q.notes || null,
    };
    quote.total = quote.parts + quote.labour + quote.diagnostic + quote.tax;
    return quote;
};

/**
 * Create an assessment (a "case") when the user adds a device.
 * POST /api/assessments
 */
export const createAssessment = async (req, res, next) => {
    try {
        if (!isDbReady()) return dbUnavailable(res);

        const { userId, deviceId, deviceType, brand, model, deviceAge, condition, warrantyStatus, problemDescription, metadata } = req.body;

        if (!brand || !model) {
            return res.status(400).json({ success: false, message: 'Brand and model are required.' });
        }

        const assessment = await Assessment.create({
            userId: userId || 'demo',
            deviceId: deviceId && mongoose.Types.ObjectId.isValid(deviceId) ? new mongoose.Types.ObjectId(deviceId) : null,
            deviceType: normalizeDeviceType(deviceType),
            brand,
            model,
            deviceAge: deviceAge || '1 to 2 years',
            condition: condition || 'Good',
            warrantyStatus: warrantyStatus || 'Unknown',
            problemDescription: problemDescription || '',
            status: 'IN_PROGRESS',
            metadata: metadata || {},
        });

        res.status(201).json({ success: true, message: 'Assessment created.', assessment, data: assessment });
    } catch (error) {
        next(error);
    }
};

/**
 * List a user's assessments, newest first.
 * GET /api/assessments?userId=&status=&limit=
 */
export const getAssessments = async (req, res, next) => {
    try {
        if (!isDbReady()) return dbUnavailable(res);

        const { userId, status, limit } = req.query;
        const query = {};
        if (userId) query.userId = userId;
        if (status) query.status = status;

        const assessments = await Assessment.find(query)
            .sort({ updatedAt: -1 })
            .limit(Math.min(Number(limit) || 200, 500))
            .lean();

        res.status(200).json({ success: true, count: assessments.length, assessments, data: assessments });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/assessments/:id
 */
export const getAssessmentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid assessment ID format.' });
        }
        if (!isDbReady()) return dbUnavailable(res);

        const assessment = await Assessment.findById(id).lean();
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found.' });
        }

        res.status(200).json({ success: true, assessment, data: assessment });
    } catch (error) {
        next(error);
    }
};

/**
 * Save progress on a case (photo findings, quote, estimate, prices).
 * With { finalize: true } the server computes the Repair Score and marks the case COMPLETE.
 * PATCH /api/assessments/:id
 */
export const updateAssessment = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid assessment ID format.' });
        }
        if (!isDbReady()) return dbUnavailable(res);

        const assessment = await Assessment.findById(id);
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found.' });
        }

        const body = req.body || {};
        if (body.vision !== undefined) assessment.vision = body.vision;
        if (body.estimate !== undefined) assessment.estimate = body.estimate;
        if (body.quote !== undefined) {
            assessment.quote = cleanQuote(body.quote);
            if (assessment.quote) assessment.repairCost = assessment.quote.total;
        }
        if (body.repairCost !== undefined) assessment.repairCost = num(body.repairCost);
        if (body.replacementCost !== undefined) assessment.replacementCost = num(body.replacementCost);

        if (body.finalize) {
            if (!assessment.repairCost || !assessment.replacementCost) {
                return res.status(400).json({
                    success: false,
                    message: 'Add the repair quote and the price of a new replacement before saving the decision.',
                });
            }
            const decision = computeDecision({
                repairCost: assessment.repairCost,
                replacementCost: assessment.replacementCost,
                deviceAge: assessment.deviceAge,
                condition: assessment.condition,
                warrantyStatus: assessment.warrantyStatus,
                repairability: assessment.estimate?.repairability ?? null,
                deviceType: assessment.deviceType,
                brand: assessment.brand,
                model: assessment.model,
            });
            assessment.score = decision.score;
            assessment.verdict = decision.verdict;
            assessment.recommendation = decision.recommendation;
            assessment.financials = decision.financials;
            assessment.factors = decision.factors;
            assessment.status = 'COMPLETE';
            assessment.completedAt = new Date();
        }

        assessment.markModified('vision');
        assessment.markModified('quote');
        assessment.markModified('estimate');
        await assessment.save();

        res.status(200).json({ success: true, message: body.finalize ? 'Decision saved.' : 'Progress saved.', assessment, data: assessment });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/assessments/:id
 */
export const deleteAssessment = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid assessment ID format.' });
        }
        if (!isDbReady()) return dbUnavailable(res);

        const deleted = await Assessment.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Assessment not found.' });

        res.status(200).json({ success: true, message: 'Assessment deleted.' });
    } catch (error) {
        next(error);
    }
};

/** Aggregates totals for a set of assessments. */
const summarise = async (match) => {
    const [row] = await Assessment.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                complete: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETE'] }, 1, 0] } },
                repaired: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'COMPLETE'] }, { $eq: ['$verdict', 'REPAIR'] }] }, 1, 0] } },
                moneyKept: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ['$status', 'COMPLETE'] }, { $eq: ['$verdict', 'REPAIR'] }] },
                            { $max: [0, { $subtract: ['$replacementCost', '$repairCost'] }] },
                            0,
                        ],
                    },
                },
                scoreSum: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETE'] }, '$score', 0] } },
                repairUsers: {
                    $addToSet: { $cond: [{ $and: [{ $eq: ['$status', 'COMPLETE'] }, { $eq: ['$verdict', 'REPAIR'] }] }, '$userId', '$$REMOVE'] },
                },
            },
        },
    ]);

    const r = row || { total: 0, complete: 0, repaired: 0, moneyKept: 0, scoreSum: 0, repairUsers: [] };
    return {
        total: r.total,
        complete: r.complete,
        inProgress: r.total - r.complete,
        repaired: r.repaired,
        repairShare: r.complete ? Math.round((r.repaired / r.complete) * 100) : 0,
        avgScore: r.complete ? Math.round((r.scoreSum / r.complete) * 10) / 10 : null,
        moneyKept: Math.round(r.moneyKept),
        avgKeptPerUser: r.repairUsers.length ? Math.round(r.moneyKept / r.repairUsers.length) : 0,
    };
};

/**
 * Personal and platform-wide impact figures.
 * GET /api/assessments/stats?userId=
 */
export const getAssessmentStats = async (req, res, next) => {
    try {
        if (!isDbReady()) return dbUnavailable(res);

        const { userId } = req.query;
        const now = new Date();
        const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [personal, platform, thisMonth, lastMonth] = await Promise.all([
            userId ? summarise({ userId }) : null,
            summarise({}),
            Assessment.countDocuments({ status: 'COMPLETE', completedAt: { $gte: startThisMonth } }),
            Assessment.countDocuments({ status: 'COMPLETE', completedAt: { $gte: startLastMonth, $lt: startThisMonth } }),
        ]);

        res.status(200).json({
            success: true,
            personal,
            platform: {
                ...platform,
                decisionsThisMonth: thisMonth,
                decisionsLastMonth: lastMonth,
                monthTrendPct: lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null,
            },
        });
    } catch (error) {
        next(error);
    }
};

export default {
    createAssessment,
    getAssessments,
    getAssessmentById,
    updateAssessment,
    deleteAssessment,
    getAssessmentStats,
};
