import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hasRequiredCertifications, getCertificationsCount, REQUIRED_CERTIFICATIONS } from '../utils/certificateValidator';
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';
import { NotificationService } from '../utils/notification.service';
import fs from 'fs'; // Import fs for file operations
import path from 'path'; // Import path for path operations

// Create a prisma instance for normal usage
export const prisma = new PrismaClient();

export class CertificationController {
  private db: any;

  constructor(dbClient = prisma) {
    this.db = dbClient;
  }

  /**
   * Upload a new certification or update an existing one.
   * If updating, it will delete the old image file.
   * @param req Express request
   * @param res Express response
   */
  async uploadCertification(req: Request, res: Response): Promise<void> {
    try {
      const { 
        userId, 
        certificationName, 
        certificationType, 
        certificateNumber, 
        issuedDate, 
        expiryDate, 
        imageUrl // This is the new image URL from the upload service
      } = req.body;

      // Validate input
      if (!userId || !certificationName || !certificationType || !certificateNumber || !issuedDate || !expiryDate || !imageUrl) {
        sendErrorResponse(res, 'Missing required fields for certification', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Check if this certificate type already exists for the user
      const existingCert = await this.db.userCertification.findFirst({
        where: {
          userId,
          certificationType
        }
      });

      if (existingCert) {
        // If certificate exists, and a new image URL is provided, delete the old image.
        if (existingCert.imageUrl && existingCert.imageUrl !== imageUrl) {
          const oldImagePath = path.join(__dirname, '../../uploads', existingCert.imageUrl.replace('/uploads/', ''));
          try {
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
              console.log(`Successfully deleted old certificate image: ${oldImagePath}`);
            }
          } catch (fileError) {
            console.error(`Failed to delete old certificate image ${oldImagePath}:`, fileError);
            // Decide if this error should prevent the update or just be logged.
            // For now, we'll log and continue.
          }
        }

        // Update existing certification
        const updatedCert = await this.db.userCertification.update({
          where: {
            id: existingCert.id
          },
          data: {
            certificationName,
            certificateNumber,
            issuedDate: new Date(issuedDate),
            expiryDate: new Date(expiryDate),
            imageUrl, // new image URL
            status: 'PENDING', // Reset to pending if it was previously verified/rejected
            uploadedAt: new Date(),
            verifiedAt: null,
            verifierAdminId: null,
            rejectionReason: null
          }
        });

        // Create notification for the user that the certification was updated
        try {
          await NotificationService.createNotification({
            recipientUserId: userId,
            type: 'CERTIFICATION_UPDATED',
            title: 'Certificación Actualizada',
            message: `Tu certificación "${certificationName}" ha sido actualizada y está pendiente de revisión.`,
            relatedEntityType: 'CERTIFICATION',
            relatedEntityId: updatedCert.id
          });
          
          // Also notify admins about the updated certification
          await NotificationService.notifyAdminsAboutCertification(
            updatedCert.id,
            userId,
            certificationName
          );
          
          console.log(`[CertificationController.uploadCertification] Notification sent for certification update: ${updatedCert.id}`);
        } catch (notificationError) {
          console.error('[CertificationController.uploadCertification] Error creating notification for update:', notificationError);
          // Continue even if notification fails
        }

        sendSuccessResponse(res, updatedCert, HttpStatusCode.OK);
        return;
      }

      // Create new certification if it doesn't exist
      const certification = await this.db.userCertification.create({
        data: {
          userId,
          certificationName,
          certificationType,
          certificateNumber,
          issuedDate: new Date(issuedDate),
          expiryDate: new Date(expiryDate),
          imageUrl,
          status: 'PENDING'
        }
      });

      // Create notification for the user that the certification was uploaded
      try {
        await NotificationService.createNotification({
          recipientUserId: userId,
          type: 'CERTIFICATION_UPLOADED',
          title: 'Certificación Enviada',
          message: `Tu certificación "${certificationName}" ha sido enviada y está pendiente de revisión.`,
          relatedEntityType: 'CERTIFICATION',
          relatedEntityId: certification.id
        });
        
        // Also notify admins about the new certification
        await NotificationService.notifyAdminsAboutCertification(
          certification.id,
          userId,
          certificationName
        );
        
        console.log(`[CertificationController.uploadCertification] Notification sent for new certification: ${certification.id}`);
      } catch (notificationError) {
        console.error('[CertificationController.uploadCertification] Error creating notification for upload:', notificationError);
        // Continue even if notification fails
      }

      sendSuccessResponse(res, certification, HttpStatusCode.CREATED);
    } catch (error: any) {
      console.error('Error in uploadCertification controller:', error);
      // Check for Prisma-specific validation errors if applicable
      if (error.name === 'PrismaClientValidationError') {
        sendErrorResponse(res, `Validation error: ${error.message}`, HttpStatusCode.BAD_REQUEST);
        return;
      }
      sendErrorResponse(res, 'Server error during certification upload', HttpStatusCode.INTERNAL_SERVER_ERROR);
      return;
    }
  }

  /**
   * Get certifications for a specific user
   * @param req Express request with userId
   * @param res Express response
   */
  async getUserCertifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        sendErrorResponse(res, "User ID is required", HttpStatusCode.BAD_REQUEST);
        return;
      }

      const certifications = await this.db.userCertification.findMany({
        where: { userId: userId },
        orderBy: { uploadedAt: 'desc' }
      });
      
      // Get server base URL
      const protocol = req.protocol;
      const host = req.get('host') || 'localhost:3001';
      const baseUrl = `${protocol}://${host}`;
      
      // Process certification images to ensure absolute URLs
      const processedCertifications = certifications.map(cert => {
        if (cert.imageUrl && !cert.imageUrl.startsWith('http')) {
          cert.imageUrl = this.ensureAbsoluteUrl(cert.imageUrl, baseUrl);
        }
        return cert;
      });

      sendSuccessResponse(res, processedCertifications);
    } catch (error: any) {
      console.error("Error fetching user certifications:", error);
      sendErrorResponse(res, error.message || "Error fetching user certifications", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Verify if a user has all required certifications
   * @param req Express request
   * @param res Express response
   */
  async verifyUserCertifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const hasAllCertifications = await hasRequiredCertifications(userId, this.db);
      const certificationsCount = await getCertificationsCount(userId, this.db);

      sendSuccessResponse(res, { 
        hasAllCertifications,
        certificationsCount
      });
    } catch (error: any) {
      console.error('Error verifying certifications:', error);
      sendErrorResponse(res, 'Error verifying certifications', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all certifications with filtering and pagination (for admin view)
   * @param req Express request with query params: status, userId, page, limit, sortBy, sortOrder
   * @param res Express response
   */
  async getAllCertificationsAdmin(req: Request, res: Response): Promise<void> {
    try {
      // Extract query parameters (consider adding validation with Zod)
      const { 
        status, 
        userId, 
        page = '1', 
        limit = '10',
        sortBy = 'uploadedAt', // Default sort field
        sortOrder = 'desc'    // Default sort order
      } = req.query as { 
        status?: string; 
        userId?: string; 
        page?: string; 
        limit?: string;
        sortBy?: 'uploadedAt' | 'verifiedAt' | 'certificationName';
        sortOrder?: 'asc' | 'desc';
      };

      console.log(`[CertificationController.getAllCertificationsAdmin] Query params:`, req.query);

      // Parse pagination parameters
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause for filtering
      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (userId) {
        where.userId = userId;
      }

      // Fetch certifications with user data and pagination
      const [certifications, totalCount] = await Promise.all([
        this.db.userCertification.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { [sortBy]: sortOrder },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImage: true
              }
            }
          }
        }),
        this.db.userCertification.count({ where })
      ]);
      
      // Get server base URL for image URLs
      const protocol = req.protocol;
      const host = req.get('host') || 'localhost:3001';
      const baseUrl = `${protocol}://${host}`;
      
      // Process certification data to ensure imageUrls are absolute
      const processedCertifications = certifications.map(cert => {
        // Handle user profile image
        if (cert.user && cert.user.profileImage) {
          if (!cert.user.profileImage.startsWith('http')) {
            cert.user.profileImage = this.ensureAbsoluteUrl(cert.user.profileImage, baseUrl);
          }
        }
        
        // Handle certification image
        if (cert.imageUrl && !cert.imageUrl.startsWith('http')) {
          cert.imageUrl = this.ensureAbsoluteUrl(cert.imageUrl, baseUrl);
        }
        
        return cert;
      });

      // Calculate pagination information
      const totalPages = Math.ceil(totalCount / limitNum);
      
      // Construct structured response
      const response = {
        certifications: processedCertifications,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: totalPages
        }
      };

      // Log response shape for debugging
      console.log(`[CertificationController.getAllCertificationsAdmin] Response structure:`, {
        certifications: `Array of ${processedCertifications.length} items`,
        paginationInfo: response.pagination
      });

      // Send response with consistent format
      sendSuccessResponse(res, response);
    } catch (error: any) {
      console.error('[CertificationController.getAllCertificationsAdmin] Error:', error);
      sendErrorResponse(res, 'Failed to fetch certifications: ' + (error.message || 'Unknown error'), HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Helper method to ensure image URLs are absolute
   */
  private ensureAbsoluteUrl(url: string, baseUrl: string): string {
    // If URL is already absolute, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Otherwise, prepend the base URL
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    } else {
      return `${baseUrl}/${url}`;
    }
  }

  /**
   * Approve a certification
   * @param req Express request
   * @param res Express response
   */
  async approveCertification(req: Request, res: Response): Promise<void> {
    try {
      const { certificationId } = req.params;
      const { adminId } = req.body;

      if (!adminId) {
        sendErrorResponse(res, 'Admin ID is required', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Get certification information before updating
      const certification = await this.db.userCertification.findUnique({
        where: { id: certificationId }
      });

      if (!certification) {
        sendNotFoundResponse(res, 'Certification not found');
        return;
      }

      // Define status explicitly for the update
      const status = 'VERIFIED';
      
      const updatedCertification = await this.db.userCertification.update({
        where: {
          id: certificationId
        },
        data: {
          status, // Use the explicit status variable
          verifiedAt: new Date(),
          verifierAdminId: adminId
        }
      });

      // Send notification to the user
      try {
        await NotificationService.notifyCertificationStatusChange(
          certification.userId,
          certificationId,
          status,
          certification.certificationName
        );
        console.log(`[CertificationController.approveCertification] Notification sent for certification approval: ${certificationId}`);
      } catch (notificationError) {
        console.error('[CertificationController.approveCertification] Error creating notification:', notificationError);
        // Continue with certification approval even if notification fails
      }

      sendSuccessResponse(res, updatedCertification);
    } catch (error: any) {
      console.error('Error approving certification:', error);
      sendErrorResponse(res, 'Error approving certification', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Reject a certification
   * @param req Express request
   * @param res Express response
   */
  async rejectCertification(req: Request, res: Response): Promise<void> {
    try {
      const { certificationId } = req.params;
      const { adminId, rejectionReason } = req.body;

      if (!adminId || !rejectionReason) {
        sendErrorResponse(res, 'Admin ID and rejection reason are required', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Get certification information before updating
      const certification = await this.db.userCertification.findUnique({
        where: { id: certificationId }
      });

      if (!certification) {
        sendNotFoundResponse(res, 'Certification not found');
        return;
      }

      // Define status explicitly for the update
      const status = 'REJECTED';
      
      const updatedCertification = await this.db.userCertification.update({
        where: {
          id: certificationId
        },
        data: {
          status, // Use the explicit status variable
          rejectionReason,
          verifierAdminId: adminId
        }
      });

      // Send notification to the user
      try {
        await NotificationService.notifyCertificationStatusChange(
          certification.userId,
          certificationId,
          status,
          certification.certificationName
        );
        console.log(`[CertificationController.rejectCertification] Notification sent for certification rejection: ${certificationId}`);
      } catch (notificationError) {
        console.error('[CertificationController.rejectCertification] Error creating notification:', notificationError);
        // Continue with certification rejection even if notification fails
      }

      sendSuccessResponse(res, updatedCertification);
    } catch (error: any) {
      console.error('Error rejecting certification:', error);
      sendErrorResponse(res, 'Error rejecting certification', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get details for each of the 4 required certifications for a user.
   * @param req Express request
   * @param res Express response
   */
  async getRequiredCertificationDetails(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      // Use authenticated user ID if 'me' is passed
      const targetUserId = userId === 'me' ? req.user?.userId : userId;

      if (!targetUserId) {
        sendErrorResponse(res, 'User ID not found or user not authenticated', HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Fetch all certifications for the target user
      const userCertifications = await this.db.userCertification.findMany({
        where: {
          userId: targetUserId,
          certificationType: { 
            in: REQUIRED_CERTIFICATIONS // Only fetch types that are in the required list
          }
        },
        orderBy: {
          uploadedAt: 'desc'
        }
      });

      // Create a map to store the results, initializing with null
      const requiredCertDetails: Record<string, any | null> = {};
      REQUIRED_CERTIFICATIONS.forEach(type => {
        requiredCertDetails[type] = null; // Initialize as null
      });

      // Populate the map with found certifications
      userCertifications.forEach(cert => {
        if (requiredCertDetails.hasOwnProperty(cert.certificationType)) {
          requiredCertDetails[cert.certificationType] = cert; // Replace null with the cert object
        }
      });

      sendSuccessResponse(res, requiredCertDetails);
    } catch (error: any) {
      console.error('Error fetching required certification details:', error);
      sendErrorResponse(res, 'Error fetching required certification details', HttpStatusCode.INTERNAL_SERVER_ERROR);
      // No return needed here as sendErrorResponse is the last statement
    }
  }

  /**
   * Get a single certification by ID
   * @param req Express request with certificationId
   * @param res Express response
   */
  async getCertificationById(req: Request, res: Response): Promise<void> {
    try {
      const { certificationId } = req.params;
      
      if (!certificationId) {
        sendErrorResponse(res, "Certification ID is required", HttpStatusCode.BAD_REQUEST);
        return;
      }
      
      // Validate MongoDB ObjectID format (24 character hex string)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(certificationId)) {
        sendErrorResponse(res, "Invalid certification ID format", HttpStatusCode.BAD_REQUEST);
        return;
      }

      const certification = await this.db.userCertification.findUnique({
        where: { id: certificationId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true
            }
          },
          verifierAdmin: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!certification) {
        sendNotFoundResponse(res, "Certification not found");
        return;
      }

      // Get server base URL
      const protocol = req.protocol;
      const host = req.get('host') || 'localhost:3001';
      const baseUrl = `${protocol}://${host}`;
      
      // Process certification image to ensure absolute URL
      if (certification.imageUrl && !certification.imageUrl.startsWith('http')) {
        certification.imageUrl = this.ensureAbsoluteUrl(certification.imageUrl, baseUrl);
      }
      
      // Process user profile image if present
      if (certification.user && certification.user.profileImage && 
          !certification.user.profileImage.startsWith('http')) {
        certification.user.profileImage = this.ensureAbsoluteUrl(
          certification.user.profileImage, baseUrl
        );
      }

      sendSuccessResponse(res, certification);
    } catch (error: any) {
      console.error("Error fetching certification:", error);
      sendErrorResponse(res, error.message || "Error fetching certification", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}

// Create and export a singleton instance for use in routes
export const certificationController = new CertificationController(); 