import { Request, Response } from 'express';
import {
  createPermissionService,
  getPermissionsService,
  getPermissionByIdService,
  updatePermissionService,
  deletePermissionService,
} from '../services/permission.service';

// Create a new permission
export const createPermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action } = req.body;
    const permission = await createPermissionService(action);
    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ error: 'Error creating permission' });
  }
};

// Get all permissions
export const getPermissions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const permissions = await getPermissionsService();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching permissions' });
  }
};

// Get a specific permission by ID
export const getPermissionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const permission = await getPermissionByIdService(id);

    if (!permission) {
      res.status(404).json({ error: 'Permission not found' });
      return;
    }

    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching permission' });
  }
};

// Update permission details
export const updatePermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const updatedPermission = await updatePermissionService(id, action);
    res.json(updatedPermission);
  } catch (error) {
    res.status(500).json({ error: 'Error updating permission' });
  }
};

// Delete a permission
export const deletePermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await deletePermissionService(id);
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting permission' });
  }
};
