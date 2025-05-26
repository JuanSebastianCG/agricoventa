import { Request, Response } from 'express';
import * as passwordUtils from '../../utils/passwordUtils';

// Mock console.error to prevent noisy output during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Create our mocks before any imports that might use them
const mockUserMethods = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

// Mock modules before importing the controller
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => ({
      user: mockUserMethods,
      location: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    }))
  };
});

jest.mock('../../utils/passwordUtils', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('multer', () => {
  return jest.fn().mockImplementation(() => ({
    single: jest.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        req.file = {
          filename: 'test-profile-image.jpg',
          path: '/uploads/profiles/test-profile-image.jpg',
        };
        next();
      };
    }),
  }));
});

// Mock path and fs modules
jest.mock('path', () => ({
  join: jest.fn(() => 'mocked-path'),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  unlinkSync: jest.fn(),
}));

// Now import the controller after all mocks are set up
import { UserController } from '../../controllers/user.controller';

describe('UserController', () => {
  let userController: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create new instances for each test
    userController = new UserController();

    // Mock request object
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { userId: 'user123', userType: 'SELLER' },
    };

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getUserById', () => {
    it('should return user data for valid ID', async () => {
      const mockUserData = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        userType: 'SELLER',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        profileImage: null,
        passwordHash: 'hashed_pw' // Include this as it's in the real DB
      };

      // Setup mock to return user
      mockUserMethods.findUnique.mockResolvedValueOnce(mockUserData);

      mockRequest.params = { userId: 'user123' };

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockUserMethods.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' }
      });
      
      // Now we expect status to be called by the ResponseHandler
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'user123',
          username: 'testuser'
        })
      });
    });

    it('should handle user not found error', async () => {
      // Setup mock to return null (user not found)
      mockUserMethods.findUnique.mockResolvedValueOnce(null);

      mockRequest.params = { userId: 'nonexistent' };

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado'
        }
      });
    });
  });

  describe('updateUser', () => {
    it('should update user profile successfully', async () => {
      const mockUserData = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
      };

      const updatedUser = {
        ...mockUserData,
        firstName: 'Updated',
        lastName: 'User',
        userType: 'SELLER',
        isActive: true,
        profileImage: null,
        phoneNumber: null,
        primaryLocationId: null,
        createdAt: new Date()
      };

      // First mock the findUnique to return a user (for validation)
      mockUserMethods.findUnique.mockResolvedValueOnce(mockUserData);
      
      // Then mock the update to return an updated user
      mockUserMethods.update.mockResolvedValueOnce(updatedUser);

      mockRequest.params = { userId: 'user123' };
      mockRequest.body = {
        firstName: 'Updated',
        lastName: 'User',
      };

      await userController.updateUser(mockRequest as Request, mockResponse as Response);

      // Verify findUnique is called first with the right parameters
      expect(mockUserMethods.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' }
      });
      
      // Then verify update is called with the right parameters
      expect(mockUserMethods.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          firstName: 'Updated',
          lastName: 'User',
        },
        select: expect.objectContaining({
          id: true,
          username: true
        })
      });
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          firstName: 'Updated',
          lastName: 'User',
        })
      });
    });
  });

  describe('updateProfileImage', () => {
    it('should update profile image successfully', async () => {
      const mockUserData = {
        id: 'user123',
        username: 'testuser',
        profileImage: null,
      };

      const updatedUser = {
        ...mockUserData,
        profileImage: 'uploads/profiles/test-profile-image.jpg',
      };

      // First find the user
      mockUserMethods.findUnique.mockResolvedValueOnce(mockUserData);
      
      // Then update the profile
      mockUserMethods.update.mockResolvedValueOnce(updatedUser);

      mockRequest.params = { userId: 'user123' };
      mockRequest.file = {
        filename: 'test-profile-image.jpg',
        path: '/uploads/profiles/test-profile-image.jpg',
      } as Express.Multer.File;

      await userController.updateProfileImage(mockRequest as Request, mockResponse as Response);

      // Verify findUnique was called
      expect(mockUserMethods.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' }
      });
      
      // Verify update was called with any parameters for profile image
      expect(mockUserMethods.update).toHaveBeenCalled();
      // Only verify the where condition, as the path may differ
      expect(mockUserMethods.update.mock.calls[0][0].where).toEqual({ id: 'user123' });
      // Just verify the update has a profile image property
      expect(mockUserMethods.update.mock.calls[0][0].data).toHaveProperty('profileImage');
      
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should handle missing file error', async () => {
      // Mock user find
      mockUserMethods.findUnique.mockResolvedValueOnce({
        id: 'user123',
        username: 'testuser',
        profileImage: null
      });
      
      mockRequest.params = { userId: 'user123' };
      mockRequest.file = undefined;

      await userController.updateProfileImage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('imagen')
        })
      }));
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return available status when username is not taken', async () => {
      // Setup mock to return null (username not found)
      mockUserMethods.findUnique.mockResolvedValueOnce(null);

      mockRequest.query = { username: 'newusername' };

      await userController.checkUsernameAvailability(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isAvailable: true,
        }
      });
    });

    it('should return unavailable status when username is taken', async () => {
      // Setup mock to return a user (username exists)
      mockUserMethods.findUnique.mockResolvedValueOnce({ 
        id: 'user123', 
        username: 'existinguser'
      });

      mockRequest.query = { username: 'existinguser' };

      await userController.checkUsernameAvailability(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isAvailable: false,
        }
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        { id: 'user1', username: 'user1', userType: 'BUYER' },
        { id: 'user2', username: 'user2', userType: 'SELLER' },
      ];

      // Setup mock to return users
      mockUserMethods.findMany.mockResolvedValueOnce(mockUsers);

      // Need to bypass authentication check in the controller
      mockRequest.user = { userId: 'admin123', userType: 'ADMIN' };  

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserMethods.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const mockUserData = {
        id: 'user123',
        username: 'testuser',
        isActive: true,
      };

      const deactivatedUser = {
        ...mockUserData,
        isActive: false,
      };

      // First mock findUnique
      mockUserMethods.findUnique.mockResolvedValueOnce(mockUserData);
      
      // Then mock update
      mockUserMethods.update.mockResolvedValueOnce(deactivatedUser);

      mockRequest.params = { userId: 'user123' };

      await userController.deactivateUser(mockRequest as Request, mockResponse as Response);

      // Verify findUnique was called
      expect(mockUserMethods.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' }
      });
      
      // Verify update was called
      expect(mockUserMethods.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'user123' },
        data: {
          isActive: false,
        }
      }));
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'User account deactivated successfully'
        }
      });
    });
  });
}); 