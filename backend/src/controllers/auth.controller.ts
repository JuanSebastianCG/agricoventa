import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginDto, CreateUserDto, ChangePasswordDto } from "../schemas/user.schema";
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHandler";
import HttpStatusCode from "../utils/HttpStatusCode";

const prisma = new PrismaClient();

export class AuthController {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h";
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-key";
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  }

  /**
   * Register a new user
   * @param req Express request
   * @param res Express response
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserDto = req.body;
      
      // Check if username or email already exists
      const existingUsername = await prisma.user.findUnique({
        where: { username: userData.username }
      });
      
      if (existingUsername) {
        sendErrorResponse(res, "Username already exists", HttpStatusCode.BAD_REQUEST);
        return;
      }

      const existingEmail = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingEmail) {
        sendErrorResponse(res, "Email already exists", HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Check if phone number is provided and already exists
      if (userData.phoneNumber) {
        const existingPhoneNumber = await prisma.user.findUnique({
          where: { phoneNumber: userData.phoneNumber }
        });
        
        if (existingPhoneNumber) {
          sendErrorResponse(res, "Phone number already exists", HttpStatusCode.BAD_REQUEST);
          return;
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          userType: userData.userType,
          primaryLocationId: userData.primaryLocationId,
        },
      });

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.userType);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/api/auth/refresh",
      });

      // Map user to response object (remove sensitive data)
      const userResponse = this.mapToUserResponse(user);

      sendSuccessResponse(
        res,
        {
          user: userResponse,
          token: accessToken,
        },
        HttpStatusCode.CREATED
      );
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        const fieldName = error.meta?.target?.[0] || '';
        if (fieldName === 'phone_number' || fieldName === 'phoneNumber') {
          sendErrorResponse(res, "Phone number already exists", HttpStatusCode.BAD_REQUEST);
          return;
        } else if (fieldName === 'email') {
          sendErrorResponse(res, "Email already exists", HttpStatusCode.BAD_REQUEST);
          return;
        } else if (fieldName === 'username') {
          sendErrorResponse(res, "Username already exists", HttpStatusCode.BAD_REQUEST);
          return;
        }
      }

      // If other Prisma error
      if (error.name === 'PrismaClientKnownRequestError') {
        sendErrorResponse(res, `Registration error: ${error.message}`, HttpStatusCode.BAD_REQUEST);
        return;
      }

      // For other errors
      sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * Log in a user
   * @param req Express request
   * @param res Express response
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginDto = req.body;
      
      // Find user by username
      const user = await prisma.user.findUnique({
        where: { username: loginData.username }
      });
      
      if (!user) {
        sendErrorResponse(res, "Invalid username or password", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        sendErrorResponse(res, "Account is inactive", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
      if (!isPasswordValid) {
        sendErrorResponse(res, "Invalid username or password", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.userType);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/api/auth/refresh",
      });

      // Map user to response object
      const userResponse = this.mapToUserResponse(user);

      sendSuccessResponse(res, {
        user: userResponse,
        token: accessToken,
      });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.UNAUTHORIZED);
    }
  }

  /**
   * Log out a user
   * @param req Express request
   * @param res Express response
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendErrorResponse(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Clear refresh token in database
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      // Clear refresh token cookie
      res.clearCookie("refreshToken", {
        httpOnly: true,
        path: "/api/auth/refresh",
      });

      sendSuccessResponse(res, { message: "Logged out successfully" });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Refresh access token
   * @param req Express request
   * @param res Express response
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        sendErrorResponse(res, "No refresh token provided", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret) as { userId: string };

      // Find user and verify refresh token matches
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || user.refreshToken !== refreshToken) {
        sendErrorResponse(res, "Invalid refresh token", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user.id, user.userType);
      const newRefreshToken = this.generateRefreshToken(user.id);

      // Update refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      // Set new refresh token cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/api/auth/refresh",
      });

      // Map user to response object
      const userResponse = this.mapToUserResponse(user);

      sendSuccessResponse(res, {
        user: userResponse,
        token: newAccessToken,
      });
    } catch (error: any) {
      console.error('Refresh token error:', error);
      if (error.name === "TokenExpiredError") {
        sendErrorResponse(res, "Refresh token expired", HttpStatusCode.UNAUTHORIZED);
        return;
      }
      sendErrorResponse(res, "Failed to refresh token", HttpStatusCode.UNAUTHORIZED);
    }
  }

  /**
   * Get current user profile
   * @param req Express request
   * @param res Express response
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendErrorResponse(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          primaryLocation: true,
        },
      });

      if (!user) {
        sendErrorResponse(res, "User not found", HttpStatusCode.NOT_FOUND);
        return;
      }

      const userResponse = this.mapToUserResponse(user);
      sendSuccessResponse(res, userResponse);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Change user password
   * @param req Express request
   * @param res Express response
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendErrorResponse(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      const { currentPassword, newPassword }: ChangePasswordDto = req.body;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        sendErrorResponse(res, "User not found", HttpStatusCode.NOT_FOUND);
        return;
      }

      // Validate current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        sendErrorResponse(res, "Current password is incorrect", HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      sendSuccessResponse(res, { message: "Password changed successfully" });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate an access token
   * @param userId User ID
   * @param userType User type
   * @returns JWT access token
   */
  private generateAccessToken(userId: string, userType: string): string {
    return jwt.sign(
      { userId, userType },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );
  }

  /**
   * Generate a refresh token
   * @param userId User ID
   * @returns JWT refresh token
   */
  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiresIn as jwt.SignOptions['expiresIn'] }
    );
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
      isActive: user.isActive,
    };
  }
} 