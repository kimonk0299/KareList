import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { nutritionDataService } from '../services/nutritionData';
import { nutritionScoringService } from '../services/nutritionScoring';
import { ERROR_CODES } from '@/shared/constants';
import { logger } from '../config/logger';
import { prisma } from '../index';

const router = Router();

/**
 * GET /api/nutrition/barcode/:upc
 * Get nutrition data by UPC/barcode
 */
router.get('/barcode/:upc', asyncHandler(async (req, res) => {
  const { upc } = req.params;

  if (!upc || !/^\d{12,14}$/.test(upc)) {
    throw new AppError('Valid UPC/barcode is required', 400, ERROR_CODES.INVALID_INPUT);
  }

  const nutritionData = await nutritionDataService.getNutritionByUPC(upc);

  if (!nutritionData) {
    throw new AppError('Nutrition data not found for this product', 404, ERROR_CODES.NOT_FOUND);
  }

  // Calculate nutrition score
  const scoring = await nutritionScoringService.calculateScore(nutritionData);

  res.json({
    success: true,
    data: {
      upc,
      nutrition: nutritionData,
      scoring
    }
  });
}));

/**
 * GET /api/nutrition/search
 * Search for nutrition data by product name
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q, brand, limit = 10 } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400, ERROR_CODES.INVALID_INPUT);
  }

  const searchLimit = Math.min(parseInt(limit as string) || 10, 50);

  const nutritionResults = await nutritionDataService.searchNutritionData(
    q.toString().trim(),
    brand as string | undefined
  );

  const limitedResults = nutritionResults.slice(0, searchLimit);

  // Calculate scores for results
  const resultsWithScores = await Promise.all(
    limitedResults.map(async nutrition => {
      try {
        const scoring = await nutritionScoringService.calculateScore(nutrition);
        return { nutrition, scoring };
      } catch (error) {
        logger.error('Error calculating score:', error);
        return { nutrition, scoring: null };
      }
    })
  );

  res.json({
    success: true,
    data: {
      results: resultsWithScores,
      query: q,
      brand,
      count: resultsWithScores.length,
      totalFound: nutritionResults.length
    }
  });
}));

/**
 * POST /api/nutrition/score
 * Calculate nutrition score for provided nutrition data
 */
router.post('/score', asyncHandler(async (req, res) => {
  const { nutritionData } = req.body;

  if (!nutritionData) {
    throw new AppError('Nutrition data is required', 400, ERROR_CODES.INVALID_INPUT);
  }

  const scoring = await nutritionScoringService.calculateScore(nutritionData);

  res.json({
    success: true,
    data: scoring
  });
}));

/**
 * POST /api/nutrition/batch-score
 * Calculate nutrition scores for multiple products
 */
router.post('/batch-score', asyncHandler(async (req, res) => {
  const { nutritionDataList } = req.body;

  if (!nutritionDataList || !Array.isArray(nutritionDataList)) {
    throw new AppError('Nutrition data array is required', 400, ERROR_CODES.INVALID_INPUT);
  }

  if (nutritionDataList.length > 100) {
    throw new AppError('Cannot process more than 100 items at once', 400, ERROR_CODES.INVALID_INPUT);
  }

  const scores = await nutritionScoringService.batchCalculateScores(nutritionDataList);

  res.json({
    success: true,
    data: {
      scores,
      count: scores.length
    }
  });
}));

/**
 * GET /api/nutrition/additives
 * Get information about food additives
 */
router.get('/additives', asyncHandler(async (req, res) => {
  const { riskLevel, search } = req.query;

  let whereClause: any = {};

  if (riskLevel) {
    whereClause.riskLevel = riskLevel;
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { eNumber: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const additives = await prisma.additive.findMany({
    where: whereClause,
    orderBy: [
      { riskLevel: 'desc' },
      { pointDeduction: 'desc' },
      { name: 'asc' }
    ]
  });

  // Group by risk level for summary
  const summary = await prisma.additive.groupBy({
    by: ['riskLevel'],
    _count: { riskLevel: true },
    where: whereClause
  });

  res.json({
    success: true,
    data: {
      additives,
      summary: summary.map(s => ({
        riskLevel: s.riskLevel,
        count: s._count.riskLevel
      })),
      total: additives.length
    }
  });
}));

/**
 * GET /api/nutrition/additives/:eNumber
 * Get detailed information about a specific additive
 */
router.get('/additives/:eNumber', asyncHandler(async (req, res) => {
  const { eNumber } = req.params;

  const additive = await prisma.additive.findFirst({
    where: {
      OR: [
        { eNumber: eNumber.toUpperCase() },
        { name: { equals: eNumber, mode: 'insensitive' } }
      ]
    }
  });

  if (!additive) {
    throw new AppError('Additive not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // Find products that contain this additive
  const productsWithAdditive = await prisma.productAdditive.findMany({
    where: { additiveId: additive.id },
    include: {
      nutritionData: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              brand: true,
              category: true
            }
          }
        }
      }
    },
    take: 10 // Limit to 10 examples
  });

  res.json({
    success: true,
    data: {
      additive,
      examples: productsWithAdditive.map(pa => pa.nutritionData.product)
    }
  });
}));

/**
 * GET /api/nutrition/analysis/trends
 * Get nutrition trends and statistics
 */
router.get('/analysis/trends', asyncHandler(async (req, res) => {
  const { category, timeframe = '30d' } = req.query;

  // Get product counts by category
  const categoryStats = await prisma.product.groupBy({
    by: ['category'],
    _count: { category: true },
    where: category ? { category: category as string } : undefined,
    orderBy: { _count: { category: 'desc' } }
  });

  // Get average scores by category (placeholder - would need actual scoring data)
  const scoreStats = await prisma.nutritionData.aggregate({
    _avg: { finalScore: true },
    _count: { finalScore: true },
    where: {
      finalScore: { not: null },
      product: category ? { category: category as string } : undefined
    }
  });

  // Get additive risk distribution
  const additiveRiskStats = await prisma.additive.groupBy({
    by: ['riskLevel'],
    _count: { riskLevel: true }
  });

  res.json({
    success: true,
    data: {
      categoryDistribution: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count.category
      })),
      averageScore: scoreStats._avg.finalScore,
      totalScoredProducts: scoreStats._count.finalScore,
      additiveRiskDistribution: additiveRiskStats.map(stat => ({
        riskLevel: stat.riskLevel,
        count: stat._count.riskLevel
      }))
    }
  });
}));

/**
 * POST /api/nutrition/analyze-ingredients
 * Analyze ingredients list for additives and scoring
 */
router.post('/analyze-ingredients', asyncHandler(async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || typeof ingredients !== 'string') {
    throw new AppError('Ingredients string is required', 400, ERROR_CODES.INVALID_INPUT);
  }

  // Create temporary nutrition data object for analysis
  const tempNutritionData = {
    ingredients: [ingredients]
  };

  try {
    const scoring = await nutritionScoringService.calculateScore(tempNutritionData as any);
    
    // Extract just the additives information
    const analysis = {
      additives: scoring.additives,
      additivesScore: scoring.breakdown.additivesImpact,
      riskAssessment: scoring.additives.length === 0 ? 'No concerning additives found' :
        scoring.additives.some(a => a.riskLevel === 'red') ? 'High risk additives present' :
        scoring.additives.some(a => a.riskLevel === 'orange') ? 'Moderate risk additives present' :
        'Low risk additives only',
      recommendations: scoring.improvements?.filter(imp => 
        imp.includes('additive') || imp.includes('artificial')
      ) || []
    };

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Error analyzing ingredients:', error);
    throw new AppError('Failed to analyze ingredients', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}));

/**
 * GET /api/nutrition/health-scores/distribution
 * Get distribution of health scores across products
 */
router.get('/health-scores/distribution', asyncHandler(async (req, res) => {
  const { category } = req.query;

  // Get score distribution
  const scoreRanges = [
    { min: 0, max: 20, label: 'Poor (0-20)' },
    { min: 21, max: 40, label: 'Fair (21-40)' },
    { min: 41, max: 60, label: 'Good (41-60)' },
    { min: 61, max: 80, label: 'Very Good (61-80)' },
    { min: 81, max: 100, label: 'Excellent (81-100)' }
  ];

  const distribution = await Promise.all(
    scoreRanges.map(async range => {
      const count = await prisma.nutritionData.count({
        where: {
          finalScore: {
            gte: range.min,
            lte: range.max
          },
          product: category ? { category: category as string } : undefined
        }
      });

      return {
        range: range.label,
        count,
        min: range.min,
        max: range.max
      };
    })
  );

  // Get top and bottom performers
  const topPerformers = await prisma.nutritionData.findMany({
    where: {
      finalScore: { gte: 80 },
      product: category ? { category: category as string } : undefined
    },
    include: {
      product: {
        select: { id: true, name: true, brand: true, category: true }
      }
    },
    orderBy: { finalScore: 'desc' },
    take: 10
  });

  const bottomPerformers = await prisma.nutritionData.findMany({
    where: {
      finalScore: { lte: 40 },
      product: category ? { category: category as string } : undefined
    },
    include: {
      product: {
        select: { id: true, name: true, brand: true, category: true }
      }
    },
    orderBy: { finalScore: 'asc' },
    take: 10
  });

  res.json({
    success: true,
    data: {
      distribution,
      topPerformers: topPerformers.map(item => ({
        ...item.product,
        score: item.finalScore
      })),
      bottomPerformers: bottomPerformers.map(item => ({
        ...item.product,
        score: item.finalScore
      }))
    }
  });
}));

export default router;