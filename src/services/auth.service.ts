import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Register User
export const registerUserService = async (name: string, email: string, password: string) => {
  console.log("Registering user:", email);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.error("User already exists:", email);
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  console.log("User created:", newUser);

  // Assign default role "User"
  const roleRecord = await prisma.role.findUnique({ where: { name: "User" } });
  if (!roleRecord) {
    console.error("Role 'User' not found in DB!");
    throw new Error("Role 'User' does not exist");
  }

  console.log("Assigning role 'User' to:", newUser.email);

  await prisma.userRole.create({
    data: {
      userId: newUser.id,
      roleId: roleRecord.id,
    },
  });

  console.log("Role assigned:", newUser.email);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: "User",
  };
};

// Login User (Fixed)
export const loginUserService = async (email: string, password: string) => {
  console.log("Attempting login with email:", email);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      roles: { // Correct reference
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });


  if (!user) {
    console.log("User not found in DB");
    throw new Error("Unauthorized: Invalid email or password");
  }

  console.log("User found:", JSON.stringify(user, null, 2));

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    console.log("Password does not match");
    throw new Error("Unauthorized: Invalid email or password");
  }

  console.log("Generating JWT token...");

  // Extract roles and permissions from the user object
  const roles = user.roles.map((ur: { role: { name: any; }; }) => ur.role.name);
  const permissions = user.roles.flatMap((ur: { role: { rolePermissions: any[]; }; }) =>
    ur.role.rolePermissions.map((rp) => rp.permission.action)
  );

  console.log("Roles:", roles);
  console.log("Permissions:", permissions);
  console.log("JWT Payload:", { id: user.id, roles, permissions });

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }

  const token = jwt.sign(
    { id: user.id, roles, permissions },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  console.log("Token Generated:", token);

  return token;
};

// Logout User
export const logoutUserService = async (): Promise<{ message: string }> => {
  console.log("Logout successful.");
  return { message: "Logout successful. Please remove token from localStorage or cookies." };
};
