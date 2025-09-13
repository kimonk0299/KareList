import axios from 'axios';
import * as cheerio from 'cheerio';
import { Store, Location, StoreChain, StoreHours, TimeRange } from '@/shared/types';
import { STORE_CHAINS, DEFAULT_SEARCH_RADIUS, CACHE_DURATIONS } from '@/shared/constants';
import { logger } from '../config/logger';
import { prisma, redis } from '../index';

export class StoreDiscoveryService {
  private userAgent = process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  /**
   * Find stores near a given location
   */
  async findNearbyStores(
    location: Location, 
    radius: number = DEFAULT_SEARCH_RADIUS,
    chains?: StoreChain[]
  ): Promise<Store[]> {
    const cacheKey = `stores:nearby:${location.lat}:${location.lng}:${radius}:${chains?.join(',') || 'all'}`;
    
    try {
      // Check cache first
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const allStores: Store[] = [];
      const chainsToSearch = chains || Object.values(STORE_CHAINS) as StoreChain[];

      // Search each chain
      for (const chain of chainsToSearch) {
        try {
          const stores = await this.findStoresByChain(chain, location, radius);
          allStores.push(...stores);
        } catch (error) {
          logger.error(`Error finding ${chain} stores:`, error);
        }
      }

      // Calculate distances and sort
      const storesWithDistance = allStores
        .map(store => ({
          ...store,
          distance: this.calculateDistance(location, store.location)
        }))
        .filter(store => store.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      // Cache results for 30 days
      await redis.setex(cacheKey, CACHE_DURATIONS.STORE_LOCATIONS, JSON.stringify(storesWithDistance));

      return storesWithDistance;

    } catch (error) {
      logger.error('Error finding nearby stores:', error);
      throw new Error('Failed to find nearby stores');
    }
  }

  /**
   * Find stores for a specific chain
   */
  private async findStoresByChain(chain: StoreChain, location: Location, radius: number): Promise<Store[]> {
    switch (chain) {
      case STORE_CHAINS.WALMART:
        return this.findWalmartStores(location, radius);
      case STORE_CHAINS.TARGET:
        return this.findTargetStores(location, radius);
      case STORE_CHAINS.COSTCO:
        return this.findCostcoStores(location, radius);
      case STORE_CHAINS.KROGER:
        return this.findKrogerStores(location, radius);
      default:
        logger.warn(`Store chain ${chain} not implemented yet`);
        return [];
    }
  }

  /**
   * Find Walmart stores using their store locator API
   */
  private async findWalmartStores(location: Location, radius: number): Promise<Store[]> {
    try {
      const response = await axios.get('https://www.walmart.com/store/ajax/preferred-flyout', {
        params: {
          lat: location.lat,
          lng: location.lng
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Referer': 'https://www.walmart.com'
        },
        timeout: 10000
      });

      if (!response.data?.payload?.stores) {
        return [];
      }

      return response.data.payload.stores
        .filter((store: any) => store.geoPoint)
        .map((store: any) => this.mapWalmartStore(store))
        .filter((store: Store | null) => store !== null);

    } catch (error) {
      logger.error('Error fetching Walmart stores:', error);
      
      // Fallback to scraping if API fails
      return this.scrapeWalmartStores(location, radius);
    }
  }

  /**
   * Fallback: Scrape Walmart store locator
   */
  private async scrapeWalmartStores(location: Location, radius: number): Promise<Store[]> {
    try {
      const response = await axios.get('https://www.walmart.com/store/finder', {
        params: {
          location: `${location.lat},${location.lng}`,
          distance: radius
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const stores: Store[] = [];

      // Parse store data from the page
      $('.js-store-list .js-store-item').each((_, element) => {
        const store = this.parseWalmartStoreElement($, element);
        if (store) stores.push(store);
      });

      return stores;

    } catch (error) {
      logger.error('Error scraping Walmart stores:', error);
      return [];
    }
  }

  /**
   * Map Walmart API response to Store format
   */
  private mapWalmartStore(walmartStore: any): Store | null {
    try {
      return {
        id: `walmart-${walmartStore.id}`,
        chain: STORE_CHAINS.WALMART,
        name: walmartStore.displayName || walmartStore.name,
        address: this.formatAddress(walmartStore.address),
        location: {
          lat: parseFloat(walmartStore.geoPoint.latitude),
          lng: parseFloat(walmartStore.geoPoint.longitude)
        },
        phone: walmartStore.phone,
        hours: this.parseWalmartHours(walmartStore.operationalHours),
        services: {
          pharmacy: walmartStore.services?.includes('pharmacy') || false,
          grocery: true,
          pickup: walmartStore.services?.includes('pickup') || false,
          delivery: walmartStore.services?.includes('delivery') || false,
          gastation: walmartStore.services?.includes('gas_station') || false
        }
      };
    } catch (error) {
      logger.error('Error mapping Walmart store:', error);
      return null;
    }
  }

  /**
   * Parse Walmart store element from scraped HTML
   */
  private parseWalmartStoreElement($: cheerio.CheerioAPI, element: cheerio.Element): Store | null {
    try {
      const $store = $(element);
      const name = $store.find('.store-name').text().trim();
      const address = $store.find('.store-address').text().trim();
      const phone = $store.find('.store-phone').text().trim();
      
      // Extract coordinates from data attributes or embedded script
      const lat = parseFloat($store.attr('data-lat') || '0');
      const lng = parseFloat($store.attr('data-lng') || '0');
      
      if (!lat || !lng || !name) return null;

      return {
        id: `walmart-scraped-${lat}-${lng}`,
        chain: STORE_CHAINS.WALMART,
        name,
        address,
        location: { lat, lng },
        phone: phone || undefined,
        hours: this.parseGenericHours($store.find('.store-hours').html() || ''),
        services: {
          pharmacy: $store.find('.service-pharmacy').length > 0,
          grocery: true,
          pickup: $store.find('.service-pickup').length > 0,
          delivery: $store.find('.service-delivery').length > 0,
          gastation: $store.find('.service-gas').length > 0
        }
      };
    } catch (error) {
      logger.error('Error parsing Walmart store element:', error);
      return null;
    }
  }

  /**
   * Find Target stores
   */
  private async findTargetStores(location: Location, radius: number): Promise<Store[]> {
    try {
      // Target's store locator API endpoint
      const response = await axios.get('https://api.target.com/fulfillment_aggregator/v1/fiats', {
        params: {
          latitude: location.lat,
          longitude: location.lng,
          radius: radius,
          include_only_available_stores: true
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (!response.data?.locations) {
        return [];
      }

      return response.data.locations
        .map((store: any) => this.mapTargetStore(store))
        .filter((store: Store | null) => store !== null);

    } catch (error) {
      logger.error('Error fetching Target stores:', error);
      return [];
    }
  }

  /**
   * Map Target API response to Store format
   */
  private mapTargetStore(targetStore: any): Store | null {
    try {
      return {
        id: `target-${targetStore.location_id}`,
        chain: STORE_CHAINS.TARGET,
        name: targetStore.location_name,
        address: this.formatAddress(targetStore.address),
        location: {
          lat: parseFloat(targetStore.geographic_specifications.latitude),
          lng: parseFloat(targetStore.geographic_specifications.longitude)
        },
        phone: targetStore.phone,
        hours: this.parseTargetHours(targetStore.hours),
        services: {
          pharmacy: targetStore.type_description?.includes('Pharmacy') || false,
          grocery: targetStore.type_description?.includes('Grocery') || true,
          pickup: true, // Most Targets support pickup
          delivery: true,
          gastation: false
        }
      };
    } catch (error) {
      logger.error('Error mapping Target store:', error);
      return null;
    }
  }

  /**
   * Find Costco stores
   */
  private async findCostcoStores(location: Location, radius: number): Promise<Store[]> {
    try {
      // Costco store locator scraping approach
      const response = await axios.get('https://www.costco.com/WarehouseLocatorView', {
        params: {
          langId: '-1',
          storeId: '10301',
          catalogId: '10701',
          zipCode: '',
          latitude: location.lat,
          longitude: location.lng,
          radius: radius
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const stores: Store[] = [];

      $('.warehouse-item').each((_, element) => {
        const store = this.parseCostcoStoreElement($, element);
        if (store) stores.push(store);
      });

      return stores;

    } catch (error) {
      logger.error('Error fetching Costco stores:', error);
      return [];
    }
  }

  /**
   * Parse Costco store element
   */
  private parseCostcoStoreElement($: cheerio.CheerioAPI, element: cheerio.Element): Store | null {
    try {
      const $store = $(element);
      const name = $store.find('.warehouse-name').text().trim();
      const address = $store.find('.warehouse-address').text().trim();
      const phone = $store.find('.warehouse-phone').text().trim();
      
      // Extract coordinates from data attributes
      const lat = parseFloat($store.attr('data-latitude') || '0');
      const lng = parseFloat($store.attr('data-longitude') || '0');
      
      if (!lat || !lng || !name) return null;

      return {
        id: `costco-${lat}-${lng}`,
        chain: STORE_CHAINS.COSTCO,
        name,
        address,
        location: { lat, lng },
        phone: phone || undefined,
        hours: this.parseGenericHours($store.find('.warehouse-hours').html() || ''),
        services: {
          pharmacy: $store.find('.service-pharmacy').length > 0,
          grocery: true,
          pickup: false, // Costco generally doesn't do pickup
          delivery: $store.find('.service-delivery').length > 0,
          gastation: $store.find('.service-gas').length > 0
        }
      };
    } catch (error) {
      logger.error('Error parsing Costco store element:', error);
      return null;
    }
  }

  /**
   * Find Kroger stores (placeholder)
   */
  private async findKrogerStores(location: Location, radius: number): Promise<Store[]> {
    // Kroger implementation would go here
    logger.info('Kroger store discovery not implemented yet');
    return [];
  }

  /**
   * Parse Walmart operational hours
   */
  private parseWalmartHours(operationalHours: any): StoreHours {
    const defaultHours: StoreHours = {
      monday: { open: '06:00', close: '23:00' },
      tuesday: { open: '06:00', close: '23:00' },
      wednesday: { open: '06:00', close: '23:00' },
      thursday: { open: '06:00', close: '23:00' },
      friday: { open: '06:00', close: '23:00' },
      saturday: { open: '06:00', close: '23:00' },
      sunday: { open: '06:00', close: '23:00' }
    };

    if (!operationalHours) return defaultHours;

    try {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const parsedHours = { ...defaultHours };

      days.forEach((day, index) => {
        const dayData = operationalHours[index];
        if (dayData && dayData.operationalHours) {
          parsedHours[day as keyof StoreHours] = {
            open: dayData.operationalHours.startHr || '06:00',
            close: dayData.operationalHours.endHr || '23:00',
            closed: dayData.closed || false
          };
        }
      });

      return parsedHours;
    } catch (error) {
      logger.error('Error parsing Walmart hours:', error);
      return defaultHours;
    }
  }

  /**
   * Parse Target hours
   */
  private parseTargetHours(hours: any): StoreHours {
    const defaultHours: StoreHours = {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '22:00' },
      saturday: { open: '08:00', close: '22:00' },
      sunday: { open: '08:00', close: '22:00' }
    };

    if (!hours) return defaultHours;

    try {
      const parsedHours = { ...defaultHours };
      
      Object.keys(hours).forEach(day => {
        const dayKey = day.toLowerCase() as keyof StoreHours;
        if (dayKey in parsedHours && hours[day]) {
          parsedHours[dayKey] = {
            open: hours[day].open || '08:00',
            close: hours[day].close || '22:00',
            closed: hours[day].closed || false
          };
        }
      });

      return parsedHours;
    } catch (error) {
      logger.error('Error parsing Target hours:', error);
      return defaultHours;
    }
  }

  /**
   * Parse generic hours from HTML text
   */
  private parseGenericHours(hoursHtml: string): StoreHours {
    const defaultHours: StoreHours = {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '22:00' },
      saturday: { open: '08:00', close: '22:00' },
      sunday: { open: '08:00', close: '22:00' }
    };

    // This would parse hours from text like "Mon-Sun: 8:00AM-10:00PM"
    // Implementation would depend on the specific format
    return defaultHours;
  }

  /**
   * Format address from API response
   */
  private formatAddress(address: any): string {
    if (typeof address === 'string') return address;
    
    if (typeof address === 'object' && address) {
      const parts = [
        address.street || address.address1,
        address.city,
        address.state || address.stateProvince,
        address.zipCode || address.postalCode
      ].filter(Boolean);
      
      return parts.join(', ');
    }
    
    return 'Address not available';
  }

  /**
   * Calculate distance between two locations in miles
   */
  private calculateDistance(location1: Location, location2: Location): number {
    const R = 3959; // Radius of Earth in miles
    const dLat = this.toRadians(location2.lat - location1.lat);
    const dLng = this.toRadians(location2.lng - location1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(location1.lat)) * Math.cos(this.toRadians(location2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get store details by ID
   */
  async getStoreDetails(storeId: string): Promise<Store | null> {
    const cacheKey = `store:details:${storeId}`;
    
    try {
      // Check cache first
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // Check database
      const dbStore = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
          hours: true,
          layout: {
            include: {
              departments: true,
              aisles: true
            }
          }
        }
      });

      if (dbStore) {
        const store = this.mapDbStoreToStore(dbStore);
        await redis.setex(cacheKey, CACHE_DURATIONS.STORE_LOCATIONS, JSON.stringify(store));
        return store;
      }

      return null;

    } catch (error) {
      logger.error(`Error getting store details for ${storeId}:`, error);
      return null;
    }
  }

  /**
   * Map database store to Store type
   */
  private mapDbStoreToStore(dbStore: any): Store {
    return {
      id: dbStore.id,
      chain: dbStore.chain as StoreChain,
      name: dbStore.name,
      address: dbStore.address,
      location: {
        lat: dbStore.lat,
        lng: dbStore.lng
      },
      phone: dbStore.phone,
      hours: dbStore.hours ? this.mapDbHoursToStoreHours(dbStore.hours) : undefined,
      services: {
        pharmacy: false, // Would be derived from store data
        grocery: true,
        pickup: false,
        delivery: false,
        gastation: false
      },
      layout: dbStore.layout ? {
        type: dbStore.layout.layoutType as any,
        departments: dbStore.layout.departments || [],
        aisles: dbStore.layout.aisles || [],
        entrance: dbStore.layout.entranceLat ? {
          lat: dbStore.layout.entranceLat,
          lng: dbStore.layout.entranceLng
        } : { lat: 0, lng: 0 },
        checkouts: []
      } : undefined
    };
  }

  /**
   * Map database hours to StoreHours format
   */
  private mapDbHoursToStoreHours(dbHours: any): StoreHours {
    return {
      monday: { 
        open: dbHours.mondayOpen || '08:00', 
        close: dbHours.mondayClose || '22:00', 
        closed: dbHours.mondayClosed 
      },
      tuesday: { 
        open: dbHours.tuesdayOpen || '08:00', 
        close: dbHours.tuesdayClose || '22:00', 
        closed: dbHours.tuesdayClosed 
      },
      wednesday: { 
        open: dbHours.wednesdayOpen || '08:00', 
        close: dbHours.wednesdayClose || '22:00', 
        closed: dbHours.wednesdayClosed 
      },
      thursday: { 
        open: dbHours.thursdayOpen || '08:00', 
        close: dbHours.thursdayClose || '22:00', 
        closed: dbHours.thursdayClosed 
      },
      friday: { 
        open: dbHours.fridayOpen || '08:00', 
        close: dbHours.fridayClose || '22:00', 
        closed: dbHours.fridayClosed 
      },
      saturday: { 
        open: dbHours.saturdayOpen || '08:00', 
        close: dbHours.saturdayClose || '22:00', 
        closed: dbHours.saturdayClosed 
      },
      sunday: { 
        open: dbHours.sundayOpen || '08:00', 
        close: dbHours.sundayClose || '22:00', 
        closed: dbHours.sundayClosed 
      }
    };
  }
}

export const storeDiscoveryService = new StoreDiscoveryService();