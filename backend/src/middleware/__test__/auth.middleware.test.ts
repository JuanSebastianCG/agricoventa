import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock console.error to prevent noisy output during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Set up mock functions and objects
const mockFindUnique = jest.fn();
const mockSendErrorResponse = jest.fn();
const mockJwtVerify = jest.fn();

// Mock the modules
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: mockFindUnique
    },
    $disconnect: jest.fn()
  }))
}));

jest.mock('jsonwebtoken', () => ({
  verify: mockJwtVerify
}));

jest.mock('../../utils/responseHandler', () => ({
  sendErrorResponse: mockSendErrorResponse
}));

// Now import the module under test
import { authenticate } from '../auth.middleware';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup request mock
    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      user: undefined
    };

    // Setup response mock
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Setup next function mock
    mockNext = jest.fn();

    // Set default mock implementation for successful case
    mockFindUnique.mockResolvedValue({
      id: '1',
      userType: 'SELLER',
      isActive: true
    });
    
    // Default successful JWT verification
    mockJwtVerify.mockReturnValue({
      userId: '1',
      userType: 'SELLER'
    });
  });

  it('autentica correctamente con token válido', async () => {
    // Act
    await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockJwtVerify).toHaveBeenCalledWith('valid-token', expect.any(String));
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      select: { id: true, userType: true, isActive: true }
    });
    expect(mockRequest.user).toEqual({
      userId: '1',
      userType: 'SELLER',
    });
    expect(mockNext).toHaveBeenCalled();
    expect(mockSendErrorResponse).not.toHaveBeenCalled();
  });

  it('retorna 401 si el token es inválido', async () => {
    // Arrange - Mock JWT error
    const jwtError = new Error('Invalid token');
    jwtError.name = 'JsonWebTokenError';
    mockJwtVerify.mockImplementation(() => {
      throw jwtError;
    });

    // Act
    await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockJwtVerify).toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockSendErrorResponse).toHaveBeenCalledWith(
      mockResponse, 
      "Invalid token format or signature",
      expect.any(Number)
    );
  });

  it('llama next con error si no hay usuario en la BD', async () => {
    // Arrange - Mock user not found
    mockFindUnique.mockResolvedValue(null);

    // Act
    await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockJwtVerify).toHaveBeenCalled();
    expect(mockFindUnique).toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockSendErrorResponse).toHaveBeenCalledWith(
      mockResponse,
      "User not found",
      expect.any(Number)
    );
  });
});
