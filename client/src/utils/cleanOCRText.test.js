import { describe, it, expect } from "vitest";
import { cleanOCRText } from "./cleanOCRText.js";

describe("cleanOCRText Utility", () => {
    it("should return empty string for null/undefined input", () => {
        expect(cleanOCRText(null)).toBe("");
        expect(cleanOCRText(undefined)).toBe("");
    });

    it("should fix broken hyphen words", () => {
        const raw = "Sugar- free";
        expect(cleanOCRText(raw)).toBe("Sugar-free");
    });

    it("should fix broken percentages in parentheses", () => {
        const raw = "Fat (10 ";
        expect(cleanOCRText(raw)).toBe("Fat (10%)");
    });

    it("should normalize multiple white spaces", () => {
        const raw = "  High    Protein   ";
        expect(cleanOCRText(raw)).toBe("High Protein");
    });
});
