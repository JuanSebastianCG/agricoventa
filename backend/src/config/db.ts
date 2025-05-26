import { PrismaClient } from '@prisma/client';
import { PrismaClientInitializationError } from '@prisma/client/runtime/library';
import { logger } from './logger';

// Initialize Prisma client (this replaces the import from ../prisma)
const prisma = new PrismaClient();

/**
 * Connect to the database using Prisma
 *
 * This function attempts to establish a connection to the database
 * and reports the status of the connection.
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Test the connection by executing a simple query
    await prisma.$connect();
    logger.info('MongoDB connected successfully');
  } catch (error) {
    if (error instanceof PrismaClientInitializationError) {
      logger.error('Failed to connect to MongoDB:', error.message);
    } else {
      logger.error('Unexpected error when connecting to MongoDB:', error);
    }

    // If we can't connect to the database, exit the process
    process.exit(1);
  }
};

/**
 * Disconnect from the database
 *
 * This function cleanly disconnects from the database.
 * It should be called when the application is shutting down.
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};
