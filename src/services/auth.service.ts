import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import redis from "../utils/redis";

dotenv.config();
const prisma = new PrismaClient();

// Cache expiration (1 hour)
const CACHE_EXPIRATION = 3600;

// **Register User Service (Invalidate Cache)**
export const registerUserService = async (name: string, email: string, password: string) => {
  console.log("Registering user:", email);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.error("User already exists:", email);
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  // Assign default role "User"
  const roleRecord = await prisma.role.findUnique({ where: { name: "User" } });
  if (!roleRecord) {
    console.error("Role 'User' not found in DB!");
    throw new Error("Role 'User' does not exist");
  }

  await prisma.userRole.create({
    data: {
      userId: newUser.id,
      roleId: roleRecord.id,
    },
  });

  // Invalidate cache (remove outdated user data)
  await redis.del(`user:${newUser.id}`);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: "User",
  };
};

// **Login User with Caching**
export const loginUserService = async (email: string, password: string) => {
  console.log("Attempting login with email:", email);

  // **Check Cache First (Don't store password in cache!)**
  const cachedUser = await redis.get(`user:email:${email}`);
  if (cachedUser) {
    const user = JSON.parse(cachedUser);
    console.log("User retrieved from cache:", user);

    // Fetch password from DB instead of Redis
    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) throw new Error("Unauthorized: Invalid email or password");

    const isPasswordValid = await bcrypt.compare(password, dbUser.password);
    if (!isPasswordValid) throw new Error("Unauthorized: Invalid email or password");

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, roles: user.roles, permissions: user.permissions },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Cache token
    await redis.setex(`token:${user.id}`, CACHE_EXPIRATION, token);
    return token;
  }


  // **Fetch from DB if not in cache**
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      roles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("Unauthorized: Invalid email or password");
  }

  // **Check password securely**
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Unauthorized: Invalid email or password");
  }

  // Extract roles and permissions
  const roles = user.roles.map((ur) => ur.role.name);
  const permissions = user.roles.flatMap((ur) =>
    ur.role.rolePermissions.map((rp) => rp.permission.action)
  );

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, roles, permissions },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );

  // **Cache user data (WITHOUT password)**
  // Store user in cache without hashed password
  await redis.setex(`user:email:${email}`, CACHE_EXPIRATION, JSON.stringify({
    id: user.id, email, roles, permissions
  }));

  await redis.setex(`token:${user.id}`, CACHE_EXPIRATION, token);

  return token;
};

// **Logout User (Invalidate Token)**
export const logoutUserService = async (userId: string): Promise<{ message: string }> => {
  if (!userId) {
    throw new Error("Missing userId in logout request");
  }

  console.log("Logging out user:", userId);

  // Remove cached user session
  await redis.del(`user:${userId}`);
  await redis.del(`token:${userId}`);

  return { message: "Logged out successfully. Token invalidated." };
};

// Function to close Prisma connection
export const closePrisma = async () => {
  await prisma.$disconnect();
};

export { prisma };