import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../index';
import { logger } from '../config/logger';
import { RATE_LIMITS } from '@/shared/constants';

// Create rate limiters for different endpoints
const createRateLimiter = (keyGenerator: string, options: any) => {
  return new RateLimiterRedis({
    storeClient: redis,
    keyGenerator: (req: Request) => `${keyGenerator}:${req.ip}`,
    ...options
  });
};

// Search API rate limiter
const searchRateLimiter = createRateLimiter('search', {
  points: RATE_LIMITS.SEARCH_API.MAX_REQUESTS,
  duration: RATE_LIMITS.SEARCH_API.WINDOW_MS / 1000, // Convert to seconds
});

// Store API rate limiter
const storeRateLimiter = createRateLimiter('store', {
  points: RATE_LIMITS.STORE_API.MAX_REQUESTS,
  duration: RATE_LIMITS.STORE_API.WINDOW_MS / 1000,
});

// User API rate limiter
const userRateLimiter = createRateLimiter('user', {
  points: RATE_LIMITS.USER_API.MAX_REQUESTS,
  duration: RATE_LIMITS.USER_API.WINDOW_MS / 1000,
});

// Rate limiter middleware factory
const createRateLimiterMiddleware = (rateLimiter: RateLimiterRedis, name: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await rateLimiter.consume(req.ip);
      next();
    } catch (rateLimiterRes: any) {
      logger.warn(`Rate limit exceeded for ${name}`, {
        ip: req.ip,
        path: req.path,
        remainingPoints: rateLimiterRes.remainingPoints,
        msBeforeNext: rateLimiterRes.msBeforeNext
      });

      const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
      
      res.set('Retry-After', String(secs));
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${secs} seconds.`,
        retryAfter: secs
      });
    }
  };
};

// General rate limiter middleware
export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  // Apply different rate limiters based on route
  if (req.path.startsWith('/api/products/search') || req.path.startsWith('/api/nutrition')) {
    return createRateLimiterMiddleware(searchRateLimiter, 'search')(req, res, next);
  }
  
  if (req.path.startsWith('/api/stores')) {
    return createRateLimiterMiddleware(storeRateLimiter, 'store')(req, res, next);
  }
  
  if (req.path.startsWith('/api/users') || req.path.startsWith('/api/shopping-lists')) {
    return createRateLimiterMiddleware(userRateLimiter, 'user')(req, res, next);
  }
  
  // Default rate limiting for other routes
  return createRateLimiterMiddleware(userRateLimiter, 'default')(req, res, next);
};

export { searchRateLimiter, storeRateLimiter, userRateLimiter };