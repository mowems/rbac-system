import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new role
export const createRoleService = async (name: string) => {
  return prisma.role.create({
    data: { name },
  });
};

// Get all roles
export const getRolesService = async () => {
  return prisma.role.findMany();
};

// Get a specific role by ID
export const getRoleByIdService = async (id: string) => {
  return prisma.role.findUnique({ where: { id } });
};

// Update role details
export const updateRoleService = async (id: string, name: string) => {
  return prisma.role.update({
    where: { id },
    data: { name },
  });
};

// Delete a role
export const deleteRoleService = async (id: string) => {
  return prisma.role.delete({ where: { id } });
};
