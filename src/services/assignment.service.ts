import { PrismaClient } from '@prisma/client';
import redis from "../utils/redis";

const prisma = new PrismaClient();

const CACHE_EXPIRATION = 3600; // 1 hour

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
  const userRole = await prisma.userRole.create({
    data: { userId, roleId },
  });

  // Invalidate the cache for the user's roles
  await redis.del(`user:roles:${userId}`);

  return userRole;
};

// Get all roles assigned to a User (with caching)
export const getUserRolesService = async (userId: string) => {
  const cacheKey = `user:roles:${userId}`;

  // Check Redis cache
  const cachedRoles = await redis.get(cacheKey);
  if (cachedRoles) {
    return JSON.parse(cachedRoles);
  }

  // Fetch from database
  const roles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  const roleData = roles.map((r) => r.role);

  // Store in cache
  await redis.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(roleData));

  return roleData;
};

// Assign a permission to a role
export const assignPermissionToRoleService = async (roleId: string, permissionId: string) => {
  const rolePermission = await prisma.rolePermission.create({
    data: { roleId, permissionId },
  });

  // Invalidate the cache for the role's permissions
  await redis.del(`role:permissions:${roleId}`);

  return rolePermission;
};

// Get all permissions assigned to a role (with caching)
export const getRolePermissionsService = async (roleId: string) => {
  const cacheKey = `role:permissions:${roleId}`;

  // Check Redis cache
  const cachedPermissions = await redis.get(cacheKey);
  if (cachedPermissions) {
    return JSON.parse(cachedPermissions);
  }

  // Fetch from database
  const permissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });

  const permissionData = permissions.map((p) => p.permission);

  // Store in cache
  await redis.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(permissionData));

  return permissionData;
};
