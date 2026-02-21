

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const isLocal = process.env.MONGO_URI.includes("127.0.0.1") || process.env.MONGO_URI.includes("localhost");
    console.log(isLocal ? "MongoDB Local Connected ✅" : "MongoDB Cloud Connected ✅");
  } catch (error) {
    console.error("MongoDB Connection Error ❌", error.message);
    process.exit(1);
  }
};

export default connectDB;
