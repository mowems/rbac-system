import request from "supertest";
import app from "../src/app";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";

const redis = new Redis();
const prisma = new PrismaClient();

describe("Authentication Tests", () => {
  let userToken: string;

  it("Should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "testpassword",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe("testuser@example.com");
  });

  it("Should login an existing user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "testuser@example.com",
      password: "testpassword",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    userToken = res.body.token; // Save token for future tests
  });

  it("Should reject login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "testuser@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized: Invalid email or password");
  });

  it("Should reject login for a non-existent user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "somepassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized: Invalid email or password");
  });

  it("Should logout successfully", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(
      "Logged out successfully. Token invalidated."
    );
  });
});


afterAll(async () => {
  await redis.quit();
  await prisma.$disconnect();
});
