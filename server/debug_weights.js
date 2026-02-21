
import mongoose from 'mongoose';
import WeightLog from './models/WeightLog.js';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Nutralyze")
    .then(async () => {
        console.log("Connected to DB");
        const users = await User.find({}); // Get ALL users
        console.log(`\n--- FOUND ${users.length} USERS ---`);

        for (const user of users) {
            const logs = await WeightLog.find({ userId: user._id }).sort({ date: 1 });
            console.log(`\nUser: ${user.name}`);
            console.log(`ID: ${user._id}`);
            console.log(`Profile Weight: ${user.weight}`);
            console.log(`Weight Logs (${logs.length}):`, JSON.stringify(logs, null, 2));

            // Seed if Jan 1 log is missing
            const hasHistory = logs.some(l => l.date === "2026-01-01");

            if (!hasHistory) {
                console.log("-> SEEDING 85kg log (Jan 1) for this user...");
                await WeightLog.create({ userId: user._id, weight: 85, date: "2026-01-01" });
            } else {
                console.log("-> Historical log exists.");
            }
        }

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
