import jwt from 'jsonwebtoken';

/**
 * Generates JWT tokens for authentication
 * @param userId - The user ID
 * @param username - The username
 * @param role - The user role
 * @returns Object containing access and refresh tokens
 */
export const generateTokens = (userId: string, username: string, role: string) => {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  const refreshSecret = process.env.REFRESH_SECRET || 'refresh-secret-key';

  const accessToken = jwt.sign(
    { userId, username, role },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, username, role },
    refreshSecret,
    { expiresIn: '7d' }
  );

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Verifies an access token
 * @param token - The access token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyAccessToken = (token: string) => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Verifies a refresh token
 * @param token - The refresh token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyRefreshToken = (token: string) => {
  try {
    const refreshSecret = process.env.REFRESH_SECRET || 'refresh-secret-key';
    return jwt.verify(token, refreshSecret);
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}; 