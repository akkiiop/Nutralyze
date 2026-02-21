import { describe, it, expect } from "vitest";
import {
    normalizeMealType,
    normalizeNutrition,
    normalizeDateYYYYMMDD,
    toNumber,
} from "./nutritionUtils.js";

describe("Nutrition Utilities Unit Tests", () => {
    describe("toNumber", () => {
        it("should convert a numeric string to a number", () => {
            expect(toNumber("123")).toBe(123);
        });

        it("should return default value for invalid numbers", () => {
            expect(toNumber("abc", 50)).toBe(50);
        });

        it("should return 0 as default if none provided", () => {
            expect(toNumber("xyz")).toBe(0);
        });
    });

    describe("normalizeMealType", () => {
        it("should lowercase and trim meal types", () => {
            expect(normalizeMealType("  Breakfast  ")).toBe("breakfast");
        });

        it("should return null for invalid meal types", () => {
            expect(normalizeMealType("brunch")).toBeNull();
        });

        it("should accept valid meal types", () => {
            expect(normalizeMealType("lunch")).toBe("lunch");
            expect(normalizeMealType("dinner")).toBe("dinner");
            expect(normalizeMealType("snacks")).toBe("snacks");
        });
    });

    describe("normalizeNutrition", () => {
        it("should normalize partial nutrition objects", () => {
            const input = { calories: "500", protein: 20 };
            const output = normalizeNutrition(input);
            expect(output).toEqual({
                calories: 500,
                protein: 20,
                carbs: 0,
                fats: 0,
                sugar: 0,
                fiber: 0,
            });
        });

        it("should handle 'fat' as a fallback for 'fats'", () => {
            const input = { fat: 15 };
            const output = normalizeNutrition(input);
            expect(output.fats).toBe(15);
        });
    });

    describe("normalizeDateYYYYMMDD", () => {
        it("should validate correct dates", () => {
            expect(normalizeDateYYYYMMDD("2025-01-26")).toBe("2025-01-26");
        });

        it("should return null for invalid formats", () => {
            expect(normalizeDateYYYYMMDD("26-01-2025")).toBeNull();
            expect(normalizeDateYYYYMMDD("2025/01/26")).toBeNull();
        });
    });
});
