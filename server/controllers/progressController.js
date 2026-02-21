import mongoose from "mongoose";
import Meal from "../models/Meal.js";
import WeightLog from "../models/WeightLog.js";
import User from "../models/User.js";

/* =========================
   HELPERS
   ========================= */
const getDateRange = (days = 30) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start, end };
};

const formatDate = (date) => date.toISOString().split("T")[0];

/* =========================
   1. GET SUMMARY (Streaks, Averages)
   ========================= */
export const getProgressSummary = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // 1. Fetch User for target weight
        const user = await User.findById(userId).select("weight targetWeight").lean();

        // 2. Fetch Latest Weight Log
        const latestWeightLog = await WeightLog.findOne({ userId }).sort({ date: -1 }).lean();
        const currentWeight = latestWeightLog ? latestWeightLog.weight : user.weight;

        // 3. Compute Weight Change (Historical Baseline)
        // Find the oldest log ever
        const oldestLog = await WeightLog.findOne({ userId }).sort({ date: 1 }).lean();

        // Fallback: if no history, use current user weight as start
        const startWeight = oldestLog ? oldestLog.weight : (user.weight || currentWeight);
        const weightChange = currentWeight - startWeight;

        // 4. Calculate Streak (consecutive days with logged meals)
        // We look at last 365 days of meals
        const mealDocs = await Meal.find({ userId }).select("date").sort({ date: -1 }).limit(365).lean();
        const loggedDates = new Set(mealDocs.map((m) => m.date));

        let streak = 0;
        const today = new Date();
        // Check back from today
        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = formatDate(d);

            if (loggedDates.has(dateStr)) {
                streak++;
            } else if (i === 0 && !loggedDates.has(dateStr)) {
                // If today isn't logged yet, don't break streak if yesterday was logged
                continue;
            } else {
                break;
            }
        }

        res.json({
            success: true,
            summary: {
                currentWeight,
                startWeight,
                targetWeight: user.targetWeight || null,
                weightChange: Number(weightChange.toFixed(1)),
                streak,
            },
        });
    } catch (err) {
        console.error("Progress Summary Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/* =========================
   2. GET HISTORY (Charts)
   ========================= */
export const getProgressHistory = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        let days = parseInt(req.query.days) || 7;

        // Cap days to avoid performance issues
        if (days > 365) days = 365;

        // 1. Generate Date Range (Last X days up to today)
        const dates = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            dates.push(formatDate(d)); // YYYY-MM-DD
        }

        // 2. Parallel Fetch: Meals & WeightLogs
        const [meals, weights] = await Promise.all([
            Meal.find({
                userId,
                date: { $in: dates }
            }).lean(),
            WeightLog.find({
                userId,
                date: { $in: dates }
            }).sort({ date: 1 }).lean()
        ]);

        // 3. Map Data for O(1) Access
        const mealMap = {};
        meals.forEach(m => {
            let dailyCals = 0;
            let dailyProtein = 0;
            let dailyCarbs = 0;
            let dailyFats = 0;
            let dailySugar = 0;
            let dailyFiber = 0;

            (m.meals || []).forEach(item => {
                const nut = item.nutrition || {};
                dailyCals += Number(nut.calories) || 0;
                dailyProtein += Number(nut.protein) || 0;
                dailyCarbs += Number(nut.carbs) || 0;
                dailyFats += Number(nut.fats) || 0;
            });

            // Validation: Prevent negative values & outlier spikes
            if (dailyCals < 0) dailyCals = 0;
            if (dailyCals > 12000) dailyCals = 12000; // Cap at 12k

            mealMap[m.date] = {
                calories: Math.round(dailyCals),
                macros: {
                    protein: Math.round(dailyProtein),
                    carbs: Math.round(dailyCarbs),
                    fats: Math.round(dailyFats)
                }
            };
        });

        const weightMap = {};
        weights.forEach(w => weightMap[w.date] = w.weight);

        // 4. Build Final Normalized Dataset (Fill Gaps)
        // Find last known weight before this period for smooth start
        const lastLogBefore = await WeightLog.findOne({
            userId,
            date: { $lt: dates[0] }
        }).sort({ date: -1 }).lean();

        let lastKnownWeight = lastLogBefore ? lastLogBefore.weight : null;

        const history = dates.map(date => {
            const dayData = mealMap[date] || { calories: 0, macros: { protein: 0, carbs: 0, fats: 0 } };

            // Weight Logic: Carry forward if missing
            if (weightMap[date] !== undefined) {
                lastKnownWeight = weightMap[date];
            }

            return {
                date,
                calories: dayData.calories,
                macros: dayData.macros,
                weight: lastKnownWeight // Can be null if never logged
            };
        });

        res.json({ success: true, history });
    } catch (err) {
        console.error("Progress History Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/* =========================
   3. LOG WEIGHT
   ========================= */
export const logWeight = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { weight, date } = req.body;

        if (!weight) return res.status(400).json({ success: false, message: "Weight is required" });

        const logDate = date || formatDate(new Date());

        const log = await WeightLog.findOneAndUpdate(
            { userId, date: logDate },
            { weight: Number(weight) },
            { upsert: true, new: true }
        );

        // Optional: Update User's current weight if it's today
        if (logDate === formatDate(new Date())) {
            await User.findByIdAndUpdate(userId, { weight: Number(weight) });
        }

        res.json({ success: true, log });
    } catch (err) {
        console.error("Log Weight Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/* =========================
   4. GET DAILY PROGRESS (AI Coach Version)
   GET /api/progress/daily/:userId/:date
   ========================= */
import DailySummary from "../models/DailySummary.js";
import { updateDailySummary } from "../services/summaryService.js";

const generateAIAdvice = (totals, goals) => {
    const advice = [];

    // Protein Logic
    if (totals.protein < goals.protein * 0.6) {
        advice.push({ type: "warning", text: "Protein is very low. Try adding eggs or lentils." });
    } else if (totals.protein < goals.protein) {
        advice.push({ type: "info", text: "Protein is slightly low. A protein shake could help." });
    } else {
        advice.push({ type: "success", text: "Great job hitting your protein goal!" });
    }

    // Sugar Logic
    // Sugar Logic
    if (totals.sugar > goals.sugar) {
        advice.push({ type: "error", text: "Sugar limit exceeded. Avoid sweets for the rest of the day." });
    } else if (totals.sugar < goals.sugar * 0.5) {
        advice.push({ type: "success", text: "Sugar intake is well under control." });
    }

    // Fiber
    if (totals.fiber < goals.fiber) {
        advice.push({ type: "info", text: "Fiber is low. Include more veggies or fruits." });
    }

    // Calories
    if (totals.calories > goals.calories + 200) {
        advice.push({ type: "warning", text: "You've exceeded your calorie budget." });
    }

    // General encouragement if empty
    if (advice.length === 0) {
        advice.push({ type: "success", text: "You're on track! Keep it up." });
    }

    return advice;
};

export const getDailyProgress = async (req, res) => {
    try {
        const { userId, date } = req.params;

        // 1. Try to get cached DailySummary
        let summary = await DailySummary.findOne({ userId, date });

        // 2. If missing, generate it (Lazy Load)
        if (!summary) {
            summary = await updateDailySummary(userId, date);
        }

        // 3. Fallback defaults if still missing (e.g. error in service)
        const totals = summary?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0, fiber: 0 };
        const goals = summary?.goals || { calories: 2000, protein: 50, carbs: 250, fats: 70, sugar: 30, fiber: 30 };
        const streak = summary?.streak || 0;

        // 4. Generate AI Advice
        const advice = generateAIAdvice(totals, goals);

        // 5. Get Robust Weekly History
        // Reuse similar logic to getProgressHistory for the last 7 days to ensure zero-filling
        const dates = [];
        const todayObj = new Date(date); // Use the requested date as anchor, or today

        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayObj);
            d.setDate(todayObj.getDate() - i);
            dates.push(formatDate(d));
        }

        const [historyMeals, historyWeights] = await Promise.all([
            Meal.find({ userId, date: { $in: dates } }).select("date meals.nutrition").lean(),
            WeightLog.find({ userId, date: { $in: dates } }).select("date weight").sort({ date: 1 }).lean()
        ]);

        const historyMap = {};
        historyMeals.forEach(m => {
            let cals = 0;
            (m.meals || []).forEach(item => cals += (item.nutrition?.calories || 0));
            historyMap[m.date] = Math.round(cals);
        });

        const weightMap = {};
        historyWeights.forEach(w => weightMap[w.date] = w.weight);

        // Fill gaps
        let lastWeight = null;
        // Try to find a weight before the start of the week
        const priorWeight = await WeightLog.findOne({ userId, date: { $lt: dates[0] } }).sort({ date: -1 });
        if (priorWeight) lastWeight = priorWeight.weight;

        const weekly = dates.map(d => {
            if (weightMap[d]) lastWeight = weightMap[d];
            return {
                date: d,
                calories: historyMap[d] || 0,
                weight: lastWeight || null
            };
        });

        res.json({
            success: true,
            date,
            today: {
                ...totals,
                streak
            },
            goals,
            advice,
            weekly
        });

    } catch (err) {
        console.error("Daily Coach API Error:", err);
        res.status(500).json({ success: false, message: "Coach is offline" });
    }
};
