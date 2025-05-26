import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateUserSchema } from '../schemas/user.schema';
import { handleProfileImageUpload, UploadController } from '../controllers/upload.controller';

const router = express.Router();
const userController = new UserController();
const uploadController = new UploadController();

// Todas las rutas relacionadas con la subida de imágenes ahora usan S3

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", authenticate, authorize(["ADMIN"]), (req, res) => userController.getAllUsers(req, res));

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 */
router.get("/:userId", authenticate, (req, res) => userController.getUserById(req, res));

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDto'
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put(
  "/:userId",
  authenticate,
  validateRequest(updateUserSchema),
  (req, res) => userController.updateUser(req, res)
);

/**
 * @swagger
 * /users/check/username:
 *   get:
 *     summary: Check if a username is available
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: Username to check
 *     responses:
 *       200:
 *         description: Username availability
 */
router.get("/check/username", (req, res) => userController.checkUsernameAvailability(req, res));

/**
 * @swagger
 * /users/check/email:
 *   get:
 *     summary: Check if an email is available
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Email to check
 *     responses:
 *       200:
 *         description: Email availability
 */
router.get("/check/email", (req, res) => userController.checkEmailAvailability(req, res));

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Deactivate a user account
 *     tags: [Users]
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
 *         description: User account deactivated successfully
 */
router.delete("/:userId", authenticate, (req, res) => userController.deactivateUser(req, res));

// Profile image upload route - Ahora usa S3
router.put(
  '/:userId/profile-image',
  authenticate,
  handleProfileImageUpload,
  uploadController.uploadProfileImage.bind(uploadController)
);

// Get current user profile
router.get("/me", authenticate, (req, res) => {
  req.params.userId = 'me';
  userController.getUserById(req, res);
});

// Update current user profile
router.put("/me", authenticate, validateRequest(updateUserSchema), (req, res) => {
  req.params.userId = 'me';
  userController.updateUser(req, res);
});

// Current user profile image upload route
router.put(
  '/me/profile-image',
  authenticate,
  handleProfileImageUpload,
  uploadController.uploadProfileImage.bind(uploadController)
);

/**
 * @swagger
 * /users/{userId}/location:
 *   get:
 *     summary: Get a user's primary location
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID. Use 'me' to get the current authenticated user's primary location.
 *     responses:
 *       200:
 *         description: User's primary location details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location' # Assuming you have a Location schema defined
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found or primary location not set
 */
// Get user's primary location
router.get(
  "/:userId/location", 
  authenticate, 
  (req, res) => userController.getUserPrimaryLocation(req, res)
);

/**
 * @swagger
 * /users/me/location:
 *   get:
 *     summary: Get the current authenticated user's primary location
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's primary location details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location' # Assuming you have a Location schema defined
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found or primary location not set
 */
// Get current user's primary location
router.get(
  "/me/location", 
  authenticate, 
  (req, res) => {
    req.params.userId = 'me';
    userController.getUserPrimaryLocation(req, res);
  }
);

export default router; 