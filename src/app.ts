import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import permissionRoutes from './routes/permission.routes';
import assignmentRoutes from './routes/assignment.routes';
import authRoutes from './routes/auth.routes';

// Import middleware
import { authenticateUser } from './middleware/authMiddleware';

dotenv.config();

const app: Application = express();

// Configuring Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Public Routes - Don't require authentication middleware
app.use('/api/auth', authRoutes); // Authentication routes

// Protected routes - require authentication
app.use('/api/users', authenticateUser, userRoutes);
app.use('/api/roles', authenticateUser, roleRoutes);
app.use('/api/permissions', authenticateUser, permissionRoutes);
app.use('/api/assignments', authenticateUser, assignmentRoutes);

// Default Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Ekko API!' });
});

export default app;
