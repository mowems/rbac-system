import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting database seeding...");

    // **Step 1: Seed Roles**
    const roles = ["Admin", "Manager", "User"];
    await prisma.role.createMany({
      data: roles.map((name) => ({ name })),
      skipDuplicates: true,
    });

    const [adminRole, managerRole, userRole] = await Promise.all(
      roles.map((name) => prisma.role.findUnique({ where: { name } }))
    );

    console.log("Roles seeded:", roles);

    // **Step 2: Seed Permissions**
    const permissions = ["READ_USER", "WRITE_USER", "DELETE_USER", "ASSIGN_ROLE"];
    await prisma.permission.createMany({
      data: permissions.map((action) => ({ action })),
      skipDuplicates: true,
    });

    const [readUserPermission, writeUserPermission, deleteUserPermission, assignRolePermission] =
      await Promise.all(permissions.map((action) => prisma.permission.findUnique({ where: { action } })));

    console.log("Permissions seeded:", permissions);

    // **Step 3: Seed Users**
    const userData = [
      { name: "Admin User", email: "admin@example.com", password: "AdminPassword123" },
      { name: "Manager User", email: "manager@example.com", password: "ManagerPassword123" },
      { name: "Normal User", email: "user@example.com", password: "UserPassword123" },
    ];

    for (const user of userData) {
      const existingUser = await prisma.user.findUnique({ where: { email: user.email } });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.create({
          data: { ...user, password: hashedPassword },
        });
      } else {
        console.log(`⚠️ User with email ${user.email} already exists. Skipping...`);
      }
    }

    const [adminUser, managerUser, normalUser] = await Promise.all(
      userData.map(({ email }) => prisma.user.findUnique({ where: { email } }))
    );

    console.log("Users seeded:", userData.map((u) => u.email));

    // **Step 4: Assign Roles to Users**
    const userRolesData = [
      { userId: adminUser!.id, roleId: adminRole!.id },
      { userId: managerUser!.id, roleId: managerRole!.id },
      { userId: normalUser!.id, roleId: userRole!.id },
    ];

    await prisma.userRole.createMany({
      data: userRolesData,
      skipDuplicates: true,
    });

    console.log("User roles assigned");

    // **Step 5: Assign Permissions to Roles**
    const rolePermissionsData = [
      { roleId: adminRole!.id, permissionId: readUserPermission!.id },
      { roleId: adminRole!.id, permissionId: writeUserPermission!.id },
      { roleId: adminRole!.id, permissionId: deleteUserPermission!.id },
      { roleId: adminRole!.id, permissionId: assignRolePermission!.id },
      { roleId: userRole!.id, permissionId: readUserPermission!.id },
    ];

    await prisma.rolePermission.createMany({
      data: rolePermissionsData,
      skipDuplicates: true,
    });

    console.log("Role permissions assigned");
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// **Export main function for testing compatibility**
export { main };

// **Run Seeding if executed directly**
if (require.main === module) {
  main();
}
