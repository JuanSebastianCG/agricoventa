import { jest } from "@jest/globals"

// Mock user data
const mockUsers = [
  {
    id: "1",
    fullName: "Admin User",
    username: "admin",
    email: "admin@example.com",
    password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // Password123!
    role: "admin",
    isActive: true,
    refreshToken: null,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "2",
    fullName: "Regular User",
    username: "user",
    email: "user@example.com",
    password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // Password123!
    role: "user",
    isActive: true,
    refreshToken: null,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "3",
    fullName: "Inactive User",
    username: "inactive",
    email: "inactive@example.com",
    password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // Password123!
    role: "user",
    isActive: false,
    refreshToken: null,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
]

// Mock blacklisted tokens
const mockBlacklistedTokens: { id: string; token: string; createdAt: Date }[] = []

// Mock Prisma client
const mockPrismaClient = {
  user: {
    findUnique: jest.fn((params: any) => {
      if (params.where.id) {
        return Promise.resolve(mockUsers.find((user) => user.id === params.where.id) || null)
      }
      if (params.where.username) {
        return Promise.resolve(mockUsers.find((user) => user.username === params.where.username) || null)
      }
      if (params.where.email) {
        return Promise.resolve(mockUsers.find((user) => user.email === params.where.email) || null)
      }
      return Promise.resolve(null)
    }),
    findMany: jest.fn(() => {
      return Promise.resolve([...mockUsers])
    }),
    create: jest.fn((params: any) => {
      const newUser = {
        id: String(mockUsers.length + 1),
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockUsers.push(newUser)
      return Promise.resolve(newUser)
    }),
    update: jest.fn((params: any) => {
      const userIndex = mockUsers.findIndex((user) => user.id === params.where.id)
      if (userIndex === -1) {
        throw new Error("User not found")
      }

      const updatedUser = {
        ...mockUsers[userIndex],
        ...params.data,
        updatedAt: new Date(),
      }

      mockUsers[userIndex] = updatedUser
      return Promise.resolve(updatedUser)
    }),
    delete: jest.fn((params: any) => {
      const userIndex = mockUsers.findIndex((user) => user.id === params.where.id)
      if (userIndex === -1) {
        throw new Error("User not found")
      }

      const deletedUser = mockUsers[userIndex]
      mockUsers.splice(userIndex, 1)
      return Promise.resolve(deletedUser)
    }),
  },
  blacklistedToken: {
    create: jest.fn((params: any) => {
      const newToken = {
        id: String(mockBlacklistedTokens.length + 1),
        ...params.data,
        createdAt: new Date(),
      }
      mockBlacklistedTokens.push(newToken)
      return Promise.resolve(newToken)
    }),
    findFirst: jest.fn((params: any) => {
      return Promise.resolve(mockBlacklistedTokens.find((token) => token.token === params.where.token) || null)
    }),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
}

// Export mocked Prisma client
export const PrismaClient = jest.fn(() => mockPrismaClient)
