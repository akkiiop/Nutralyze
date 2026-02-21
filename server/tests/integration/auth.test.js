import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import User from "../../models/User.js";

// Mock the User model
vi.mock("../../models/User.js", () => {
    return {
        default: {
            findOne: vi.fn(),
            create: vi.fn(),
        },
    };
});

// Mock the DB connection to prevent real connection attempts during tests
vi.mock("../../config/db.js", () => ({
    default: vi.fn().mockResolvedValue(true),
}));

describe("Auth Integration Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("POST /api/auth/signup", () => {
        it("should return 400 if email already exists", async () => {
            User.findOne.mockResolvedValue({ email: "test@example.com" });

            const res = await request(app)
                .post("/api/auth/signup")
                .send({
                    name: "Test User",
                    email: "test@example.com",
                    password: "password123",
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already exists/i);
        });

        it("should create a new user and return 201", async () => {
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({
                _id: "mockid",
                name: "New User",
                email: "new@example.com",
            });

            const res = await request(app)
                .post("/api/auth/signup")
                .send({
                    name: "New User",
                    email: "new@example.com",
                    password: "password123",
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });

    describe("POST /api/auth/login", () => {
        it("should return 400 for invalid credentials (user not found)", async () => {
            User.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "wrong@example.com",
                    password: "wrongpassword",
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/invalid credentials/i);
        });
    });
});
