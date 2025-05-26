import express from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest, validateQuery } from '../middleware/validation.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from '../schemas/category.schema';

const router = express.Router();
const categoryController = new CategoryController();

// Public routes
router.get(
  '/',
  validateQuery(categoryQuerySchema),
  (req, res) => categoryController.getCategories(req, res)
);
router.get(
  '/:categoryId',
  validateQuery(categoryQuerySchema),
  (req, res) => categoryController.getCategoryById(req, res)
);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validateRequest(createCategorySchema),
  (req, res) => categoryController.createCategory(req, res)
);

router.put(
  '/:categoryId',
  authenticate,
  authorize(['ADMIN']),
  validateRequest(updateCategorySchema),
  (req, res) => categoryController.updateCategory(req, res)
);

router.delete(
  '/:categoryId',
  authenticate,
  authorize(['ADMIN']),
  (req, res) => categoryController.deleteCategory(req, res)
);

export default router; 