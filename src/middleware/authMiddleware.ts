import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { AuthenticatedRequest } from '../types/custom';

dotenv.config();
const prisma = new PrismaClient();

// Authentication Middleware
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {

  const token = req.headers.authorization?.split(" ")[1];

  // token and JWT_SECRET check
  if (!token) {
    console.log("No token provided");
    res.status(401).json({ error: "No token provided" });
    return;
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined in the environment variables");
    res.status(500).json({ error: "Internal Server Error: Missing JWT_SECRET" });
    return;
  }

  try {
    console.log("Verifying token...");
    // Verify token using jwt.verify and extract user roles and permissions
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload & {
      id: string;
      roles: string[];
      permissions: string[];
    };

    console.log("Decoded JWT:", decoded);

    // Ensure user exists in the database
    console.log(`Checking database for user ID: ${decoded.id}`);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      console.log(`User not found for ID: ${decoded.id}`);
      const allUsers = await prisma.user.findMany();
      console.log("All users in DB:", allUsers);

      res.status(401).json({ error: "User not found" });
      return;
    }

    // Modify request object and send to the next middleware function
    req.user = {
      id: user.id,
      roles: Array.isArray(decoded.roles) ? decoded.roles : [], // Ensure array
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [], // Ensure array
    };

    console.log("User authenticated successfully:", req.user);
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      console.error("Token has expired:", error);
      res.status(401).json({ error: "Token expired. Please log in again." });
    } else if (error.name === "JsonWebTokenError") {
      console.error("Invalid token:", error);
      res.status(401).json({ error: "Invalid token" });
    } else {
      console.error("Unexpected authentication error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

// Middleware to check user permissions
export const checkPermission =
  (requiredPermissions: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {

    if (!req.user || !req.user.permissions) {
      console.log("Access denied: No permissions assigned.");
      res.status(403).json({ error: 'Access denied. No permissions assigned.' });
      return;
    }

    console.log("Checking permissions for user:", req.user);

    // Ensure at least one required permission is available
    const hasPermission = requiredPermissions.some((perm) => req.user!.permissions!.includes(perm));

    if (!hasPermission) {
      console.log("Access denied: Missing required permissions.");
      res.status(403).json({ error: 'Access denied. Missing required permissions.' });
      return;
    }

    console.log("Permission granted");
    next();
  };
