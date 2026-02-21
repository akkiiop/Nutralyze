
import mongoose from 'mongoose';
import Meal from './models/Meal.js';
import WeightLog from './models/WeightLog.js';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Nutralyze")
    .then(async () => {
        console.log("🔥 CONNECTED TO DB FOR CLEANUP 🔥");

        // 1. Delete All Weight Logs
        const wResult = await WeightLog.deleteMany({});
        console.log(`❌ Deleted ${wResult.deletedCount} Weight Logs`);

        // 2. Delete All Meals
        const mResult = await Meal.deleteMany({});
        console.log(`❌ Deleted ${mResult.deletedCount} Meal Logs`);

        // 3. Reset User Profiles (Keep Name/Email/Password, wipe stats)
        const uResult = await User.updateMany({}, {
            $unset: {
                // Physical
                age: "",
                gender: "",
                height: "",
                weight: "",
                targetWeight: "",
                activityLevel: "",

                // Diet
                dietType: "",
                preferredCuisine: "",
                mealFrequency: "",

                // Medical
                medicalConditions: "",
                allergies: "",
                avoidIngredients: "",

                // Goals
                goal: "",
                calorieTarget: "",
                proteinTarget: "",
                sugarTarget: "",
                fiberTarget: "",
                waterIntakeGoal: "",

                // Misc
                sleepHours: "",
                wakeupTime: ""
            }
        });
        console.log(`✨ Reset Profile Data for ${uResult.modifiedCount} Users`);

        console.log("\n✅ SYSTEM FACTORY RESET COMPLETE. READY FOR FRESH INPUT. ✅");
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
