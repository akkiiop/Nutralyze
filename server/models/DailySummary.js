import mongoose from "mongoose";

const dailySummarySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: String, // Format: "YYYY-MM-DD"
        required: true,
        index: true
    },
    // Aggregated totals for high-speed access
    totals: {
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 },
        water: { type: Number, default: 0 } // in ml
    },
    goals: {
        calories: { type: Number, default: 2000 },
        protein: { type: Number, default: 50 },
        carbs: { type: Number, default: 250 },
        fats: { type: Number, default: 70 },
        sugar: { type: Number, default: 30 },
        fiber: { type: Number, default: 30 }
    },
    weight: {
        type: Number,
        default: null // Null if not logged that day
    },
    streak: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound index for unique daily entry per user
dailySummarySchema.index({ userId: 1, date: 1 }, { unique: true });

const DailySummary = mongoose.model('DailySummary', dailySummarySchema);

export default DailySummary;
