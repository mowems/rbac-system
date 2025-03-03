import request from "supertest";
import app from "../src/app";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { main as seedDatabase } from "../prisma/seed";

const prisma = new PrismaClient();

describe("CRUD Operations Tests", () => {
  let adminToken: string;
  let userId: string;

  // 🔹 BEFORE ALL: Set up the test database
  beforeAll(async () => {
    console.log("Setting up test database for CRUD...");

    // Ensure database is cleared first
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});

    // Run database seeding
    await seedDatabase();

    console.log("Seeding completed, waiting for database to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Small buffer

    // Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    });

    if (!adminUser) {
      throw new Error("Admin user not found in database!");
    }

    console.log("Admin user exists in DB:", adminUser);

    // Verify password manually
    console.log("Checking password for admin user...");
    console.log("Stored hashed password:", adminUser.password);
    console.log("Raw password to compare:", "AdminPassword123");

    const passwordMatch = await bcrypt.compare("AdminPassword123", adminUser.password);

    if (!passwordMatch) {
      throw new Error("Password mismatch for admin user!");
    }

    // Login as admin
    const loginAdmin = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "AdminPassword123",
    });

    console.log("Admin login response:", loginAdmin.body);

    if (loginAdmin.status !== 200) {
      console.error("Admin login failed! Response:", loginAdmin.body);
      throw new Error("Admin login failed!");
    }

    adminToken = loginAdmin.body.token;
    console.log("Admin token generated:", adminToken);
  });

  // 🔹 AFTER ALL: Cleanup after tests
  afterAll(async () => {
    console.log("Closing database connections...");
    await prisma.$disconnect();
    console.log("Database connections closed.");
  });

  // 🔹 CREATE TEST
  it("Should create a new user", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test User",
        email: "testuser@example.com",
        password: "password123",
      });

    console.log("Create user response:", res.body);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");

    userId = res.body.id;
    console.log("New user created:", userId);

    // Ensure DB reflects changes
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  // 🔹 READ TEST
  it("Should retrieve the created user", async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    console.log("Retrieve user response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("testuser@example.com");
  });

  // 🔹 UPDATE TEST
  it("Should update the user's name", async () => {
    const res = await request(app)
      .patch(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated User" });

    console.log("Update user response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated User");

    // Ensure DB reflects changes
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  // 🔹 DELETE TEST
  it("Should delete the user", async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    console.log("Delete user response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");

    // Confirm deletion
    const confirmRes = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    console.log("Confirm user deletion response:", confirmRes.body);

    expect(confirmRes.status).toBe(404);
  });
});
