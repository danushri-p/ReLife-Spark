import Assessment from '../models/Assessment.js';
import mongoose from 'mongoose';

export const createAssessment = async (req, res, next) => {
    try {
        const {
            userId,
            deviceId,
            brand,
            model,
            deviceAge,
            condition,
            warrantyStatus,
            problemDescription,
            repairCost,
            replacementCost,
            score,
            verdict,
            recommendation,
            financials,
            factors,
            metadata,
        } = req.body;

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database is not connected. Please verify your MONGODB_URI configuration in server/.env.',
            });
        }

        const assessment = await Assessment.create({
            userId: userId || 'demo',
            deviceId: deviceId && mongoose.Types.ObjectId.isValid(deviceId) ? new mongoose.Types.ObjectId(deviceId) : null,
            brand: brand || 'Unknown',
            model: model || 'Unknown',
            deviceAge: deviceAge || '1 to 2 years',
            condition: condition || 'Good',
            warrantyStatus: warrantyStatus || 'Unknown',
            problemDescription: problemDescription || '',
            repairCost: Number(repairCost) || 0,
            replacementCost: Number(replacementCost) || 0,
            score: Number(score) || 0,
            verdict: ['REPAIR', 'EITHER', 'REPLACE'].includes(verdict) ? verdict : 'EITHER',
            recommendation: recommendation || {
                badge: 'REPAIR RECOMMENDED',
                verdict: 'REPAIR',
                summary: '',
                action: '',
            },
            financials: financials || {
                repairCost: Number(repairCost) || 0,
                replacementCost: Number(replacementCost) || 0,
                savings: 0,
                costRatio: 0,
            },
            factors: factors || [],
            metadata: metadata || {},
        });

        res.status(201).json({
            success: true,
            message: 'Assessment saved successfully.',
            assessment,
            data: assessment,
        });
    } catch (error) {
        next(error);
    }
};

export const getAssessments = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database is not connected. Please verify your MONGODB_URI configuration in server/.env.',
            });
        }

        const { userId } = req.query;
        const query = userId ? { userId } : {};

        const assessments = await Assessment.find(query)
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: assessments.length,
            assessments,
            data: assessments,
        });
    } catch (error) {
        next(error);
    }
};

export const getAssessmentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assessment ID format.',
            });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database is not connected. Please verify your MONGODB_URI configuration in server/.env.',
            });
        }

        const assessment = await Assessment.findById(id).lean();

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found.',
            });
        }

        res.status(200).json({
            success: true,
            assessment,
            data: assessment,
        });
    } catch (error) {
        next(error);
    }
};

export default {
    createAssessment,
    getAssessments,
    getAssessmentById,
};
