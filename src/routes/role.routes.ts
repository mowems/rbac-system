import { Router } from 'express';
import { createRole, getRoles, getRoleById, updateRole, deleteRole } from '../controllers/role.controller';
import { authenticateUser, checkPermission } from '../middleware/authMiddleware';

const router = Router();

// Role Routes
router.post('/', authenticateUser, checkPermission(['WRITE_ROLE']), createRole); // Create a new role
router.get('/', authenticateUser, checkPermission(['READ_ROLE']), getRoles); // Get all roles
router.get('/:id', authenticateUser, checkPermission(['READ_ROLE']), getRoleById); // Get a specific role by Id
router.put('/:id', authenticateUser, checkPermission(['WRITE_ROLE']), updateRole); // Update role
router.delete('/:id', authenticateUser, checkPermission(['DELETE_ROLE']), deleteRole); // Delete a role

export default router;