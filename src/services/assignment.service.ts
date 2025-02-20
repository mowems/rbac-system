import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Assign a role to a user
export const assignRoleToUserService = async (userId: string, roleId: string) => {
  // Check if the role is already assigned
  const existingAssignment = await prisma.userRole.findFirst({
    where: { userId, roleId },
  });

  if (existingAssignment) {
    throw new Error("User already has this role");
  }

  // Assign the role
  return prisma.userRole.create({
    data: { userId, roleId },
  });
};

// Get all roles assigned to a User
export const getUserRolesService = async (userId: string) => {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  return roles.map((r: { role: any; }) => r.role);
};

// Assign a Permission to a Role
export const assignPermissionToRoleService = async (roleId: string, permissionId: string) => {
  return prisma.rolePermission.create({
    data: { roleId, permissionId },
  });
};

// Get all Permissions assigned to a Role
export const getRolePermissionsService = async (roleId: string) => {
  const permissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });

  return permissions.map((p: { permission: any; }) => p.permission);
};
