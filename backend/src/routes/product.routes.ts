import express from 'express';
import { ProductController } from '../controllers/product.controller';
import { ProductHistoryController } from '../controllers/productHistory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.middleware';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../schemas/product.schema';
import { z } from 'zod';
import { handleProductImageUpload, handleMultipleProductImagesUpload, UploadController } from '../controllers/upload.controller';

const router = express.Router();
const productController = new ProductController();
const uploadController = new UploadController();

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductDto'
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(['SELLER', 'ADMIN']),
  handleMultipleProductImagesUpload,
  productController.createProduct.bind(productController)
);

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:productId', (req, res) => productController.getProductById(req, res));

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: productTypeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', validateQuery(productQuerySchema), productController.getProducts.bind(productController));

/**
 * @swagger
 * /products/{productId}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductDto'
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put(
  '/:productId',
  authenticate,
  authorize(['SELLER', 'ADMIN']),
  handleMultipleProductImagesUpload,
  productController.updateProduct.bind(productController)
);

/**
 * @swagger
 * /products/{productId}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete(
  '/:productId',
  authenticate,
  authorize(['SELLER', 'ADMIN']),
  productController.deleteProduct.bind(productController)
);

/**
 * @swagger
 * /products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: List of featured products
 */
router.get('/featured', productController.getFeaturedProducts.bind(productController));

// Get a specific product by ID
router.get(
  '/:productId',
  validateParams(z.object({ productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID') })),
  (req, res) => productController.getProductById(req, res)
);

// Get products by user ID (seller ID)
router.get(
  '/user/:userId',
  validateParams(z.object({ userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID') })),
  validateQuery(productQuerySchema.pick({ page: true, limit: true, sortBy: true, sortOrder: true })), // Allow pagination/sorting
  (req, res) => productController.getUserProducts(req, res)
);

// Get products by category ID
router.get(
  '/category/:categoryId',
  validateParams(z.object({ categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID') })),
  validateQuery(productQuerySchema.pick({ page: true, limit: true, sortBy: true, sortOrder: true })), // Allow pagination/sorting
  (req, res) => productController.getCategoryProducts(req, res)
);

/**
 * @swagger
 * /products/{productId}/images:
 *   get:
 *     summary: Get all images for a specific product
 *     tags: [Products, ProductImages]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         required: true
 *         description: The ID of the product
 *     responses:
 *       200:
 *         description: A list of product images
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductImage' # Assuming you have a ProductImage schema defined for Swagger
 *       400:
 *         description: Invalid Product ID
 *       404:
 *         description: Product not found or no images for the product
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/:productId/images',
  validateParams(z.object({ productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID') })),
  (req, res) => productController.getProductImagesByProductId(req, res)
);

// Product History routes
/**
 * @swagger
 * /products/{productId}/history:
 *   get:
 *     summary: Get product change history
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Product history
 */
router.get(
  '/:productId/history',
  authenticate,
  authorize(['SELLER', 'ADMIN']),
  ProductHistoryController.getProductHistory
);

/**
 * @swagger
 * /products/insights/changes:
 *   get:
 *     summary: Get product change metrics for insights
 *     tags: [Products, Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Product change metrics
 */
router.get(
  '/insights/changes',
  authenticate,
  authorize(['ADMIN']),
  ProductHistoryController.getProductChangeMetrics
);

/**
 * @swagger
 * /products/insights/price-trends:
 *   get:
 *     summary: Get product price trends for market analysis
 *     tags: [Products, Insights]
 *     parameters:
 *       - in: query
 *         name: timespan
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Optional category ID to filter products
 *     responses:
 *       200:
 *         description: Product price trends data
 */
router.get(
  '/insights/price-trends',
  ProductHistoryController.getProductPriceTrends
);

// Get product price trends
router.get(
  '/price-trends',
  (req, res) => ProductHistoryController.getProductPriceTrends(req, res)
);

// Subir una imagen para un producto (vendedores y admins)
router.post(
  '/:productId/images',
  authenticate,
  authorize(['SELLER', 'ADMIN']),
  handleProductImageUpload, // Middleware de Multer-S3 para una sola imagen llamada 'productImage'
  uploadController.uploadProductImage.bind(uploadController)
);

// Subir múltiples imágenes para un producto (vendedores y admins)
router.post(
  '/:productId/images-multiple',
  authenticate,
  authorize(['SELLER', 'ADMIN']),
  handleMultipleProductImagesUpload, // Middleware para múltiples imágenes llamadas 'productImages'
  uploadController.uploadMultipleProductImages.bind(uploadController)
);

export default router; 
