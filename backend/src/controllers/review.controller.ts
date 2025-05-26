import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CreateReviewDto, UpdateReviewDto, ReviewQueryParams } from "../schemas/review.schema";
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler";
import HttpStatusCode from "../utils/HttpStatusCode";
import { NotificationService } from "../utils/notification.service";

const prisma = new PrismaClient();

export class ReviewController {
  private db: PrismaClient;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

  /**
   * Create a new review
   * @param req Express request
   * @param res Express response
   */
  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const reviewData: CreateReviewDto = req.body;
      
      // Validate that user can only create reviews for themselves
      if (req.user && reviewData.userId !== req.user.userId) {
        sendErrorResponse(res, "You can only create reviews under your own user", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Check if product exists
      const product = await this.db.product.findUnique({
        where: { id: reviewData.productId }
      });

      if (!product) {
        sendNotFoundResponse(res, "Product not found");
        return;
      }

      // Check if the user has already reviewed this product
      const existingReview = await this.db.review.findFirst({
        where: {
          userId: reviewData.userId,
          productId: reviewData.productId
        }
      });

      if (existingReview) {
        sendErrorResponse(res, "You have already reviewed this product", HttpStatusCode.CONFLICT);
        return;
      }

      // Create the review
      const newReview = await this.db.review.create({
        data: {
          userId: reviewData.userId,
          productId: reviewData.productId,
          orderId: reviewData.orderId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          isVerifiedPurchase: reviewData.isVerifiedPurchase || false,
          isApproved: true // Auto-approve reviews for now
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Send notification to the product seller
      try {
        await NotificationService.notifyProductReview(
          product.sellerId,
          product.id,
          product.name,
          reviewData.rating
        );
        console.log(`[ReviewController.createReview] Notification sent for new review on product: ${product.id}`);
      } catch (notificationError) {
        console.error('[ReviewController.createReview] Error creating notification:', notificationError);
        // Continue even if notification fails
      }

      sendSuccessResponse(res, newReview, HttpStatusCode.CREATED);
    } catch (error: any) {
      console.error("Error creating review:", error);
      sendErrorResponse(res, 'Failed to create review', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get reviews for a product
   * @param req Express request
   * @param res Express response
   */
  async getProductReviews(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const queryParams: ReviewQueryParams = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: (req.query.sortBy as any) || "createdAt",
        sortOrder: (req.query.sortOrder as any) || "desc",
        minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
        isVerifiedPurchase: req.query.isVerifiedPurchase === "true" ? true : undefined,
        isApproved: true // Only return approved reviews
      };

      const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", minRating, isVerifiedPurchase } = queryParams;
      
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { 
        productId,
        isApproved: true 
      };

      if (minRating !== undefined) {
        where.rating = { gte: minRating };
      }

      if (isVerifiedPurchase !== undefined) {
        where.isVerifiedPurchase = isVerifiedPurchase;
      }

      // Get reviews with pagination
      const [reviews, total] = await Promise.all([
        this.db.review.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        this.db.review.count({ where }),
      ]);

      // Calculate average rating
      const averageRating = await this.db.review.aggregate({
        where: { productId, isApproved: true },
        _avg: { rating: true }
      });

      sendSuccessResponse(res, {
        reviews,
        stats: {
          totalReviews: total,
          averageRating: averageRating._avg.rating || 0
        },
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error("Error fetching product reviews:", error);
      sendErrorResponse(res, 'Failed to fetch reviews', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update a review
   * @param req Express request
   * @param res Express response
   */
  async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const updateData: UpdateReviewDto = req.body;

      // Check if review exists
      const review = await this.db.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        sendNotFoundResponse(res, "Review not found");
        return;
      }

      // Check if user is authorized to update this review
      if (req.user?.userType !== "ADMIN" && review.userId !== req.user?.userId) {
        sendErrorResponse(res, "You can only update your own reviews", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Update the review
      const updatedReview = await this.db.review.update({
        where: { id: reviewId },
        data: {
          rating: updateData.rating,
          comment: updateData.comment,
          // Admin can change approval status, but not included in UpdateReviewDto for regular users
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      sendSuccessResponse(res, updatedReview);
    } catch (error: any) {
      console.error("Error updating review:", error);
      sendErrorResponse(res, 'Failed to update review', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete a review
   * @param req Express request
   * @param res Express response
   */
  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;

      // Check if review exists
      const review = await this.db.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        sendNotFoundResponse(res, "Review not found");
        return;
      }

      // Check if user is authorized to delete this review
      if (req.user?.userType !== "ADMIN" && review.userId !== req.user?.userId) {
        sendErrorResponse(res, "You can only delete your own reviews", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Delete the review
      await this.db.review.delete({
        where: { id: reviewId }
      });

      sendSuccessResponse(res, { message: "Review deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting review:", error);
      sendErrorResponse(res, 'Failed to delete review', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Admin: Approve or reject a review
   * @param req Express request
   * @param res Express response
   */
  async moderateReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { isApproved, rejectionReason } = req.body;

      // Check if user is an admin
      if (req.user?.userType !== "ADMIN") {
        sendErrorResponse(res, "Only admins can moderate reviews", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Check if review exists
      const review = await this.db.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        sendNotFoundResponse(res, "Review not found");
        return;
      }

      // Update the review approval status
      const updatedReview = await this.db.review.update({
        where: { id: reviewId },
        data: {
          isApproved
        }
      });

      sendSuccessResponse(res, updatedReview);
    } catch (error: any) {
      console.error("Error moderating review:", error);
      sendErrorResponse(res, 'Failed to moderate review', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get a user's reviews
   * @param req Express request
   * @param res Express response
   */
  async getUserReviews(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query as any;
      const skip = (Number(page) - 1) * Number(limit);

      // Check if user can access these reviews
      if (req.user?.userType !== "ADMIN" && userId !== req.user?.userId) {
        sendErrorResponse(res, "You can only view your own reviews", HttpStatusCode.FORBIDDEN);
        return;
      }

      const where: any = { userId };

      const [reviews, total] = await Promise.all([
        this.db.review.findMany({
          where,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        this.db.review.count({ where }),
      ]);

      sendSuccessResponse(res, {
        reviews,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error("Error fetching user reviews:", error);
      sendErrorResponse(res, 'Failed to fetch user reviews', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
} 