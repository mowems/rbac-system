import { Router } from 'express';
import { createPermission, getPermissions, getPermissionById, updatePermission, deletePermission } from '../controllers/permission.controller';
import { authenticateUser, checkPermission } from '../middleware/authMiddleware';

const router = Router();

// Permission Routes
router.post('/', authenticateUser, checkPermission(['WRITE_PERMISSION']), createPermission); // Create a new permission
router.get('/', authenticateUser, checkPermission(['READ_PERMISSION']), getPermissions); // Get all permissions
router.get('/:id', authenticateUser, checkPermission(['READ_PERMISSION']), getPermissionById); // Get a specific permission by id
router.put('/:id', authenticateUser, checkPermission(['WRITE_PERMISSION']), updatePermission); // Update permission details
router.delete('/:id', authenticateUser, checkPermission(['DELETE_PERMISSION']), deletePermission); // Delete a permission

export default router;
