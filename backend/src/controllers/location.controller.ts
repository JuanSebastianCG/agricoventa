import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

const prisma = new PrismaClient();

export class LocationController {
  private db: PrismaClient;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

  async createLocation(req: Request, res: Response): Promise<void> {
    try {
      const locationData = req.body; // TODO: Add Zod validation for locationData
      const userId = req.user?.userId; // Get userId from authenticated user

      if (!userId) {
        sendErrorResponse(res, 'User not authenticated', HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Basic validation (consider a Zod schema)
      if (!locationData.addressLine1 || !locationData.city || !locationData.department) {
        sendErrorResponse(res, 'AddressLine1, City, and Department are required for location', HttpStatusCode.BAD_REQUEST);
        return;
      }

      const newLocation = await this.db.location.create({
        data: {
          ...locationData,
          // No explicit userId field on Location model itself, 
          // but we might want to link it to the user who created it if schema changes,
          // or update user's primaryLocationId if this new location should become primary.
          // For now, just creating the location.
        }
      });

      // Check if this new location should become the user's primary location
      // This is an assumption for now; adjust if user should explicitly set primary location elsewhere.
      await this.db.user.update({
        where: { id: userId },
        data: { primaryLocationId: newLocation.id },
      });

      sendSuccessResponse(res, newLocation, HttpStatusCode.CREATED);
    } catch (error: any) {
      console.error('Error creating location:', error);
      sendErrorResponse(res, 'Failed to create location', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getLocationsByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        sendErrorResponse(res, 'User ID is required', HttpStatusCode.BAD_REQUEST);
        return;
      }

      const locations = await this.db.location.findMany({
        where: {
          users: {
            some: {
              id: userId,
            },
          },
        },
        // orderBy: { createdAt: 'desc' }, // Optional
      });

      // Return empty array if no locations, not an error
      sendSuccessResponse(res, locations);

    } catch (error: any) {
      console.error(`Error fetching locations for user ${req.params.userId}:`, error);
      sendErrorResponse(res, 'Failed to fetch user locations', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}

export const locationController = new LocationController(); 