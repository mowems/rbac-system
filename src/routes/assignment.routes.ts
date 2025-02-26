import { Router } from 'express';
import {
  assignRoleToUser,
  assignPermissionToRole,
  getUserRoles,
  getRolePermissions
} from '../controllers/assignment.controller';
import { checkPermission } from '../middleware/authMiddleware';

const router = Router();

// Authenticate user before checking permissions
router.post(
  '/users/:userId/assign-role',
  checkPermission(['ASSIGN_ROLE']),
  assignRoleToUser
);

router.post(
  '/roles/:roleId/assign-permission',
  checkPermission(['ASSIGN_PERMISSION']),
  assignPermissionToRole
);

router.get(
  '/users/:userId/roles',
  checkPermission(['READ_ROLE_ASSIGNMENTS']),
  getUserRoles
);

router.get(
  '/roles/:roleId/permissions',
  checkPermission(['READ_ROLE_PERMISSIONS']),
  getRolePermissions
);

export default router;
