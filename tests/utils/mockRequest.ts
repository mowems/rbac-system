import { Request } from 'express';

// Define an interface for the mock request
interface AuthenticatedRequest extends Request {
  user?: { id: string; roles: string[] };
}

// Create the mock function
export const mockRequest = (user: { id: string; roles: string[] }) => {
  return {
    user, // Mock `req.user`
  } as AuthenticatedRequest;
};
