import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest, validateParams } from "../middleware/validation.middleware";
import { createReviewSchema, updateReviewSchema, reviewApprovalSchema } from "../schemas/review.schema";
import { z } from "zod";

const router = Router();
const reviewController = new ReviewController();

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewDto'
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.post(
  "/",
  authenticate,
  validateRequest(createReviewSchema),
  (req, res) => reviewController.createReview(req, res)
);

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Get all reviews for a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get(
  "/product/:productId",
  validateParams(z.object({ productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID') })),
  (req, res) => reviewController.getProductReviews(req, res)
);

/**
 * @swagger
 * /reviews/user/{userId}:
 *   get:
 *     summary: Get all reviews by a specific user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user reviews
 */
router.get(
  "/user/:userId",
  authenticate,
  validateParams(z.object({ userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID') })),
  (req, res) => reviewController.getUserReviews(req, res)
);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *         required: true
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReviewDto'
 *     responses:
 *       200:
 *         description: Review updated successfully
 */
router.put(
  "/:reviewId",
  authenticate,
  validateParams(z.object({ reviewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Review ID') })),
  validateRequest(updateReviewSchema),
  (req, res) => reviewController.updateReview(req, res)
);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *         required: true
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
router.delete(
  "/:reviewId",
  authenticate,
  validateParams(z.object({ reviewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Review ID') })),
  (req, res) => reviewController.deleteReview(req, res)
);

/**
 * @swagger
 * /reviews/{reviewId}/moderate:
 *   put:
 *     summary: Moderate a review (admin only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *         required: true
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewApprovalDto'
 *     responses:
 *       200:
 *         description: Review moderated successfully
 */
router.put(
  "/:reviewId/moderate",
  authenticate,
  authorize(["ADMIN"]),
  validateParams(z.object({ reviewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Review ID') })),
  validateRequest(reviewApprovalSchema),
  (req, res) => reviewController.moderateReview(req, res)
);

export default router; 