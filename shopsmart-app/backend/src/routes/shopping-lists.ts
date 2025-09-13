import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate } from './users';
import { ERROR_CODES } from '@/shared/constants';
import { logger } from '../config/logger';
import { prisma } from '../index';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/shopping-lists
 * Get all shopping lists for the authenticated user
 */
router.get('/', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  let whereClause: any = { userId };
  if (status) {
    whereClause.status = status;
  }

  const shoppingLists = await prisma.shoppingList.findMany({
    where: whereClause,
    include: {
      items: true,
      stores: {
        include: {
          route: {
            include: {
              stops: true
            }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const enrichedLists = shoppingLists.map(list => ({
    id: list.id,
    name: list.name,
    status: list.status,
    totalEstimatedCost: list.totalEstimatedCost,
    itemCount: list.items.length,
    storeCount: list.stores.length,
    completedItems: list.items.filter(item => item.completed).length,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt
  }));

  res.json({
    success: true,
    data: enrichedLists
  });
}));

/**
 * POST /api/shopping-lists
 * Create a new shopping list
 */
router.post('/', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { name, items = [] } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('Shopping list name is required', 400, ERROR_CODES.REQUIRED_FIELD);
  }

  const shoppingList = await prisma.shoppingList.create({
    data: {
      name: name.trim(),
      userId,
      status: 'draft',
      totalEstimatedCost: 0,
      items: {
        create: items.map((item: any) => ({
          productId: item.productId || null,
          customName: item.customName || null,
          quantity: item.quantity || 1,
          unit: item.unit || null,
          notes: item.notes || null,
          priority: item.priority || 'medium',
          completed: false
        }))
      }
    },
    include: {
      items: true
    }
  });

  logger.info(`Shopping list created: ${shoppingList.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    data: shoppingList
  });
}));

/**
 * GET /api/shopping-lists/:listId
 * Get a specific shopping list with full details
 */
router.get('/:listId', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { listId } = req.params;

  const shoppingList = await prisma.shoppingList.findFirst({
    where: { id: listId, userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              nutritionData: true,
              storeProducts: {
                include: {
                  store: true,
                  aisle: true
                }
              }
            }
          }
        }
      },
      stores: {
        include: {
          store: true,
          route: {
            include: {
              stops: true
            }
          }
        }
      }
    }
  });

  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enrich items with product and store data
  const enrichedItems = shoppingList.items.map(item => ({
    ...item,
    product: item.product ? {
      id: item.product.id,
      name: item.product.name,
      brand: item.product.brand,
      category: item.product.category,
      imageUrl: item.product.imageUrl,
      nutritionData: item.product.nutritionData,
      storeData: item.product.storeProducts.map(sp => ({
        storeId: sp.storeId,
        storeName: sp.store.name,
        storeChain: sp.store.chain,
        price: sp.price,
        salePrice: sp.salePrice,
        inStock: sp.inStock,
        aisle: sp.aisle?.number,
        section: sp.section
      }))
    } : null
  }));

  const enrichedShoppingList = {
    ...shoppingList,
    items: enrichedItems,
    stores: shoppingList.stores.map(storeAssignment => ({
      storeId: storeAssignment.storeId,
      storeName: storeAssignment.store?.name || 'Unknown Store',
      storeChain: storeAssignment.store?.chain || 'unknown',
      itemIds: storeAssignment.itemIds,
      estimatedCost: storeAssignment.estimatedCost,
      completed: storeAssignment.completed,
      route: storeAssignment.route
    }))
  };

  res.json({
    success: true,
    data: enrichedShoppingList
  });
}));

/**
 * PUT /api/shopping-lists/:listId
 * Update shopping list details
 */
router.put('/:listId', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { listId } = req.params;
  const { name, status } = req.body;

  const existingList = await prisma.shoppingList.findFirst({
    where: { id: listId, userId }
  });

  if (!existingList) {
    throw new AppError('Shopping list not found', 404, ERROR_CODES.NOT_FOUND);
  }

  const updatedList = await prisma.shoppingList.update({
    where: { id: listId },
    data: {
      name: name || undefined,
      status: status || undefined
    },
    include: {
      items: true,
      stores: true
    }
  });

  res.json({
    success: true,
    data: updatedList
  });
}));

/**
 * DELETE /api/shopping-lists/:listId
 * Delete a shopping list
 */
router.delete('/:listId', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { listId } = req.params;

  const existingList = await prisma.shoppingList.findFirst({
    where: { id: listId, userId }
  });

  if (!existingList) {
    throw new AppError('Shopping list not found', 404, ERROR_CODES.NOT_FOUND);
  }

  await prisma.shoppingList.delete({
    where: { id: listId }
  });

  logger.info(`Shopping list deleted: ${listId} by user ${userId}`);

  res.json({
    success: true,
    message: 'Shopping list deleted successfully'
  });
}));

/**
 * POST /api/shopping-lists/:listId/items
 * Add items to a shopping list
 */
router.post('/:listId/items', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { listId } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Items array is required', 400, ERROR_CODES.INVALID_INPUT);
  }

  // Verify list ownership
  const existingList = await prisma.shoppingList.findFirst({
    where: { id: listId, userId }
  });

  if (!existingList) {
    throw new AppError('Shopping list not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // Add items
  const createdItems = await prisma.shoppingListItem.createMany({
    data: items.map((item: any) => ({
      shoppingListId: listId,
      productId: item.productId || null,
      customName: item.customName || null,
      quantity: item.quantity || 1,
      unit: item.unit || null,
      notes: item.notes || null,
      priority: item.priority || 'medium',
      completed: false
    }))
  });

  // Get the created items with full details
  const addedItems = await prisma.shoppingListItem.findMany({
    where: { shoppingListId: listId },
    include: {
      product: {
        include: {
          nutritionData: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: createdItems.count
  });

  res.json({
    success: true,
    data: addedItems,
    message: `Added ${createdItems.count} items to shopping list`
  });
}));

/**
 * PUT /api/shopping-lists/:listId/items/:itemId
 * Update a shopping list item
 */
router.put('/:listId/items/:itemId', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { listId, itemId } = req.params;
  const { quantity, notes, priority, completed, storeAssignment } = req.body;

  // Verify list ownership
  const existingList = await prisma.shoppingList.findFirst({
    where: { id: listId, userId }
  });

  if (!existingList) {
    throw new AppError('Shopping list not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // Update item
  const updatedItem = await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: {
      quantity: quantity || undefined,
      notes: notes || undefined,
      priority: priority || undefined,
      completed: completed !== undefined ? completed : undefined,
      storeAssignment: storeAssignment || undefined
    },
    include: {
      product: {
        include: {
          nutritionData: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: updatedItem
  });
}));

/**
 * DELETE /api/shopping-lists/:listId/items/:itemId
 * Remove an item from a shopping list
 */
router.delete('/:listId/items/:itemId', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { listId, itemId } = req.params;

  // Verify list ownership
  const existingList = await prisma.shoppingList.findFirst({
    where: { id: listId, userId }
  });

  if (!existingList) {
    throw new AppError('Shopping list not found', 404, ERROR_CODES.NOT_FOUND);
  }

  await prisma.shoppingListItem.delete({
    where: { id: itemId }
  });

  res.json({
    success: true,
    message: 'Item removed from shopping list'
  });
}));

/**
 * POST /api/shopping-lists/:listId/assign-stores
 * Assign items to stores based on availability and pricing
 */
router.post('/:listId/assign-stores', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { listId } = req.params;
  const { preferredStores, optimizeForPrice = true } = req.body;

  // Verify list ownership
  const shoppingList = await prisma.shoppingList.findFirst({
    where: { id: listId, userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              storeProducts: {
                include: { store: true }
              }
            }
          }
        }
      }
    }
  });

  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // Group items by optimal stores
  const storeAssignments: Record<string, { items: string[], estimatedCost: number }> = {};

  for (const item of shoppingList.items) {
    if (item.product && item.product.storeProducts.length > 0) {
      let bestStoreProduct = item.product.storeProducts[0];

      // Find best store option
      for (const storeProduct of item.product.storeProducts) {
        if (preferredStores && !preferredStores.includes(storeProduct.storeId)) {
          continue;
        }

        if (optimizeForPrice && storeProduct.price < bestStoreProduct.price) {
          bestStoreProduct = storeProduct;
        }
      }

      const storeId = bestStoreProduct.storeId;
      if (!storeAssignments[storeId]) {
        storeAssignments[storeId] = { items: [], estimatedCost: 0 };
      }

      storeAssignments[storeId].items.push(item.id);
      storeAssignments[storeId].estimatedCost += bestStoreProduct.price * item.quantity;

      // Update item with store assignment
      await prisma.shoppingListItem.update({
        where: { id: item.id },
        data: { storeAssignment: storeId }
      });
    }
  }

  // Create or update store assignments
  for (const [storeId, assignment] of Object.entries(storeAssignments)) {
    await prisma.shoppingListStore.upsert({
      where: {
        shoppingListId_storeId: {
          shoppingListId: listId,
          storeId
        }
      },
      update: {
        itemIds: assignment.items,
        estimatedCost: assignment.estimatedCost
      },
      create: {
        shoppingListId: listId,
        storeId,
        itemIds: assignment.items,
        estimatedCost: assignment.estimatedCost
      }
    });
  }

  // Update total estimated cost
  const totalCost = Object.values(storeAssignments)
    .reduce((sum, assignment) => sum + assignment.estimatedCost, 0);

  await prisma.shoppingList.update({
    where: { id: listId },
    data: { totalEstimatedCost: totalCost }
  });

  res.json({
    success: true,
    data: {
      storeAssignments: Object.entries(storeAssignments).map(([storeId, assignment]) => ({
        storeId,
        itemCount: assignment.items.length,
        estimatedCost: assignment.estimatedCost
      })),
      totalEstimatedCost: totalCost
    }
  });
}));

export default router;