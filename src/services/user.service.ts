import { PrismaClient } from '@prisma/client';
// import brcypt from 'bcryptjs';

const prisma = new PrismaClient();

// Defines a User type by resolving the return type of prisma.user.findUnique()
type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;

// Create a new user
export const createUserService = async (name: string, email: string, password: string) => {
  // Issue - Hash password: const hashedPassword = brcypt.hash(password, 10);
  return prisma.user.create({
    data: { name, email, password },
  });
};

// Get all users (excluding password)
export const getUsersService = async (requestingUser: { id: string; roles: string[] }) => {
  // Fetch full user details including location
  const fullRequestingUser = await prisma.user.findUnique({
    where: { id: requestingUser.id },
    include: { location: true, roles: { include: { role: true } } }, // Ensure location & roles are fetched
  });

  if (!fullRequestingUser) {
    throw new Error('Requesting user not found');
  }

  const userRoles = fullRequestingUser.roles.map((r: { role: { name: any; }; }) => r.role.name);

  let whereCondition: any = {};

  // Applying filter to get all users request by location - userRoles could be 'National', 'City', or 'Suburb' and determine the extent of what a user sees for this request
  // Because 'National', 'City', or 'Suburb' isn't included in seed.ts file, this function will always return all users for authenticated users
  if (userRoles.includes('National')) {
    // No filter needed
  } else if (userRoles.includes('City')) {
    if (!fullRequestingUser.location) {
      throw new Error('City role assigned but no location found.');
    }

    whereCondition = {
      OR: [
        { locationId: fullRequestingUser.location.id }, // Users in same city
        { location: { parentId: fullRequestingUser.location.id } }, // Users in child locations
      ],
    };
  } else if (userRoles.includes('Suburb')) {
    if (!fullRequestingUser.location) {
      throw new Error('Suburb role assigned but no location found.');
    }

    whereCondition = { locationId: fullRequestingUser.location.id }; // Users in the same suburb
  }

  // Fetch users based on role hierarchy
  const users = await prisma.user.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      email: true,
      location: { select: { name: true } }, // Ensure location is selected
    },
  });

  return users;
};

// Get a specific user by ID
export const getUserByIdService = async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

// Update user details
export const updateUserService = async (id: string, name: string, email: string, password: string) => {
  // Issue - Hash password
  return prisma.user.update({
    where: { id },
    data: { name, email, password },
  });
};

// Delete a user
export const deleteUserService = async (id: string) => {
  return prisma.user.delete({ where: { id } });
};
