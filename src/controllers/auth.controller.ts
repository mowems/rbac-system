import { Request, Response } from 'express';
import {
  registerUserService,
  loginUserService,
  logoutUserService,
} from '../services/auth.service';

// Register user
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const newUser = await registerUserService(name, email, password);
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error("Error registering user:", error);
    res.status(error.message === "User already exists" ? 400 : 500).json({ error: error.message });
  }
};

// Login user
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await loginUserService(email, password);
    res.json({ token });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(error.message.includes("Unauthorized") ? 401 : 500).json({ error: error.message });
  }
};

// Logout user
export const logoutUser = async (req: Request, res: Response) => {
  try {
     // Extract userId from request
     const userId = (req as any).user?.id;

     if (!userId) {
       return res.status(401).json({ error: "Unauthorized: No user ID found" });
     }

     const message = await logoutUserService(userId);
     res.json(message);
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
