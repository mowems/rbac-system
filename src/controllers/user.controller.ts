import { Request, Response } from 'express';
import {
  createUserService,
  getUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
} from '../services/user.service';
import { AuthenticatedRequest } from '../types/custom';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const user = await createUserService(name, email, password);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
};

// Get all users
export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: No user found" });
      return;
    }

    const userId = req.user.id;

    // Fetch the full user with roles properly included
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }, // Ensure roles are fetched
    });

    if (!requestingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Create a formatted user object for getUsersService()
    const formattedRequestingUser = {
      id: requestingUser.id,
      roles: requestingUser.roles?.map((r: { role: { name: any; }; }) => r.role.name) || [],
    };

    // Pass only necessary fields
    const users = await getUsersService(formattedRequestingUser);

    console.log("Users found:", users);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

// Get a specific user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
};

// Update user details
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const updatedUser = await updateUserService(id, name, email, password);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteUserService(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
};
