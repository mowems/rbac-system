import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { authenticateUser, checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticateUser, checkPermission(['WRITE_USER']), createUser);
router.get('/', authenticateUser, checkPermission(['READ_USER']), getUsers);
router.get('/:id', authenticateUser, checkPermission(['READ_USER']), getUserById);
router.patch('/:id', authenticateUser, checkPermission(['WRITE_USER']), updateUser);
router.delete('/:id', authenticateUser, checkPermission(['DELETE_USER']), deleteUser);

export default router;
