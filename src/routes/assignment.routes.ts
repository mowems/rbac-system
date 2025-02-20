import { Router } from 'express';
import {
  assignRoleToUser,
  assignPermissionToRole,
  getUserRoles,
  getRolePermissions
} from '../controllers/assignment.controller';
import { authenticateUser, checkPermission } from '../middleware/authMiddleware';

const router = Router();

// Authenticate user before checking permissions
router.post(
  '/users/:userId/assign-role',
  authenticateUser,
  checkPermission(['ASSIGN_ROLE']),
  assignRoleToUser
);

router.post(
  '/roles/:roleId/assign-permission',
  authenticateUser,
  checkPermission(['ASSIGN_PERMISSION']),
  assignPermissionToRole
);

router.get(
  '/users/:userId/roles',
  authenticateUser,
  checkPermission(['READ_ROLE_ASSIGNMENTS']),
  getUserRoles
);

router.get(
  '/roles/:roleId/permissions',
  authenticateUser,
  checkPermission(['READ_ROLE_PERMISSIONS']),
  getRolePermissions
);

export default router;
