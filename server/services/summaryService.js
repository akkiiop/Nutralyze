import DailySummary from "../models/DailySummary.js";
import Meal from "../models/Meal.js";
import User from "../models/User.js";

/**
 * Recalculate and update the DailySummary for a specific user and date.
 * Should be called whenever a meal/water/weight is logged or updated.
 */
export const updateDailySummary = async (userId, date) => {
    try {
        // 1. Fetch all meals for this date
        // Meal.js uses 'date' string "YYYY-MM-DD" or similar.
        // Assuming Meal model has a 'date' field (String) matching "YYYY-MM-DD"
        const meals = await Meal.find({ userId, date });

        // 2. Fetch User Profile for Goals (if needed)
        const user = await User.findById(userId);

        // 3. Calculate Totals
        const totals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            sugar: 0,
            fiber: 0,
            water: 0 // Water might be in a separate collection, we'll address that next
        };

        meals.forEach(dailyDoc => {
            if (dailyDoc.meals && Array.isArray(dailyDoc.meals)) {
                dailyDoc.meals.forEach(item => {
                    const stats = item.nutrition || {};
                    totals.calories += stats.calories || 0;
                    totals.protein += stats.protein || 0;
                    totals.carbs += stats.carbs || 0;
                    totals.fats += stats.fats || 0;
                    totals.sugar += stats.sugar || 0;
                    totals.fiber += stats.fiber || 0;
                });
            }
        });

        // 4. Update or Create DailySummary
        let summary = await DailySummary.findOne({ userId, date });

        if (!summary) {
            summary = new DailySummary({ userId, date });
        }

        summary.totals = totals;

        // Set Goals from User Profile if available, otherwise defaults
        // Set Goals from User Profile if available, otherwise defaults
        if (user) {
            summary.goals = {
                calories: user.calorieTarget || 2000,
                protein: user.proteinTarget || 50,
                carbs: Math.round(((user.calorieTarget || 2000) * 0.45) / 4), // Auto-calc if missing
                fats: Math.round(((user.calorieTarget || 2000) * 0.25) / 9),
                sugar: user.sugarTarget || 30,
                fiber: user.fiberTarget || 30
            };
        }

        // 5. Streak Logic (Simple Version)
        // If today has activity (calories > 0), check yesterday
        if (totals.calories > 0) {
            // Logic for streak calculation can be complex (recursively checking past days).
            // For speed, we just increment if yesterday existed, or set to 1.
            // NOTE: A robust streak system usually runs as a scheduled job, but this is "good enough" for real-time.

            const yesterday = new Date(date);
            yesterday.setDate(yesterday.getDate() - 1);
            const prevDate = yesterday.toISOString().split('T')[0];

            const prevSummary = await DailySummary.findOne({ userId, date: prevDate });

            if (prevSummary && prevSummary.streak > 0) {
                summary.streak = prevSummary.streak + 1;
            } else {
                // Only reset to 1 if it's 0. If it was already calculated today as 5, keep it 5.
                if (summary.streak === 0) summary.streak = 1;
            }
        }

        summary.lastUpdated = new Date();
        await summary.save();
        console.log(`[Summary] Updated for ${userId} on ${date}`);

        return summary;

    } catch (error) {
        console.error("[SummaryService] Error updating summary:", error);
        throw error; // Let caller handle/log
    }
};
