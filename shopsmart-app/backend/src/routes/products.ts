import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { nutritionDataService } from '../services/nutritionData';
import { nutritionScoringService } from '../services/nutritionScoring';
import { ProductSearchParams } from '@/shared/types';
import { ERROR_CODES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/shared/constants';
import { logger } from '../config/logger';
import { prisma } from '../index';

const router = Router();

/**
 * GET /api/products/search
 * Search for products with nutrition scoring
 */
router.get('/search', asyncHandler(async (req, res) => {
  const {
    q,
    storeId,
    category,
    maxPrice,
    minScore,
    certifications,
    sortBy = 'relevance',
    limit = DEFAULT_PAGE_SIZE,
    offset = 0
  } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400, ERROR_CODES.INVALID_INPUT);
  }

  const searchLimit = Math.min(parseInt(limit as string) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const searchOffset = parseInt(offset as string) || 0;

  const searchParams: ProductSearchParams = {
    query: q.toString().trim(),
    storeId: storeId as string | undefined,
    category: category as string | undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    minScore: minScore ? parseFloat(minScore as string) : undefined,
    certifications: certifications ? (certifications as string).split(',') as any : undefined,
    sortBy: sortBy as any,
    limit: searchLimit,
    offset: searchOffset
  };

  logger.info('Product search request', { searchParams });

  const searchStartTime = Date.now();

  // Build the search query
  let whereClause: any = {
    OR: [
      { name: { contains: searchParams.query, mode: 'insensitive' } },
      { brand: { contains: searchParams.query, mode: 'insensitive' } },
      { description: { contains: searchParams.query, mode: 'insensitive' } }
    ]
  };

  if (searchParams.category) {
    whereClause.category = { equals: searchParams.category, mode: 'insensitive' };
  }

  if (searchParams.certifications) {
    whereClause.certifications = {
      hasEvery: searchParams.certifications
    };
  }

  // Execute the search
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: {
        nutritionData: {
          include: {
            additives: {
              include: {
                additive: true
              }
            }
          }
        },
        storeProducts: {
          where: searchParams.storeId ? { storeId: searchParams.storeId } : {},
          include: {
            store: true,
            aisle: true
          },
          orderBy: { price: 'asc' }
        }
      },
      orderBy: searchParams.sortBy === 'price' ? { storeProducts: { _count: 'desc' } } : { name: 'asc' },
      take: searchParams.limit,
      skip: searchParams.offset
    }),
    prisma.product.count({ where: whereClause })
  ]);

  // Process products and calculate scores
  const enrichedProducts = await Promise.all(
    products.map(async product => {
      let nutritionScoring = null;

      // Calculate nutrition score if nutrition data exists
      if (product.nutritionData) {
        try {
          nutritionScoring = await nutritionScoringService.calculateScore(product.nutritionData);
        } catch (error) {
          logger.error(`Error calculating score for product ${product.id}:`, error);
        }
      }

      // Filter store products by constraints
      let storeProducts = product.storeProducts;
      
      if (searchParams.maxPrice) {
        storeProducts = storeProducts.filter(sp => sp.price <= searchParams.maxPrice!);
      }

      if (searchParams.minScore && nutritionScoring) {
        if (nutritionScoring.finalScore < searchParams.minScore) {
          return null; // Skip this product
        }
      }

      return {
        id: product.id,
        upc: product.upc,
        name: product.name,
        brand: product.brand,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        imageUrl: product.imageUrl,
        certifications: product.certifications,
        ingredients: product.ingredients ? product.ingredients.split(',').map(i => i.trim()) : [],
        allergens: product.allergens,
        nutritionData: product.nutritionData,
        scoring: nutritionScoring,
        storeData: storeProducts.map(sp => ({
          storeId: sp.storeId,
          storeChain: sp.store.chain,
          storeName: sp.store.name,
          productId: sp.storeProductId,
          price: sp.price,
          salePrice: sp.salePrice,
          inStock: sp.inStock,
          aisle: sp.aisle?.number,
          section: sp.section,
          availability: sp.availability,
          lastUpdated: sp.lastUpdated
        })),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    })
  );

  // Filter out null results and sort
  let filteredProducts = enrichedProducts.filter(p => p !== null);

  // Apply sorting
  if (searchParams.sortBy === 'score' && filteredProducts.some(p => p.scoring)) {
    filteredProducts.sort((a, b) => (b.scoring?.finalScore || 0) - (a.scoring?.finalScore || 0));
  } else if (searchParams.sortBy === 'price') {
    filteredProducts.sort((a, b) => {
      const aPrice = Math.min(...a.storeData.map(sd => sd.price).filter(p => p > 0));
      const bPrice = Math.min(...b.storeData.map(sd => sd.price).filter(p => p > 0));
      return aPrice - bPrice;
    });
  }

  const searchTime = (Date.now() - searchStartTime) / 1000;

  res.json({
    success: true,
    data: {
      products: filteredProducts,
      totalResults: totalCount,
      searchTime,
      searchParams,
      hasNext: searchOffset + searchLimit < totalCount,
      hasPrev: searchOffset > 0
    }
  });
}));

/**
 * GET /api/products/:productId
 * Get detailed product information
 */
router.get('/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { storeId } = req.query;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      nutritionData: {
        include: {
          additives: {
            include: {
              additive: true
            }
          }
        }
      },
      storeProducts: {
        where: storeId ? { storeId: storeId as string } : {},
        include: {
          store: true,
          aisle: true
        }
      }
    }
  });

  if (!product) {
    throw new AppError('Product not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // Calculate nutrition score
  let nutritionScoring = null;
  if (product.nutritionData) {
    try {
      nutritionScoring = await nutritionScoringService.calculateScore(product.nutritionData);
    } catch (error) {
      logger.error(`Error calculating score for product ${product.id}:`, error);
    }
  }

  const enrichedProduct = {
    ...product,
    ingredients: product.ingredients ? product.ingredients.split(',').map(i => i.trim()) : [],
    scoring: nutritionScoring,
    storeData: product.storeProducts.map(sp => ({
      storeId: sp.storeId,
      storeChain: sp.store.chain,
      storeName: sp.store.name,
      productId: sp.storeProductId,
      price: sp.price,
      salePrice: sp.salePrice,
      inStock: sp.inStock,
      aisle: sp.aisle?.number,
      section: sp.section,
      availability: sp.availability,
      lastUpdated: sp.lastUpdated
    }))
  };

  res.json({
    success: true,
    data: enrichedProduct
  });
}));

/**
 * GET /api/products/:productId/alternatives
 * Get healthier alternatives for a product
 */
router.get('/:productId/alternatives', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { storeId, limit = 10 } = req.query;

  // Get the original product
  const originalProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      nutritionData: true
    }
  });

  if (!originalProduct) {
    throw new AppError('Product not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // Find similar products in the same category
  const similarProducts = await prisma.product.findMany({
    where: {
      category: originalProduct.category,
      id: { not: productId },
      nutritionData: { isNot: null }
    },
    include: {
      nutritionData: {
        include: {
          additives: {
            include: {
              additive: true
            }
          }
        }
      },
      storeProducts: {
        where: storeId ? { storeId: storeId as string } : {},
        include: {
          store: true,
          aisle: true
        }
      }
    },
    take: parseInt(limit as string) * 2 // Get more to filter later
  });

  // Calculate scores for all products
  const productsWithScores = await Promise.all([
    ...similarProducts.map(async product => {
      const nutritionScoring = await nutritionScoringService.calculateScore(product.nutritionData!);
      return {
        ...product,
        scoring: nutritionScoring,
        storeData: product.storeProducts.map(sp => ({
          storeId: sp.storeId,
          storeChain: sp.store.chain,
          storeName: sp.store.name,
          price: sp.price,
          inStock: sp.inStock,
          aisle: sp.aisle?.number
        }))
      };
    })
  ]);

  // Calculate original product score for comparison
  const originalScore = originalProduct.nutritionData 
    ? (await nutritionScoringService.calculateScore(originalProduct.nutritionData)).finalScore
    : 0;

  // Filter for better alternatives
  const betterAlternatives = productsWithScores
    .filter(product => product.scoring.finalScore > originalScore)
    .sort((a, b) => b.scoring.finalScore - a.scoring.finalScore)
    .slice(0, parseInt(limit as string));

  res.json({
    success: true,
    data: {
      originalProduct: {
        id: originalProduct.id,
        name: originalProduct.name,
        brand: originalProduct.brand,
        score: originalScore
      },
      alternatives: betterAlternatives.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        scoring: product.scoring,
        storeData: product.storeData,
        improvementScore: product.scoring.finalScore - originalScore
      })),
      count: betterAlternatives.length
    }
  });
}));

/**
 * POST /api/products/enrich
 * Enrich product data with nutrition information
 */
router.post('/enrich', asyncHandler(async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new AppError('Products array is required', 400, ERROR_CODES.INVALID_INPUT);
  }

  if (products.length > 50) {
    throw new AppError('Cannot enrich more than 50 products at once', 400, ERROR_CODES.INVALID_INPUT);
  }

  logger.info(`Enriching ${products.length} products with nutrition data`);

  const enrichedResults = await nutritionDataService.batchEnrichProducts(products);

  const results = enrichedResults.map(({ product, nutrition }) => ({
    product,
    nutrition,
    enriched: nutrition !== null
  }));

  const enrichedCount = results.filter(r => r.enriched).length;

  res.json({
    success: true,
    data: {
      results,
      enrichedCount,
      totalProducts: products.length,
      enrichmentRate: (enrichedCount / products.length) * 100
    }
  });
}));

/**
 * GET /api/products/categories
 * Get available product categories
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      category: true
    },
    orderBy: {
      _count: {
        category: 'desc'
      }
    }
  });

  res.json({
    success: true,
    data: categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }))
  });
}));

export default router;