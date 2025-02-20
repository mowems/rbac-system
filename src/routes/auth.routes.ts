import express from 'express';
import { loginUser, logoutUser, registerUser } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Register route - New user signup
router.post('/register', async (req, res, next) => {
  try {
    await registerUser(req, res);
  } catch (error) {
    console.error("Error in register route:", error);
    next(error);
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  try {
    await loginUser(req, res);
  } catch (error) {
    console.error("Error in login route:", error);
    next(error);
  }
});

// Logout route - Protected
router.post('/logout', authenticateUser, async (req, res, next) => {
  try {
    await logoutUser(req, res);
  } catch (error) {
    console.error("Error in logout route:", error);
    next(error);
  }
});

export default router;
