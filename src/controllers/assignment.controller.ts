import { Request, Response } from 'express';
import {
  assignRoleToUserService,
  getUserRolesService,
  assignPermissionToRoleService,
  getRolePermissionsService,
} from '../services/assignment.service';

// Assign a role to a user
export const assignRoleToUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    console.log(`Assigning role...`);
    console.log(`User ID: ${userId}`);
    console.log(`Role ID: ${roleId}`);

    await assignRoleToUserService(userId, roleId);
    res.json({ message: "Role assigned successfully" });
  } catch (error: any) {
    console.log('Error:', error);
    res.status(error.message === "User already has this role" ? 400 : 500).json({ error: error.message });
  }
};

// Get all roles assigned to a user
export const getUserRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const roles = await getUserRolesService(userId);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user roles' });
  }
};

// Assign a permission to a role
export const assignPermissionToRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;

    const rolePermission = await assignPermissionToRoleService(roleId, permissionId);
    res.status(201).json(rolePermission);
  } catch (error) {
    res.status(500).json({ error: 'Error assigning permission to role' });
  }
};

// Get all permissions assigned to a role
export const getRolePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roleId } = req.params;
    const permissions = await getRolePermissionsService(roleId);
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching role permissions' });
  }
};
