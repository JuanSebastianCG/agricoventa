import { Request, Response } from 'express';

// Mock console.error to prevent noisy output during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Create our mocks before any imports that might use them
const mockProductMethods = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn()
};

// Mock certification validator functions
const mockHasRequiredCertifications = jest.fn();
const mockGetCertificationsCount = jest.fn();

// Mock modules before importing the controller
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => ({
      product: mockProductMethods,
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    }))
  };
});

// Mock certificate validator
jest.mock('../../utils/certificateValidator', () => ({
  hasRequiredCertifications: mockHasRequiredCertifications,
  getCertificationsCount: mockGetCertificationsCount,
  REQUIRED_CERTIFICATIONS: ['INVIMA', 'ICA', 'REGISTRO_SANITARIO', 'CERTIFICADO_ORGANICO'],
  prismaClient: jest.fn()
}));

// Now import the controller after all mocks are set up
import { ProductController } from '../../controllers/product.controller';

describe('ProductController', () => {
  let productController: ProductController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create new instances for each test
    productController = new ProductController();

    // Mock request object
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { userId: 'seller123', userType: 'SELLER' },
    };

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('createProduct', () => {
    it('should create a product successfully for a seller with valid certifications', async () => {
      // Setup test data
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        basePrice: 100,
        stockQuantity: 50,
        unitMeasure: 'kg',
        sellerId: 'seller123',
        originLocationId: 'location123',
        productTypeId: 'productType123',
      };

      // Mock request
      mockRequest.body = productData;
      
      // Setup validation mocks
      mockHasRequiredCertifications.mockResolvedValueOnce(true);
      
      // Setup product creation mock
      const createdProduct = {
        id: 'product123',
        ...productData,
        isFeatured: false,
        isActive: true,
        createdAt: new Date(),
        productType: { id: 'productType123', name: 'Vegetables' },
        seller: { id: 'seller123', username: 'testuser' },
      };
      mockProductMethods.create.mockResolvedValueOnce(createdProduct);

      // Execute
      await productController.createProduct(mockRequest as Request, mockResponse as Response);

      // Verify certification check
      expect(mockHasRequiredCertifications).toHaveBeenCalledWith('seller123');
      
      // Verify product created with correct data
      expect(mockProductMethods.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Product',
          description: 'A test product',
          basePrice: 100,
          stockQuantity: 50,
        }),
        include: expect.any(Object)
      });
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: 'product123',
          name: 'Test Product'
        })
      }));
    });

    it('should forbid product creation if user lacks required certifications', async () => {
      // Setup test data
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        basePrice: 100,
        stockQuantity: 50,
        unitMeasure: 'kg',
        sellerId: 'seller123',
        originLocationId: 'location123',
      };

      // Mock request
      mockRequest.body = productData;
      
      // Mock certification validation - user lacks certifications
      mockHasRequiredCertifications.mockResolvedValueOnce(false);
      mockGetCertificationsCount.mockResolvedValueOnce({ verified: 2, total: 4 });

      // Execute
      await productController.createProduct(mockRequest as Request, mockResponse as Response);

      // Verify certification check was called
      expect(mockHasRequiredCertifications).toHaveBeenCalledWith('seller123');
      expect(mockGetCertificationsCount).toHaveBeenCalledWith('seller123');
      
      // Verify product was not created
      expect(mockProductMethods.create).not.toHaveBeenCalled();
      
      // Verify error response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('certifications')
        })
      }));
    });

    it('should forbid non-sellers from creating products', async () => {
      // Setup buyer user
      mockRequest.user = { userId: 'buyer123', userType: 'BUYER' };
      
      // Setup test data
      mockRequest.body = {
        name: 'Test Product',
        description: 'A test product',
        basePrice: 100,
        stockQuantity: 50,
        sellerId: 'seller123',
        originLocationId: 'location123',
      };

      // Execute
      await productController.createProduct(mockRequest as Request, mockResponse as Response);

      // Verify no certifications check made
      expect(mockHasRequiredCertifications).not.toHaveBeenCalled();
      
      // Verify product was not created
      expect(mockProductMethods.create).not.toHaveBeenCalled();
      
      // Verify error response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Only sellers can create products')
        })
      }));
    });
  });

  describe('getProductById', () => {
    it('should return a product when it exists', async () => {
      // Setup mock product data
      const mockProduct = {
        id: 'product123',
        name: 'Test Product',
        description: 'A test product',
        basePrice: 100,
        stockQuantity: 50,
        unitMeasure: 'kg',
        sellerId: 'seller123',
        originLocationId: 'location123',
        productTypeId: 'productType123',
        isFeatured: false,
        isActive: true,
        createdAt: new Date(),
        productType: { id: 'productType123', name: 'Vegetables' },
        seller: { id: 'seller123', username: 'testuser' },
        originLocation: { id: 'location123', city: 'Test City' },
        images: [
          { id: 'image1', imageUrl: 'http://example.com/image1.jpg', isPrimary: true }
        ]
      };

      // Setup mock findUnique to return product
      mockProductMethods.findUnique.mockResolvedValueOnce(mockProduct);

      // Setup request
      mockRequest.params = { productId: 'product123' };

      // Execute
      await productController.getProductById(mockRequest as Request, mockResponse as Response);

      // Verify findUnique was called with correct ID
      expect(mockProductMethods.findUnique).toHaveBeenCalledWith({
        where: { id: 'product123' },
        include: expect.any(Object)
      });
      
      // Verify response contains product data
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: 'product123',
          name: 'Test Product'
        })
      }));
    });

    it('should return 404 when product does not exist', async () => {
      // Setup mock findUnique to return null (product not found)
      mockProductMethods.findUnique.mockResolvedValueOnce(null);

      // Setup request
      mockRequest.params = { productId: 'nonexistent' };

      // Execute
      await productController.getProductById(mockRequest as Request, mockResponse as Response);

      // Verify findUnique was called
      expect(mockProductMethods.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' },
        include: expect.any(Object)
      });
      
      // Verify 404 response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Product not found'
        })
      }));
    });
  });

  describe('getProducts', () => {
    it('should return a list of products with pagination', async () => {
      // Setup mock products
      const mockProducts = [
        {
          id: 'product1',
          name: 'Product 1',
          basePrice: 100,
          stockQuantity: 50,
          unitMeasure: 'kg',
          sellerId: 'seller123',
          originLocationId: 'location123',
          isFeatured: false,
          isActive: true,
          createdAt: new Date(),
          productType: { id: 'type1', name: 'Vegetables' },
          seller: { id: 'seller123', username: 'testuser' },
          images: [{ id: 'img1', imageUrl: 'http://example.com/img1.jpg', isPrimary: true }]
        },
        {
          id: 'product2',
          name: 'Product 2',
          basePrice: 200,
          stockQuantity: 30,
          unitMeasure: 'kg',
          sellerId: 'seller456',
          originLocationId: 'location456',
          isFeatured: true,
          isActive: true,
          createdAt: new Date(),
          productType: { id: 'type2', name: 'Fruits' },
          seller: { id: 'seller456', username: 'seller2' },
          images: [{ id: 'img2', imageUrl: 'http://example.com/img2.jpg', isPrimary: true }]
        }
      ];

      // Setup mocks to return products and count
      mockProductMethods.findMany.mockResolvedValueOnce(mockProducts);
      mockProductMethods.count.mockResolvedValueOnce(2);

      // Setup request with query params
      mockRequest.query = {
        page: '1',
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      // Execute
      await productController.getProducts(mockRequest as Request, mockResponse as Response);

      // Verify findMany was called with correct params
      expect(mockProductMethods.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { isActive: true },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      }));
      
      // Verify count was called
      expect(mockProductMethods.count).toHaveBeenCalled();
      
      // Verify response contains products and pagination
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          products: expect.any(Array),
          pagination: expect.objectContaining({
            total: 2,
            page: 1,
            limit: 10,
            pages: 1
          })
        })
      }));
    });

    it('should filter products based on query parameters', async () => {
      // Setup mocks to return filtered products
      mockProductMethods.findMany.mockResolvedValueOnce([]);
      mockProductMethods.count.mockResolvedValueOnce(0);

      // Setup request with filter params
      mockRequest.query = {
        productTypeId: 'type1',
        sellerId: 'seller123',
        minPrice: '50',
        maxPrice: '150',
        isFeatured: 'true',
        search: 'organic'
      };

      // Execute
      await productController.getProducts(mockRequest as Request, mockResponse as Response);

      // Verify findMany was called with correct filters
      expect(mockProductMethods.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          productTypeId: 'type1',
          sellerId: 'seller123',
          basePrice: { gte: 50, lte: 150 },
          isFeatured: true,
          OR: expect.any(Array)
        })
      }));
    });
  });

  describe('updateProduct', () => {
    it('should allow a seller to update their own product', async () => {
      // Setup existing product
      const existingProduct = {
        id: 'product123',
        name: 'Old Name',
        description: 'Old description',
        basePrice: 100,
        stockQuantity: 50,
        sellerId: 'seller123', // Same as the authenticated user
        originLocationId: 'location123',
        productTypeId: 'type1',
        isFeatured: false,
        isActive: true
      };

      // Setup update data
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        basePrice: 120
      };

      // Setup updated product
      const updatedProduct = {
        ...existingProduct,
        ...updateData
      };

      // Set up mocks
      mockProductMethods.findUnique.mockResolvedValueOnce(existingProduct);
      mockProductMethods.update.mockResolvedValueOnce(updatedProduct);

      // Setup request
      mockRequest.params = { productId: 'product123' };
      mockRequest.body = updateData;
      mockRequest.user = { userId: 'seller123', userType: 'SELLER' };

      // Execute
      await productController.updateProduct(mockRequest as Request, mockResponse as Response);

      // Verify findUnique was called to check product
      expect(mockProductMethods.findUnique).toHaveBeenCalledWith({
        where: { id: 'product123' }
      });
      
      // Verify update was called with correct data
      expect(mockProductMethods.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'product123' },
        data: expect.objectContaining(updateData)
      }));
      
      // Verify success response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }));
    });

    it('should forbid a seller from updating another seller\'s product', async () => {
      // Setup existing product with different seller
      const existingProduct = {
        id: 'product123',
        name: 'Test Product',
        sellerId: 'different-seller', // Different from authenticated user
        isActive: true
      };

      // Setup mocks
      mockProductMethods.findUnique.mockResolvedValueOnce(existingProduct);

      // Setup request
      mockRequest.params = { productId: 'product123' };
      mockRequest.body = { name: 'Updated Name' };
      mockRequest.user = { userId: 'seller123', userType: 'SELLER' };

      // Execute
      await productController.updateProduct(mockRequest as Request, mockResponse as Response);

      // Verify findUnique was called
      expect(mockProductMethods.findUnique).toHaveBeenCalledWith({
        where: { id: 'product123' }
      });
      
      // Verify update was NOT called
      expect(mockProductMethods.update).not.toHaveBeenCalled();
      
      // Verify error response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('own products')
        })
      }));
    });

    it('should allow an admin to update any product', async () => {
      // Setup existing product with different seller
      const existingProduct = {
        id: 'product123',
        name: 'Test Product',
        sellerId: 'seller123', // Different from authenticated user (admin)
        isActive: true
      };

      // Setup update data
      const updateData = {
        name: 'Admin Updated',
        isFeatured: true
      };

      // Setup updated product
      const updatedProduct = {
        ...existingProduct,
        ...updateData
      };

      // Set up mocks
      mockProductMethods.findUnique.mockResolvedValueOnce(existingProduct);
      mockProductMethods.update.mockResolvedValueOnce(updatedProduct);

      // Setup request with admin user
      mockRequest.params = { productId: 'product123' };
      mockRequest.body = updateData;
      mockRequest.user = { userId: 'admin123', userType: 'ADMIN' };

      // Execute
      await productController.updateProduct(mockRequest as Request, mockResponse as Response);

      // Verify update was called (admin can update any product)
      expect(mockProductMethods.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'product123' },
        data: expect.objectContaining(updateData)
      }));
      
      // Verify success response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }));
    });
  });

  describe('deleteProduct', () => {
    it('should allow a seller to delete their own product', async () => {
      // Setup existing product
      const existingProduct = {
        id: 'product123',
        name: 'Test Product',
        sellerId: 'seller123', // Same as authenticated user
        isActive: true
      };

      // Setup mock
      mockProductMethods.findUnique.mockResolvedValueOnce(existingProduct);
      mockProductMethods.update.mockResolvedValueOnce({ ...existingProduct, isActive: false });

      // Setup request
      mockRequest.params = { productId: 'product123' };
      mockRequest.user = { userId: 'seller123', userType: 'SELLER' };

      // Execute
      await productController.deleteProduct(mockRequest as Request, mockResponse as Response);

      // Verify product was marked as inactive
      expect(mockProductMethods.update).toHaveBeenCalledWith({
        where: { id: 'product123' },
        data: { isActive: false }
      });
      
      // Verify success response - corregido para coincidir con el formato real
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Product deleted successfully'
        }
      });
    });

    it('should forbid a seller from deleting another seller\'s product', async () => {
      // Setup existing product with different seller
      const existingProduct = {
        id: 'product123',
        name: 'Test Product',
        sellerId: 'different-seller', // Different from authenticated user
        isActive: true
      };

      // Setup mock
      mockProductMethods.findUnique.mockResolvedValueOnce(existingProduct);

      // Setup request
      mockRequest.params = { productId: 'product123' };
      mockRequest.user = { userId: 'seller123', userType: 'SELLER' };

      // Execute
      await productController.deleteProduct(mockRequest as Request, mockResponse as Response);

      // Verify product was not updated
      expect(mockProductMethods.update).not.toHaveBeenCalled();
      
      // Verify error response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('own products')
        })
      }));
    });

    it('should return 404 when product to delete does not exist', async () => {
      // Setup mock to return null (product not found)
      mockProductMethods.findUnique.mockResolvedValueOnce(null);

      // Setup request
      mockRequest.params = { productId: 'nonexistent' };

      // Execute
      await productController.deleteProduct(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Product not found'
        })
      }));
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products', async () => {
      // Setup mock featured products
      const featuredProducts = [
        {
          id: 'product1',
          name: 'Featured 1',
          isFeatured: true,
          isActive: true,
          seller: { id: 'seller1', username: 'seller1' },
          images: [{ id: 'img1', imageUrl: 'http://example.com/img1.jpg', isPrimary: true }]
        },
        {
          id: 'product2',
          name: 'Featured 2',
          isFeatured: true,
          isActive: true,
          seller: { id: 'seller2', username: 'seller2' },
          images: [{ id: 'img2', imageUrl: 'http://example.com/img2.jpg', isPrimary: true }]
        }
      ];

      // Setup mock
      mockProductMethods.findMany.mockResolvedValueOnce(featuredProducts);

      // Setup request
      mockRequest.query = { limit: '5' };

      // Execute
      await productController.getFeaturedProducts(mockRequest as Request, mockResponse as Response);

      // Verify findMany was called with featured filter
      expect(mockProductMethods.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          isFeatured: true,
          isActive: true
        },
        take: 5
      }));
      
      // Verify response - corregido para coincidir con el formato real
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: {
          products: expect.any(Array)
        }
      }));
    });
  });
}); 