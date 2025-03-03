import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import Redis from "ioredis";
import bcrypt from "bcryptjs";
import redisClient, { closeRedis } from "../src/utils/redis";

dotenv.config();

const prisma = new PrismaClient();

beforeAll(async () => {
  console.log("Setting test JWT_SECRET...");
  process.env.JWT_SECRET = "random_super_secret_key";  // Set a consistent secret for testing

  console.log("Flushing Redis cache...");
  await redisClient.flushall(); // Clears Redis cache before tests

  console.log("Setting up test database...");

  await prisma.$transaction(async (tx) => {
    // Clear all tables before running tests
    await tx.rolePermission.deleteMany({});
    await tx.userRole.deleteMany({});
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({});
    await tx.user.deleteMany({});

    console.log("Test database is clean");

    // Reinsert predefined roles
    await tx.role.createMany({
      data: [
        { id: "06b4a43c-5701-4a40-9080-269cacc4bc5d", name: "User" },
        { id: "af3e1c33-7a0d-4cbb-a3df-9233db35d8f2", name: "Manager" },
        { id: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", name: "Admin" },
      ],
      skipDuplicates: true, // Prevents duplicate errors
    });

    console.log("Roles seeded in test database");

    // Insert permissions
    await tx.permission.createMany({
      data: [
        { id: "11a802d3-59f7-45b6-9f05-63b9ef404226", action: "READ_USER" },
        { id: "5516b2e0-5035-413f-8b73-b25ccb1bda67", action: "WRITE_USER" },
        { id: "f2c202a3-1d61-41d4-ae2b-6fa5a5a8439d", action: "DELETE_USER" },
        { id: "e6b89e9e-8e26-4a58-b54f-17b3df2b6c6b", action: "ASSIGN_ROLE" },
      ],
      skipDuplicates: true,
    });

    console.log("Permissions seeded in test database");

    // Assign permissions to the Admin role
    await tx.rolePermission.createMany({
      data: [
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "11a802d3-59f7-45b6-9f05-63b9ef404226" },
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "5516b2e0-5035-413f-8b73-b25ccb1bda67" },
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "f2c202a3-1d61-41d4-ae2b-6fa5a5a8439d" },
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "e6b89e9e-8e26-4a58-b54f-17b3df2b6c6b" },
      ],
      skipDuplicates: true,
    });

    console.log("Admin permissions assigned");

    // Hash password for test user
    const hashedPassword = bcrypt.hashSync("AdminPassword123", 10);

    // Insert test users
    await tx.user.createMany({
      data: [
        {
          id: "1498ae08-a0d9-4c1d-bc8b-a8f38edb2081",
          name: "Admin User",
          email: "admin@example.com",
          password: hashedPassword, // Store hashed password
          createdAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });

    console.log("Test users seeded");
  });
});

// Close Redis connection and Prisma client after all tests
afterAll(async () => {
  console.log("Closing Redis and Prisma connections...");

  await closeRedis(); // Ensure Redis is properly closed
  await prisma.$disconnect(); // Ensure Prisma is properly closed

  console.log("Redis and Prisma connections closed.");
});
