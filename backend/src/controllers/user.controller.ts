import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { UpdateUserDto } from "../schemas/user.schema";
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler";
import HttpStatusCode from "../utils/HttpStatusCode";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// Custom error class for API errors
class ApiError extends Error {
  constructor(
    public statusCode: number, 
    public message: string,
    public code: string = 'API_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        userType: string;
      }
    }
  }
}

export class UserController {
  /**
   * Helper method to get full profile image URL
   * @param imagePath Path to the profile image
   * @returns Full URL to the profile image
   */
  private getProfileImageUrl(imagePath: string | null): string | null {
    if (!imagePath) return null;
    
    // If the path is already a full URL (starts with http:// or https://), use it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Use the port from the environment or the updated fallback
    const port = process.env.PORT || '3001';
    const apiUrl = process.env.API_URL || `http://localhost:${port}`;
    
    // Remove any leading slash for consistency
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // Return the full URL
    return `${apiUrl}/${cleanPath}`;
  }

  /**
   * Get a user by ID
   * @param req Express request
   * @param res Express response
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;

      // Handle "me" special case
      if (userId === 'me') {
        if (!req.user?.userId) {
          throw new ApiError(401, 'No autorizado', 'UNAUTHORIZED');
        }
        const user = await prisma.user.findUnique({
          where: { id: req.user.userId }
        });
        
        if (!user) {
          throw new ApiError(404, 'Usuario no encontrado', 'USER_NOT_FOUND');
        }

        // Map user to response object (remove sensitive data)
        const userResponse = this.mapToUserResponse(user);
        sendSuccessResponse(res, userResponse);
        return;
      }

      // Regular user lookup by ID
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new ApiError(404, 'Usuario no encontrado', 'USER_NOT_FOUND');
      }

      // Map user to response object (remove sensitive data)
      const userResponse = this.mapToUserResponse(user);
      sendSuccessResponse(res, userResponse);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor'
          }
        });
      }
    }
  }

  /**
   * Update a user's profile
   * @param req Express request
   * @param res Express response
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const actualUserId = userId === 'me' ? req.user?.userId : userId;

      if (!actualUserId) {
        throw new ApiError(401, 'No autorizado');
      }

      const user = await prisma.user.findUnique({
        where: { id: actualUserId }
      });

      if (!user) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      const updatedUser = await prisma.user.update({
        where: { id: actualUserId },
        data: req.body,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          isActive: true,
          profileImage: true,
          phoneNumber: true,
          primaryLocationId: true,
          subscriptionType: true,
          createdAt: true
        }
      });

      const profileImageUrl = this.getProfileImageUrl(updatedUser.profileImage);

      res.json({
        success: true,
        data: {
          ...updatedUser,
          profileImage: profileImageUrl
        }
      });
    } catch (error) {
      console.error('Error in updateUser:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor'
          }
        });
      }
    }
  }

  /**
   * Check if a username is available
   * @param req Express request
   * @param res Express response
   */
  async checkUsernameAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== "string") {
        sendErrorResponse(res, "Username is required", HttpStatusCode.BAD_REQUEST);
        return;
      }
      
      const user = await prisma.user.findUnique({
        where: { username },
      });
      
      const isAvailable = !user;
      sendSuccessResponse(res, { isAvailable });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Check if an email is available
   * @param req Express request
   * @param res Express response
   */
  async checkEmailAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.query;

      if (!email || typeof email !== "string") {
        sendErrorResponse(res, "Email is required", HttpStatusCode.BAD_REQUEST);
        return;
      }
      
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      const isAvailable = !user;
      sendSuccessResponse(res, { isAvailable });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Deactivate a user account (soft delete)
   * @param req Express request
   * @param res Express response
   */
  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      
      // Check if the requesting user is deactivating their own account or is an admin
      if (req.user?.userId !== userId && req.user?.userType !== "ADMIN") {
        sendErrorResponse(res, "You can only deactivate your own account", HttpStatusCode.FORBIDDEN);
        return;
      }
      
      // Verify user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!userExists) {
        sendNotFoundResponse(res, "User not found");
        return;
      }

      // Deactivate user (soft delete)
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      sendSuccessResponse(res, { message: "User account deactivated successfully" });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update a user's profile image
   * @param req Express request
   * @param res Express response
   */
  async updateProfileImage(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const actualUserId = userId === 'me' ? req.user?.userId : userId;

      if (!actualUserId) {
        throw new ApiError(401, 'No autorizado');
      }

      const user = await prisma.user.findUnique({
        where: { id: actualUserId }
      });

      if (!user) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      if (!req.file) {
        throw new ApiError(400, 'No se proporcionó ninguna imagen');
      }

      // Eliminar la imagen anterior si existe
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, '../../', user.profileImage);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error al eliminar la imagen anterior:', error);
        }
      }

      const imageUrl = `uploads/profiles/${req.file.filename}`;

      const updatedUser = await prisma.user.update({
        where: { id: actualUserId },
        data: { profileImage: imageUrl },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          isActive: true,
          profileImage: true,
          phoneNumber: true,
          primaryLocationId: true,
          subscriptionType: true,
          createdAt: true
        }
      });

      const profileImageUrl = this.getProfileImageUrl(updatedUser.profileImage);

      res.json({
        success: true,
        data: {
          ...updatedUser,
          profileImage: profileImageUrl
        }
      });
    } catch (error) {
      console.error('Error in updateProfileImage:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor'
          }
        });
      }
    }
  }

  /**
   * Map user entity to user response (remove sensitive data)
   * @param user User entity
   * @returns User response without sensitive data
   */
  private mapToUserResponse(user: any): any {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      phoneNumber: user.phoneNumber || undefined,
      userType: user.userType,
      primaryLocationId: user.primaryLocationId || undefined,
      subscriptionType: user.subscriptionType || 'NORMAL',
      isActive: user.isActive,
      createdAt: user.createdAt,
      profileImage: user.profileImage 
        ? this.getProfileImageUrl(user.profileImage)
        : null
    };
  }

  // Update current user
  async updateCurrentUser(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'No authenticated user found', 'UNAUTHORIZED');
      }

      const userData = req.body;
      
      // Verify user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!userExists) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: userData,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          isActive: true,
          profileImage: true,
          phoneNumber: true,
          primaryLocationId: true,
          subscriptionType: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating current user:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: 'Internal server error'
          }
        });
      }
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          isActive: true,
          profileImage: true,
          phoneNumber: true,
          primaryLocationId: true,
          subscriptionType: true,
          createdAt: true
        }
      });

      if (!user) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      const profileImageUrl = this.getProfileImageUrl(user.profileImage);

      // Asegurarse de que la respuesta incluya la imagen de perfil
      const userResponse = {
        ...user,
        profileImage: profileImageUrl
      };

      res.json({
        success: true,
        data: userResponse
      });
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor'
          }
        });
      }
    }
  }

  /**
   * Get all users (admin only)
   * @param req Express request
   * @param res Express response
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // Verify admin authorization
      if (!req.user || req.user.userType !== 'ADMIN') {
        throw new ApiError(403, 'No autorizado para acceder a esta información', 'FORBIDDEN');
      }

      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          isActive: true,
          profileImage: true,
          phoneNumber: true,
          subscriptionType: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Map users to response objects (remove sensitive data and add profile image URLs)
      const usersResponse = users.map(user => ({
        ...user,
        profileImage: this.getProfileImageUrl(user.profileImage)
      }));

      sendSuccessResponse(res, usersResponse);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      } else {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor'
          }
        });
      }
    }
  }

  /**
   * Get a user's primary location
   * @param req Express request
   * @param res Express response
   */
  async getUserPrimaryLocation(req: Request, res: Response): Promise<void> {
    try {
      const { userId: paramUserId } = req.params;
      const actualUserId = paramUserId === 'me' ? req.user?.userId : paramUserId;

      if (!actualUserId) {
        sendErrorResponse(res, 'User ID not provided or user not authenticated.', HttpStatusCode.BAD_REQUEST);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: actualUserId },
        include: {
          primaryLocation: true, // Include the related location
        },
      });

      if (!user) {
        sendNotFoundResponse(res, 'User not found');
        return;
      }

      // Add detailed logging here
      console.log(`[UserController] User details for ${actualUserId}:`, JSON.stringify(user, null, 2));

      if (!user.primaryLocation) {
        console.error(`[UserController] Primary location not resolved for user ${actualUserId}. User's primaryLocationId is: ${user.primaryLocationId}`);
        sendNotFoundResponse(res, 'Primary location not set for this user');
        return;
      }

      sendSuccessResponse(res, user.primaryLocation);
    } catch (error: any) {
      console.error('Error fetching user primary location:', error);
      if (error instanceof ApiError) {
         sendErrorResponse(res, error.message, error.statusCode, error.code);
      } else {
        sendErrorResponse(res, 'Failed to fetch user primary location', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
  }
} 