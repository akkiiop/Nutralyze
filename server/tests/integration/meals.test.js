import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import Meal from "../../models/Meal.js";
import mongoose from "mongoose";

// Mock the Meal model
vi.mock("../../models/Meal.js", () => {
    return {
        default: {
            findOneAndUpdate: vi.fn(),
            findOne: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue({ meals: [] }),
            }),
        },
    };
});

// Mock the DB connection
vi.mock("../../config/db.js", () => ({
    default: vi.fn().mockResolvedValue(true),
}));

describe("Meal Integration Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("POST /api/meals/add", () => {
        it("should return 400 if required fields are missing", async () => {
            const res = await request(app)
                .post("/api/meals/add")
                .send({ userId: "mockid" }); // Missing date and meal

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should successfully add a meal", async () => {
            const mockUserId = new mongoose.Types.ObjectId().toString();
            Meal.findOneAndUpdate.mockResolvedValue({ success: true });

            const res = await request(app)
                .post("/api/meals/add")
                .send({
                    userId: mockUserId,
                    date: "2025-01-26",
                    meal: {
                        mealType: "lunch",
                        foodName: "Chicken Salad",
                        nutrition: { calories: 350, protein: 30, carbs: 10, fats: 20 },
                    },
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Meal.findOneAndUpdate).toHaveBeenCalled();
        });
    });

    describe("GET /api/meals/:userId/:date", () => {
        it("should return 400 for invalid date format", async () => {
            const res = await request(app).get("/api/meals/mockid/26-01-2025");
            expect(res.status).toBe(400);
        });

        it("should return empty meals array if no document found", async () => {
            const mockUserId = new mongoose.Types.ObjectId().toString();
            const res = await request(app).get(`/api/meals/${mockUserId}/2025-01-26`);

            expect(res.status).toBe(200);
            expect(res.body.meals).toEqual([]);
        });
    });
});
