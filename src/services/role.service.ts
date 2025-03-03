import { PrismaClient } from '@prisma/client';
import redis from "../utils/redis";

const prisma = new PrismaClient();

// Cache expiration time (1 hour)
const CACHE_EXPIRATION = 3600;

// **Get all roles with caching**
export const getRolesService = async () => {
  const cacheKey = 'roles';

  // Check Redis cache first
  const cachedRoles = await redis.get(cacheKey);
  if (cachedRoles) {
    console.log("Fetching roles from cache...");
    return JSON.parse(cachedRoles);
  }

  // If not cached, fetch from DB
  const roles = await prisma.role.findMany();

  // Cache the roles
  await redis.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(roles));

  return roles;
};

// **Get a role by ID with caching**
export const getRoleByIdService = async (roleId: string) => {
  const cacheKey = `role:${roleId}`;

  // Check Redis cache first
  const cachedRole = await redis.get(cacheKey);
  if (cachedRole) {
    console.log(`Fetching role ${roleId} from cache...`);
    return JSON.parse(cachedRole);
  }

  // If not cached, fetch from DB
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error('Role not found');

  // Cache the role
  await redis.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(role));

  return role;
};

// **Create a new role (Invalidate Cache)**
export const createRoleService = async (name: string) => {
  const role = await prisma.role.create({
    data: { name },
  });

  // Invalidate roles cache
  await redis.del('roles');

  return role;
};

// **Update a role (Invalidate Cache)**
export const updateRoleService = async (roleId: string, name: string) => {
  const role = await prisma.role.update({
    where: { id: roleId },
    data: { name },
  });

  // Invalidate cache
  await redis.del(`role:${roleId}`);
  await redis.del('roles');

  return role;
};

// **Delete a role (Invalidate Cache)**
export const deleteRoleService = async (roleId: string) => {
  const role = await prisma.role.delete({ where: { id: roleId } });

  // Invalidate cache
  await redis.del(`role:${roleId}`);
  await redis.del('roles');

  return role;
};
