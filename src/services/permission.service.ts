import { PrismaClient } from '@prisma/client';
import redis from "../utils/redis";

const prisma = new PrismaClient();

// Cache expiration time (1 hour)
const CACHE_EXPIRATION = 3600;

// **Get all permissions with caching**
export const getPermissionsService = async () => {
  const cacheKey = 'permissions';

  // Check Redis cache first
  const cachedPermissions = await redis.get(cacheKey);
  if (cachedPermissions) {
    console.log("Fetching permissions from cache...");
    return JSON.parse(cachedPermissions);
  }

  // If not cached, fetch from DB
  const permissions = await prisma.permission.findMany();

  // Cache the permissions
  await redis.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(permissions));

  return permissions;
};

// **Get a specific permission by ID with caching**
export const getPermissionByIdService = async (id: string) => {
  const cacheKey = `permission:${id}`;

  // Check Redis cache first
  const cachedPermission = await redis.get(cacheKey);
  if (cachedPermission) {
    console.log(`Fetching permission ${id} from cache...`);
    return JSON.parse(cachedPermission);
  }

  // If not cached, fetch from DB
  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) throw new Error('Permission not found');

  // Cache the permission
  await redis.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(permission));

  return permission;
};

// **Create a new permission (Invalidate Cache)**
export const createPermissionService = async (action: string) => {
  const permission = await prisma.permission.create({
    data: { action },
  });

  // Invalidate permissions cache
  await redis.del('permissions');

  return permission;
};

// **Update permission details (Invalidate Cache)**
export const updatePermissionService = async (id: string, action: string) => {
  const permission = await prisma.permission.update({
    where: { id },
    data: { action },
  });

  // Invalidate cache
  await redis.del(`permission:${id}`);
  await redis.del('permissions');

  return permission;
};

// **Delete a permission (Invalidate Cache)**
export const deletePermissionService = async (id: string) => {
  const permission = await prisma.permission.delete({ where: { id } });

  // Invalidate cache
  await redis.del(`permission:${id}`);
  await redis.del('permissions');

  return permission;
};
