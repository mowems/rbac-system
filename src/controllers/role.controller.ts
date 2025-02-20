import { Request, Response } from 'express';
import {
  createRoleService,
  getRolesService,
  getRoleByIdService,
  updateRoleService,
  deleteRoleService,
} from '../services/role.service';

// Create a new role
export const createRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const role = await createRoleService(name);
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: 'Error creating role' });
  }
};

// Get all roles
export const getRoles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = await getRolesService();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching roles' });
  }
};

// Get a specific role by ID
export const getRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const role = await getRoleByIdService(id);

    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    res.json(role);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching role' });
  }
};

// Update role details
export const updateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedRole = await updateRoleService(id, name);
    res.json(updatedRole);
  } catch (error) {
    res.status(500).json({ error: 'Error updating role' });
  }
};

// Delete a role
export const deleteRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteRoleService(id);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting role' });
  }
};
