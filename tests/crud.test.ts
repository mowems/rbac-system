import request from "supertest";
import app from "../src/app";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

describe("CRUD Operations Tests", () => {
  let adminToken: string;
  let userId: string;

  // CRUD Test Setup - Fetch an admin user from Db using email, login and store token for admin
  beforeAll(async () => {
    console.log("Setting up test database for CRUD...");

    // Ensure database seeding is complete
    await import("../prisma/seed");
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Ensure DB is ready

    // Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    });

    if (!adminUser) {
      throw new Error("Admin user not found in database!");
    }

    console.log("Admin user exists in DB:", adminUser);

    // Verify password manually
    const passwordMatch = await bcrypt.compare(
      "AdminPassword123",
      adminUser.password
    );

    if (!passwordMatch) {
      throw new Error("Password mismatch for admin user!");
    }

    // Login as admin
    const loginAdmin = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "AdminPassword123",
    });

    if (loginAdmin.status !== 200) {
      console.error("Admin login failed!", loginAdmin.body);
      throw new Error("Admin login failed!");
    }

    adminToken = loginAdmin.body.token;
    console.log("Admin token generated:", adminToken);
  });

  // Cleanup after tests
  afterAll(async () => {
    await prisma.$disconnect();
    console.log("Disconnected from test database");
  });

  // CREATE TEST
  it("Should create a new user", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test User",
        email: "testuser@example.com",
        password: "password123",
      });

    if (res.status !== 201) {
      console.error("User creation failed!", res.body);
    }

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");

    userId = res.body.id;
    console.log("New user created:", userId);
  });

  // READ TEST
  it("Should retrieve the created user", async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    if (res.status !== 200) {
      console.error("User retrieval failed!", res.body);
    }

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("testuser@example.com");
  });

  // UPDATE TEST
  it("Should update the user's name", async () => {
    const res = await request(app)
      .patch(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated User" });

    if (res.status !== 200) {
      console.error("User update failed!", res.body);
    }

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated User");
  });

  // DELETE TEST
  it("Should delete the user", async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    if (res.status !== 200) {
      console.error("User deletion failed!", res.body);
    }

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");

    // Confirm deletion
    const confirmRes = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    if (confirmRes.status !== 404) {
      console.error("User was not deleted properly!", confirmRes.body);
    }

    expect(confirmRes.status).toBe(404);
  });
});
