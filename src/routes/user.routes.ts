import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.post('/', checkPermission(['WRITE_USER']), createUser);
router.get('/', checkPermission(['READ_USER']), getUsers);
router.get('/:id', checkPermission(['READ_USER']), getUserById);
router.patch('/:id', checkPermission(['WRITE_USER']), updateUser);
router.delete('/:id', checkPermission(['DELETE_USER']), deleteUser);

export default router;
