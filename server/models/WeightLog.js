import mongoose from "mongoose";

const WeightLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        weight: {
            type: Number,
            required: true,
        },
        date: {
            type: String, // YYYY-MM-DD
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

// Ensure one entry per day per user (upsert logic will rely on this or findOneAndUpdate)
WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("WeightLog", WeightLogSchema);
