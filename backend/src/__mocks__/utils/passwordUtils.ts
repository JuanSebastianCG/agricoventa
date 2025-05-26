import { jest } from "@jest/globals"

export const hashPassword = jest.fn(async (password) => {
  return "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm" // Mock hashed password
})

export const verifyPassword = jest.fn(async (password, hashedPassword) => {
  // For testing purposes, we'll consider "wrong-password" as invalid
  return password !== "wrong-password"
})
