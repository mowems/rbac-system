import { Router } from 'express';
import { createPermission, getPermissions, getPermissionById, updatePermission, deletePermission } from '../controllers/permission.controller';
import { checkPermission } from '../middleware/authMiddleware';

const router = Router();

// Permission Routes
router.post('/', checkPermission(['WRITE_PERMISSION']), createPermission); // Create a new permission
router.get('/', checkPermission(['READ_PERMISSION']), getPermissions); // Get all permissions
router.get('/:id', checkPermission(['READ_PERMISSION']), getPermissionById); // Get a specific permission by id
router.put('/:id', checkPermission(['WRITE_PERMISSION']), updatePermission); // Update permission details
router.delete('/:id', checkPermission(['DELETE_PERMISSION']), deletePermission); // Delete a permission

export default router;
