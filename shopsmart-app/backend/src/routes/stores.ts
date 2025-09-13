import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { storeDiscoveryService } from '../services/storeDiscovery';
import { StoreChain, Location } from '@/shared/types';
import { STORE_CHAINS, DEFAULT_SEARCH_RADIUS, ERROR_CODES } from '@/shared/constants';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/stores/nearby
 * Find stores near a location
 */
router.get('/nearby', asyncHandler(async (req, res) => {
  const { lat, lng, radius, chains } = req.query;

  // Validate required parameters
  if (!lat || !lng) {
    throw new AppError('Latitude and longitude are required', 400, ERROR_CODES.INVALID_INPUT);
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);
  const searchRadius = radius ? parseFloat(radius as string) : DEFAULT_SEARCH_RADIUS;

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new AppError('Invalid coordinates provided', 400, ERROR_CODES.INVALID_INPUT);
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new AppError('Coordinates out of valid range', 400, ERROR_CODES.INVALID_INPUT);
  }

  const location: Location = { lat: latitude, lng: longitude };

  // Parse chains parameter
  let storeChains: StoreChain[] | undefined;
  if (chains) {
    const chainList = (chains as string).split(',');
    const validChains = chainList.filter(chain => 
      Object.values(STORE_CHAINS).includes(chain as StoreChain)
    ) as StoreChain[];
    
    if (validChains.length > 0) {
      storeChains = validChains;
    }
  }

  logger.info(`Finding stores near ${latitude}, ${longitude} within ${searchRadius} miles`, {
    chains: storeChains || 'all',
    location
  });

  const stores = await storeDiscoveryService.findNearbyStores(location, searchRadius, storeChains);

  res.json({
    success: true,
    data: {
      stores,
      location,
      radius: searchRadius,
      chains: storeChains || Object.values(STORE_CHAINS),
      count: stores.length
    }
  });
}));

/**
 * GET /api/stores/:storeId
 * Get detailed information about a specific store
 */
router.get('/:storeId', asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  if (!storeId) {
    throw new AppError('Store ID is required', 400, ERROR_CODES.INVALID_INPUT);
  }

  const store = await storeDiscoveryService.getStoreDetails(storeId);

  if (!store) {
    throw new AppError('Store not found', 404, ERROR_CODES.NOT_FOUND);
  }

  res.json({
    success: true,
    data: store
  });
}));

/**
 * GET /api/stores/chains
 * Get list of supported store chains
 */
router.get('/chains', asyncHandler(async (req, res) => {
  const chains = Object.entries(STORE_CHAINS).map(([key, value]) => ({
    id: value,
    name: key.charAt(0) + key.slice(1).toLowerCase(),
    displayName: key.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }));

  res.json({
    success: true,
    data: chains
  });
}));

/**
 * POST /api/stores/bulk-distance
 * Calculate distances for multiple stores from a location
 */
router.post('/bulk-distance', asyncHandler(async (req, res) => {
  const { location, storeIds } = req.body;

  if (!location || !location.lat || !location.lng) {
    throw new AppError('Location with lat/lng is required', 400, ERROR_CODES.INVALID_INPUT);
  }

  if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
    throw new AppError('Store IDs array is required', 400, ERROR_CODES.INVALID_INPUT);
  }

  const userLocation: Location = {
    lat: parseFloat(location.lat),
    lng: parseFloat(location.lng)
  };

  // Get store details for each ID
  const storePromises = storeIds.map(id => storeDiscoveryService.getStoreDetails(id));
  const stores = await Promise.all(storePromises);

  // Calculate distances and filter out null results
  const storesWithDistance = stores
    .filter(store => store !== null)
    .map(store => {
      const distance = calculateDistance(userLocation, store!.location);
      return {
        ...store,
        distance
      };
    })
    .sort((a, b) => a.distance - b.distance);

  res.json({
    success: true,
    data: {
      stores: storesWithDistance,
      location: userLocation,
      count: storesWithDistance.length
    }
  });
}));

/**
 * GET /api/stores/search
 * Search for stores by name, address, or other criteria
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q, lat, lng, radius, chain } = req.query;

  if (!q) {
    throw new AppError('Search query is required', 400, ERROR_CODES.INVALID_INPUT);
  }

  const query = q as string;
  let location: Location | undefined;
  let searchRadius = DEFAULT_SEARCH_RADIUS;

  if (lat && lng) {
    location = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };
    
    if (radius) {
      searchRadius = parseFloat(radius as string);
    }
  }

  // For now, this is a simple implementation
  // In a real app, you'd have a more sophisticated search
  let stores = await storeDiscoveryService.findNearbyStores(
    location || { lat: 39.8283, lng: -98.5795 }, // Center of US as default
    location ? searchRadius : 100, // Larger radius if no location
    chain ? [chain as StoreChain] : undefined
  );

  // Filter by search query (name, address)
  stores = stores.filter(store => 
    store.name.toLowerCase().includes(query.toLowerCase()) ||
    store.address.toLowerCase().includes(query.toLowerCase())
  );

  res.json({
    success: true,
    data: {
      stores,
      query,
      location,
      radius: searchRadius,
      count: stores.length
    }
  });
}));

/**
 * Helper function to calculate distance between two points
 */
function calculateDistance(location1: Location, location2: Location): number {
  const R = 3959; // Radius of Earth in miles
  const dLat = toRadians(location2.lat - location1.lat);
  const dLng = toRadians(location2.lng - location1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(location1.lat)) * Math.cos(toRadians(location2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default router;