import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '@/shared/constants';
import { logger } from '../config/logger';
import { prisma } from '../index';

const router = Router();

/**
 * POST /api/users/register
 * Register a new user
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { email, firstName, lastName, phone, password, preferences } = req.body;

  // Validate required fields
  if (!email || !firstName || !lastName || !password) {
    throw new AppError('Email, first name, last name, and password are required', 400, ERROR_CODES.REQUIRED_FIELD);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format', 400, ERROR_CODES.INVALID_INPUT);
  }

  // Validate password strength
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400, ERROR_CODES.INVALID_INPUT);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('User already exists with this email', 409, ERROR_CODES.ALREADY_EXISTS);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user with preferences
  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      phone,
      password: hashedPassword,
      preferences: preferences ? {
        create: {
          dietaryRestrictions: preferences.dietaryRestrictions || [],
          allergies: preferences.allergies || [],
          healthGoals: preferences.healthGoals || [],
          preferredStores: preferences.preferredStores || [],
          budgetMin: preferences.budgetRange?.min,
          budgetMax: preferences.budgetRange?.max,
          organicPreference: preferences.organicPreference || 'no-preference'
        }
      } : undefined
    },
    include: {
      preferences: true
    }
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  logger.info(`User registered: ${user.email}`);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        preferences: user.preferences ? {
          dietaryRestrictions: user.preferences.dietaryRestrictions,
          allergies: user.preferences.allergies,
          healthGoals: user.preferences.healthGoals,
          preferredStores: user.preferences.preferredStores,
          budgetRange: user.preferences.budgetMin && user.preferences.budgetMax ? {
            min: user.preferences.budgetMin,
            max: user.preferences.budgetMax
          } : undefined,
          organicPreference: user.preferences.organicPreference
        } : null,
        createdAt: user.createdAt
      },
      token
    }
  });
}));

/**
 * POST /api/users/login
 * Authenticate user and return token
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400, ERROR_CODES.REQUIRED_FIELD);
  }

  // Find user with preferences
  const user = await prisma.user.findUnique({
    where: { email },
    include: { preferences: true }
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        preferences: user.preferences ? {
          dietaryRestrictions: user.preferences.dietaryRestrictions,
          allergies: user.preferences.allergies,
          healthGoals: user.preferences.healthGoals,
          preferredStores: user.preferences.preferredStores,
          budgetRange: user.preferences.budgetMin && user.preferences.budgetMax ? {
            min: user.preferences.budgetMin,
            max: user.preferences.budgetMax
          } : undefined,
          organicPreference: user.preferences.organicPreference
        } : null
      },
      token
    }
  });
}));

/**
 * Middleware to authenticate JWT token
 */
const authenticate = asyncHandler(async (req: any, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Access token is required', 401, ERROR_CODES.UNAUTHORIZED);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { preferences: true }
    });

    if (!user) {
      throw new AppError('User not found', 401, ERROR_CODES.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401, ERROR_CODES.TOKEN_EXPIRED);
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401, ERROR_CODES.UNAUTHORIZED);
    }
    throw error;
  }
});

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', authenticate, asyncHandler(async (req: any, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      preferences: user.preferences ? {
        dietaryRestrictions: user.preferences.dietaryRestrictions,
        allergies: user.preferences.allergies,
        healthGoals: user.preferences.healthGoals,
        preferredStores: user.preferences.preferredStores,
        budgetRange: user.preferences.budgetMin && user.preferences.budgetMax ? {
          min: user.preferences.budgetMin,
          max: user.preferences.budgetMax
        } : undefined,
        organicPreference: user.preferences.organicPreference
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
}));

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', authenticate, asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { firstName, lastName, phone } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined
    },
    include: { preferences: true }
  });

  res.json({
    success: true,
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      updatedAt: updatedUser.updatedAt
    }
  });
}));

/**
 * PUT /api/users/preferences
 * Update user preferences
 */
router.put('/preferences', authenticate, asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { 
    dietaryRestrictions, 
    allergies, 
    healthGoals, 
    preferredStores, 
    budgetRange, 
    organicPreference 
  } = req.body;

  // Update or create preferences
  const updatedPreferences = await prisma.userPreferences.upsert({
    where: { userId },
    update: {
      dietaryRestrictions: dietaryRestrictions || undefined,
      allergies: allergies || undefined,
      healthGoals: healthGoals || undefined,
      preferredStores: preferredStores || undefined,
      budgetMin: budgetRange?.min || undefined,
      budgetMax: budgetRange?.max || undefined,
      organicPreference: organicPreference || undefined
    },
    create: {
      userId,
      dietaryRestrictions: dietaryRestrictions || [],
      allergies: allergies || [],
      healthGoals: healthGoals || [],
      preferredStores: preferredStores || [],
      budgetMin: budgetRange?.min,
      budgetMax: budgetRange?.max,
      organicPreference: organicPreference || 'no-preference'
    }
  });

  res.json({
    success: true,
    data: {
      dietaryRestrictions: updatedPreferences.dietaryRestrictions,
      allergies: updatedPreferences.allergies,
      healthGoals: updatedPreferences.healthGoals,
      preferredStores: updatedPreferences.preferredStores,
      budgetRange: updatedPreferences.budgetMin && updatedPreferences.budgetMax ? {
        min: updatedPreferences.budgetMin,
        max: updatedPreferences.budgetMax
      } : undefined,
      organicPreference: updatedPreferences.organicPreference,
      updatedAt: updatedPreferences.updatedAt
    }
  });
}));

/**
 * POST /api/users/change-password
 * Change user password
 */
router.post('/change-password', authenticate, asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400, ERROR_CODES.REQUIRED_FIELD);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters long', 400, ERROR_CODES.INVALID_INPUT);
  }

  // Verify current password
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user!.password);
  
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400, ERROR_CODES.INVALID_INPUT);
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword }
  });

  logger.info(`Password changed for user: ${user!.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

export { authenticate };
export default router;