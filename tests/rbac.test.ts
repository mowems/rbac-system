import request from "supertest";
import app from "../src/app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Role-Based Access Control (RBAC) Tests", () => {
  let adminToken: string;
  let managerToken: string;
  let userToken: string;

  beforeAll(async () => {
    console.log("Setting up test database for RBAC...");

    // Step 1: Reset Database (Ensure Clean Slate)
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("Test database is clean");

    // Step 2: Seed Database & Wait for Completion
    await import("../prisma/seed");
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Ensure consistency

    console.log("Database seeded successfully");

    // Step 3: Fetch Users to Confirm Seeding
    const users = await prisma.user.findMany();
    console.log("Seeded Users:", users);
    if (users.length < 3) throw new Error("User seeding failed!");

    // Step 4: Login Users & Store Tokens
    const loginAdmin = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "AdminPassword123",
    });
    const loginManager = await request(app).post("/api/auth/login").send({
      email: "manager@example.com",
      password: "ManagerPassword123",
    });
    const loginUser = await request(app).post("/api/auth/login").send({
      email: "user@example.com",
      password: "UserPassword123",
    });

    adminToken = loginAdmin.body.token;
    managerToken = loginManager.body.token;
    userToken = loginUser.body.token;
    console.log("Tokens generated for testing");
  });

  afterAll(async () => {
    await prisma.$disconnect();
    console.log("Disconnected from test database");
  });

  // ADMIN TESTS
  it("Admin should be able to read users", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it("Admin should be able to create users", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "New User", email: "newuser@example.com", password: "password123" });
    expect(res.status).toBe(201);
  });

  it("Admin should be able to delete a user", async () => {
    const user = await prisma.user.findFirst({ where: { email: "newuser@example.com" } });
    expect(user).not.toBeNull();

    const res = await request(app).delete(`/api/users/${user!.id}`).set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it("Admin should be able to assign roles", async () => {
    // Fetch a user dynamically to assign a role
    const user = await prisma.user.findFirst({ where: { email: "user@example.com" } });
    if (!user) throw new Error("User not found!");

    // Fetch a role dynamically
    const role = await prisma.role.findFirst({ where: { name: "Manager" } });
    if (!role) throw new Error("Role not found!");

    console.log("🔍 Assigning Role:", { userId: user.id, roleId: role.id });

    const res = await request(app)
      .post(`/api/assignments/users/${user.id}/assign-role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ roleId: role.id });

    expect(res.status).toBe(200);
  });

  // MANAGER TESTS
  it("Manager should NOT be able to assign roles", async () => {
    const res = await request(app)
      .post("/api/assignments/users/c1f49877-d280-4f94-bbcb-0b81d9e51e46/assign-role")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ roleId: "8cc9e0ab-49f6-403a-aa65-52c469bc238d" });
    expect(res.status).toBe(403);
  });

  it("Manager should NOT be able to read users", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  // USER TESTS
  it("User should be able to read users", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  it("User should NOT be able to create users", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Test User", email: "test@example.com", password: "test123" });
    expect(res.status).toBe(403);
  });
});
