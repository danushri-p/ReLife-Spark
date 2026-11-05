import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            default: 'demo',
            trim: true,
        },
        deviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Device',
            default: null,
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
