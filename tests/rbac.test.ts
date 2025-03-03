import request from "supertest";
import app from "../src/app";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import jwt from "jsonwebtoken";


const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

describe("Role-Based Access Control (RBAC) Tests", () => {
  let adminToken: string;
  let managerToken: string;
  let userToken: string;

  beforeAll(async () => {
    console.log("Flushing Redis cache...");
    await redis.flushall(); // Ensure Redis is cleared before tests

    console.log("Setting up test database for RBAC...");

    // Step 1: Reset Database (Ensure Clean Slate)
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("Test database is clean");

    // Step 2: Explicitly Seed Database
    await prisma.role.createMany({
      data: [
        { name: "Admin" },
        { name: "Manager" },
        { name: "User" }
      ],
      skipDuplicates: true
    });

    await prisma.permission.createMany({
      data: [
        { action: "READ_USER" },
        { action: "WRITE_USER" },
        { action: "DELETE_USER" },
        { action: "ASSIGN_ROLE" }
      ],
      skipDuplicates: true
    });

    const roles = await prisma.role.findMany();
    const permissions = await prisma.permission.findMany();

    const adminRole = roles.find((r) => r.name === "Admin");
    const managerRole = roles.find((r) => r.name === "Manager");
    const userRole = roles.find((r) => r.name === "User");

    if (!adminRole || !managerRole || !userRole) {
      throw new Error("Roles not properly seeded!");
    }

    await prisma.rolePermission.createMany({
      data: [
        { roleId: adminRole.id, permissionId: permissions.find((p) => p.action === "READ_USER")!.id },
        { roleId: adminRole.id, permissionId: permissions.find((p) => p.action === "WRITE_USER")!.id },
        { roleId: adminRole.id, permissionId: permissions.find((p) => p.action === "DELETE_USER")!.id },
        { roleId: adminRole.id, permissionId: permissions.find((p) => p.action === "ASSIGN_ROLE")!.id },
        { roleId: userRole.id, permissionId: permissions.find((p) => p.action === "READ_USER")!.id }
      ],
      skipDuplicates: true
    });

    await prisma.user.createMany({
      data: [
        { name: "Admin User", email: "admin@example.com", password: "AdminPassword123" },
        { name: "Manager User", email: "manager@example.com", password: "ManagerPassword123" },
        { name: "Regular User", email: "user@example.com", password: "UserPassword123" }
      ],
      skipDuplicates: true
    });

    console.log("Database seeded successfully");

    // Step 3: Fetch Users to Confirm Seeding
    const users = await prisma.user.findMany();
    console.log("Seeded Users:", users);
    if (users.length < 3) throw new Error("User seeding failed!");

    // Step 4: Login Users & Store Tokens
    const loginAdmin = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "AdminPassword123"
    });

    const loginManager = await request(app).post("/api/auth/login").send({
      email: "manager@example.com",
      password: "ManagerPassword123"
    });

    const loginUser = await request(app).post("/api/auth/login").send({
      email: "user@example.com",
      password: "UserPassword123"
    });

    // Generate JWT tokens manually for tests
    adminToken = jwt.sign(
      { id: users.find((u) => u.email === "admin@example.com")!.id, roles: ["Admin"], permissions: ["READ_USER", "WRITE_USER", "DELETE_USER", "ASSIGN_ROLE"] },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    managerToken = jwt.sign(
      { id: users.find((u) => u.email === "manager@example.com")!.id, roles: ["Manager"], permissions: [] },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    userToken = jwt.sign(
      { id: users.find((u) => u.email === "user@example.com")!.id, roles: ["User"], permissions: ["READ_USER"] },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    console.log("User Token Payload:", jwt.decode(userToken));
    console.log("Manually generated JWT tokens for test users.");
  });

  afterAll(async () => {
    console.log("Flushing Redis and disconnecting database...");
    await redis.flushall();
    await redis.quit();
    await prisma.$disconnect();
    console.log("Disconnected from test database and Redis");
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
    const user = await prisma.user.findFirst({ where: { email: "user@example.com" } });
    const role = await prisma.role.findFirst({ where: { name: "Manager" } });

    if (!user || !role) throw new Error("User or Role not found!");

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
