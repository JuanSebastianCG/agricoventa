import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { logger } from '../config/logger';

// Create a cache instance with default TTL of 60 seconds
const cacheStore = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * Middleware to cache API responses
 * @param ttl - Time to live in seconds
 * @returns Middleware function
 */
export const cache = (ttl: number = 60) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated requests
    if (req.user) {
      return next();
    }

    // Create a cache key from the request URL
    const cacheKey = `${req.originalUrl || req.url}`;
    
    // Try to get cached response
    const cachedResponse = cacheStore.get(cacheKey);
    
    if (cachedResponse) {
      logger.debug(`Cache hit for ${cacheKey}`);
      res.status(200).json(cachedResponse);
      return;
    }

    // If not cached, capture the response
    const originalSend = res.json;
    
    // @ts-ignore - Overriding the json method
    res.json = function(body: any): Response {
      if (res.statusCode === 200) {
        logger.debug(`Caching response for ${cacheKey}`);
        cacheStore.set(cacheKey, body, ttl);
      }
      
      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * Clear cache for a specific key or pattern
 * @param key - Cache key or pattern
 */
export const clearCache = (key: string): void => {
  if (key.includes('*')) {
    // Clear by pattern
    const pattern = key.replace('*', '');
    const keys = cacheStore.keys();
    const matchingKeys = keys.filter(k => k.startsWith(pattern));
    
    matchingKeys.forEach(k => {
      cacheStore.del(k);
    });
    
    logger.debug(`Cleared ${matchingKeys.length} cache entries matching pattern: ${pattern}`);
  } else {
    // Clear specific key
    cacheStore.del(key);
    logger.debug(`Cleared cache for key: ${key}`);
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = (): void => {
  cacheStore.flushAll();
  logger.debug('Cleared all cache');
};