export const MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"];

export const normalizeMealType = (value) => {
    if (!value) return null;
    const v = String(value).trim().toLowerCase();
    return MEAL_TYPES.includes(v) ? v : null;
};

export const toNumber = (val, def = 0) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : def;
};

export const normalizeNutrition = (nutrition = {}) => ({
    calories: toNumber(nutrition.calories, 0),
    protein: toNumber(nutrition.protein, 0),
    carbs: toNumber(nutrition.carbs, 0),
    fats: toNumber(nutrition.fats ?? nutrition.fat, 0), // support old payload fat
    sugar: toNumber(nutrition.sugar, 0),
    fiber: toNumber(nutrition.fiber, 0),
});

export const normalizeDateYYYYMMDD = (dateStr) => {
    if (!dateStr) return null;
    const date = String(dateStr).trim();
    // quick check for YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return date;
};
