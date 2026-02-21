import mongoose from "mongoose";

const waterLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        amount: {
            type: Number, // In ml/glasses - let's use ml
            required: true,
            default: 0,
        },
        date: {
            type: String, // YYYY-MM-DD
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

// One log per day per user
waterLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("WaterLog", waterLogSchema);
