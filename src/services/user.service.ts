import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import redis from "../utils/redis";

const prisma = new PrismaClient();

// Cache expiration in seconds (5 minutes)
const CACHE_TTL = 300;

// Defines a User type by resolving the return type of prisma.user.findUnique()
type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;

// Create a new user
export const createUserService = async (name: string, email: string, password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  // Invalidate cache after creating a new user
  await redis.del('users');
  await redis.del(`user:${user.id}`);

  return user;
};

// Get all users (excluding password) with caching
export const getUsersService = async (requestingUser: { id: string; roles: string[] }) => {
  const cachedUsers = await redis.get('users');
  if (cachedUsers) {
    return JSON.parse(cachedUsers);
  }

  // Fetch full user details including location
  const fullRequestingUser = await prisma.user.findUnique({
    where: { id: requestingUser.id },
    include: { location: true, roles: { include: { role: true } } }, // Ensure location & roles are fetched
  });

  if (!fullRequestingUser) {
    throw new Error('Requesting user not found');
  }

  const userRoles = fullRequestingUser.roles.map((r: { role: { name: string } }) => r.role.name);

  let whereCondition: any = {};

  if (userRoles.includes('City')) {
    if (!fullRequestingUser.location) {
      throw new Error('City role assigned but no location found.');
    }
    whereCondition = {
      OR: [
        { locationId: fullRequestingUser.location.id },
        { location: { parentId: fullRequestingUser.location.id } },
      ],
    };
  } else if (userRoles.includes('Suburb')) {
    if (!fullRequestingUser.location) {
      throw new Error('Suburb role assigned but no location found.');
    }
    whereCondition = { locationId: fullRequestingUser.location.id };
  }

  const users = await prisma.user.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      email: true,
      location: { select: { name: true } },
    },
  });

  // Cache the users result
  await redis.set('users', JSON.stringify(users), 'EX', CACHE_TTL);

  return users;
};

// Get a specific user by ID with caching
export const getUserByIdService = async (id: string) => {
  const cacheKey = `user:${id}`;
  const cachedUser = await redis.get(cacheKey);
  if (cachedUser) {
    return JSON.parse(cachedUser);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (user) {
    await redis.set(cacheKey, JSON.stringify(user), 'EX', CACHE_TTL);
  }
  return user;
};

// Update user details (invalidate cache)
export const updateUserService = async (id: string, name?: string, email?: string, password?: string) => {
  try {
    console.log(`Updating user ${id} with name: ${name}, email: ${email}, password: ${password ? '[HIDDEN]' : 'NOT CHANGING'}`);

    // Construct updateData object dynamically to exclude undefined fields
    const updateData: { name?: string; email?: string; password?: string } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache
    await redis.del(`user:${id}`);
    await redis.del('users');

    console.log("User updated successfully:", user);
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("User update failed. Check logs for details.");
  }
};

// Delete a user (invalidate cache)
export const deleteUserService = async (id: string) => {
  const user = await prisma.user.delete({ where: { id } });

  // Invalidate cache
  await redis.del(`user:${id}`);
  await redis.del('users');

  return user;
};

// Function to close Redis connection
export const closeRedis = async () => {
  await redis.quit();
};

export { redis };