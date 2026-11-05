import mongoose from 'mongoose';
import { DEVICE_TYPE_VALUES, DEFAULT_DEVICE_TYPE } from '../config/deviceTypes.js';

const assessmentSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            default: 'demo',
            trim: true,
            index: true,
        },
        deviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Device',
            default: null,
        },
        deviceType: {
            type: String,
            enum: DEVICE_TYPE_VALUES,
            default: DEFAULT_DEVICE_TYPE,
        },
        brand: {
            type: String,
            default: 'Unknown',
            trim: true,
        },
        model: {
            type: String,
            default: 'Unknown',
            trim: true,
        },
        deviceAge: {
            type: String,
            default: '1 to 2 years',
            trim: true,
        },
        condition: {
            type: String,
            default: 'Good',
            trim: true,
        },
        warrantyStatus: {
            type: String,
            default: 'Unknown',
            trim: true,
        },
        /** hardware → diagnosed from photos, software → from the description, unsure → both. */
        problemType: {
            type: String,
            enum: ['hardware', 'software', 'unsure'],
            default: 'unsure',
        },
        problemDescription: {
            type: String,
            default: '',
            trim: true,
            maxlength: [2000, 'Problem description cannot exceed 2000 characters'],
        },
        repairCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        replacementCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        score: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        verdict: {
            type: String,
            enum: ['REPAIR', 'EITHER', 'REPLACE'],
            default: 'EITHER',
        },
        recommendation: {
            badge: { type: String, default: '' },
            verdict: { type: String, default: 'EITHER' },
            summary: { type: String, default: '' },
            action: { type: String, default: '' },
        },
        financials: {
            repairCost: { type: Number, default: 0 },
            replacementCost: { type: Number, default: 0 },
            savings: { type: Number, default: 0 },
            costRatio: { type: Number, default: 0 },
        },
        factors: [
            {
                label: { type: String, default: '' },
                weight: { type: Number, default: 0 },
                score: { type: Number, default: 0 },
                note: { type: String, default: '' },
            },
        ],
        /** IN_PROGRESS until the user saves a decision; COMPLETE afterwards. */
        status: {
            type: String,
            enum: ['IN_PROGRESS', 'COMPLETE'],
            default: 'IN_PROGRESS',
            index: true,
        },
        /** Photo damage check: { label, aiSummary, findings: [{ component, severity, confidence, estCost, note }] } */
        vision: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        /** Shop quote in rupees: { parts, labour, diagnostic, tax, total, shopName, fileName } */
        quote: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        /** Market estimate: { typicalRepairCost, typicalRepairRange, newPhonePrice (price of a new replacement device), newPhoneLabel, repairability, questions, source } */
        estimate: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

const Assessment = mongoose.model('Assessment', assessmentSchema);
export default Assessment;
