import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new permission
export const createPermissionService = async (action: string) => {
  return prisma.permission.create({
    data: { action },
  });
};

// Get all permissions
export const getPermissionsService = async () => {
  return prisma.permission.findMany();
};

// Get a specific permission by ID
export const getPermissionByIdService = async (id: string) => {
  return prisma.permission.findUnique({ where: { id } });
};

// Update permission details
export const updatePermissionService = async (id: string, action: string) => {
  return prisma.permission.update({
    where: { id },
    data: { action },
  });
};

// Delete a permission
export const deletePermissionService = async (id: string) => {
  return prisma.permission.delete({ where: { id } });
};
