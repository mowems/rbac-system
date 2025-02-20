import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

beforeAll(async () => {
  console.log("Setting up test database...");

  await prisma.$transaction(async (tx: { rolePermission: { deleteMany: (arg0: {}) => any; createMany: (arg0: { data: { roleId: string; permissionId: string; }[]; skipDuplicates: boolean; }) => any; findMany: (arg0: { where: { roleId: string; }; include: { permission: boolean; }; }) => any; }; userRole: { deleteMany: (arg0: {}) => any; }; permission: { deleteMany: (arg0: {}) => any; createMany: (arg0: { data: { id: string; action: string; }[]; skipDuplicates: boolean; }) => any; }; role: { deleteMany: (arg0: {}) => any; createMany: (arg0: { data: { id: string; name: string; }[]; skipDuplicates: boolean; }) => any; }; user: { deleteMany: (arg0: {}) => any; }; }) => {
    // Clear tables before tests run
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
        { id: "e6b89e9e-8e26-4a58-b54f-17b3df2b6c6b", action: "READ_ROLE" },
        { id: "c6b741c3-5fc7-45f6-a7b5-2576c267db3a", action: "WRITE_ROLE" },
        { id: "a81e3baf-70b7-403b-bfc1-238e456dc48e", action: "DELETE_ROLE" },
        { id: "b0c6f30e-2f67-4929-9055-3087a5d426c4", action: "READ_PERMISSION" },
        { id: "3b89b926-bc70-49d8-9f2a-c4e6b08f5a9d", action: "WRITE_PERMISSION" },
        { id: "4c11a0c1-4e3f-4994-a989-0f8d5b3e9f6c", action: "DELETE_PERMISSION" },
      ],
      skipDuplicates: true,
    });

    console.log("Permissions seeded in test database");

    // Assign permissions to the Admin role
    await tx.rolePermission.createMany({
      data: [
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "11a802d3-59f7-45b6-9f05-63b9ef404226" }, // READ_USER
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "5516b2e0-5035-413f-8b73-b25ccb1bda67" }, // WRITE_USER
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "f2c202a3-1d61-41d4-ae2b-6fa5a5a8439d" }, // DELETE_USER
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "e6b89e9e-8e26-4a58-b54f-17b3df2b6c6b" }, // READ_ROLE
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "c6b741c3-5fc7-45f6-a7b5-2576c267db3a" }, // WRITE_ROLE
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "a81e3baf-70b7-403b-bfc1-238e456dc48e" }, // DELETE_ROLE
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "b0c6f30e-2f67-4929-9055-3087a5d426c4" }, // READ_PERMISSION
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "3b89b926-bc70-49d8-9f2a-c4e6b08f5a9d" }, // WRITE_PERMISSION
        { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2", permissionId: "4c11a0c1-4e3f-4994-a989-0f8d5b3e9f6c" }, // DELETE_PERMISSION
      ],
      skipDuplicates: true,
    });

    console.log("Admin permissions assigned");

    // Verify permissions exist
    const adminPermissions = await tx.rolePermission.findMany({
      where: { roleId: "8f3a1d33-5b9d-4dab-b2df-1433bb45e1f2" },
      include: { permission: true },
    });
    console.log("Admin Permissions after setup:", adminPermissions);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  console.log("Disconnected from test database");
});
