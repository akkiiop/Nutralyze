import mongoose from "mongoose";

const productScanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        barcode: {
            type: String,
            required: true,
            trim: true,
        },
        productName: {
            type: String,
            required: true,
        },
        brand: {
            type: String,
        },
        nutriScore: {
            type: String,
        },
        imageUrl: {
            type: String,
        },
        scannedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Optional: Limit scans or keep them all. For now, keep all.
export default mongoose.model("ProductScan", productScanSchema);
