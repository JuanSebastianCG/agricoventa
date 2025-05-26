// Mock JWT tokens
const jest = require("jest-mock")

export const generateTokens = jest.fn(() => ({
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
}))

export const verifyAccessToken = jest.fn((token: string) => {
  if (token === "invalid-token") {
    return null
  }
  if (token === "blacklisted-token") {
    return null
  }
  return {
    userId: "1",
    username: "admin",
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  }
})

export const verifyRefreshToken = jest.fn((token: string) => {
  if (token === "invalid-refresh-token") {
    return null
  }
  return {
    userId: "1",
    username: "admin",
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  }
})
