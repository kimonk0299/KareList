import axios from 'axios';
import { 
  OpenFoodFactsProduct, 
  USDAProduct, 
  USDANutrient,
  NutritionData,
  Product 
} from '@/shared/types';
import { EXTERNAL_APIS } from '@/shared/constants';
import { logger } from '../config/logger';
import { redis } from '../index';

export class NutritionDataService {
  private openFoodFactsClient: any;
  private usdaClient: any;

  constructor() {
    // Initialize API clients with proper headers and rate limiting
    this.openFoodFactsClient = axios.create({
      baseURL: EXTERNAL_APIS.OPEN_FOOD_FACTS.BASE_URL,
      timeout: 10000,
      headers: {
        'User-Agent': 'ShopSmart-App/1.0 (contact@shopsmart.app)'
      }
    });

    this.usdaClient = axios.create({
      baseURL: EXTERNAL_APIS.USDA_FOOD_DATA.BASE_URL,
      timeout: 10000,
      params: {
        api_key: process.env.USDA_API_KEY
      }
    });
  }

  /**
   * Get nutrition data for a product by UPC/barcode
   */
  async getNutritionByUPC(upc: string): Promise<NutritionData | null> {
    const cacheKey = `nutrition:upc:${upc}`;
    
    try {
      // Check cache first
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // Try Open Food Facts first (best for UPC lookup)
      let nutritionData = await this.getOpenFoodFactsByUPC(upc);
      
      // Fallback to USDA if Open Food Facts doesn't have data
      if (!nutritionData) {
        nutritionData = await this.getUSDABySearch(`${upc}`);
      }

      // Cache the result for 7 days
      if (nutritionData) {
        await redis.setex(cacheKey, 7 * 24 * 60 * 60, JSON.stringify(nutritionData));
      }

      return nutritionData;

    } catch (error) {
      logger.error(`Error getting nutrition data for UPC ${upc}:`, error);
      return null;
    }
  }

  /**
   * Search for nutrition data by product name and brand
   */
  async searchNutritionData(name: string, brand?: string): Promise<NutritionData[]> {
    const cacheKey = `nutrition:search:${name}:${brand || 'no-brand'}`;
    
    try {
      // Check cache first
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const results: NutritionData[] = [];

      // Search Open Food Facts
      const offResults = await this.searchOpenFoodFacts(name, brand);
      results.push(...offResults);

      // Search USDA database
      const usdaResults = await this.searchUSDA(name, brand);
      results.push(...usdaResults);

      // Remove duplicates and cache results
      const uniqueResults = this.deduplicateResults(results);
      
      if (uniqueResults.length > 0) {
        await redis.setex(cacheKey, 60 * 60, JSON.stringify(uniqueResults)); // Cache for 1 hour
      }

      return uniqueResults;

    } catch (error) {
      logger.error(`Error searching nutrition data for "${name}" (${brand}):`, error);
      return [];
    }
  }

  /**
   * Enrich product data with nutrition information
   */
  async enrichProductWithNutrition(product: Partial<Product>): Promise<NutritionData | null> {
    try {
      // Try UPC first if available
      if (product.upc) {
        const nutritionData = await this.getNutritionByUPC(product.upc);
        if (nutritionData) return nutritionData;
      }

      // Fallback to search by name and brand
      if (product.name) {
        const searchResults = await this.searchNutritionData(product.name, product.brand);
        if (searchResults.length > 0) {
          // Return the first (most relevant) result
          return searchResults[0];
        }
      }

      return null;

    } catch (error) {
      logger.error(`Error enriching product ${product.id} with nutrition:`, error);
      return null;
    }
  }

  /**
   * Get product data from Open Food Facts by UPC
   */
  private async getOpenFoodFactsByUPC(upc: string): Promise<NutritionData | null> {
    try {
      const response = await this.openFoodFactsClient.get(`${EXTERNAL_APIS.OPEN_FOOD_FACTS.PRODUCT_BY_BARCODE}/${upc}.json`);
      
      if (response.data?.status === 1 && response.data?.product) {
        return this.mapOpenFoodFactsToNutrition(response.data.product);
      }

      return null;

    } catch (error) {
      logger.error(`Open Food Facts UPC lookup failed for ${upc}:`, error);
      return null;
    }
  }

  /**
   * Search Open Food Facts database
   */
  private async searchOpenFoodFacts(name: string, brand?: string): Promise<NutritionData[]> {
    try {
      const searchTerms = brand ? `${brand} ${name}` : name;
      
      const response = await this.openFoodFactsClient.get(EXTERNAL_APIS.OPEN_FOOD_FACTS.SEARCH, {
        params: {
          search_terms: searchTerms,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: 10
        }
      });

      if (response.data?.products) {
        return response.data.products
          .map((product: OpenFoodFactsProduct) => this.mapOpenFoodFactsToNutrition(product))
          .filter((nutrition: NutritionData | null) => nutrition !== null);
      }

      return [];

    } catch (error) {
      logger.error(`Open Food Facts search failed for "${name}":`, error);
      return [];
    }
  }

  /**
   * Search USDA Food Data Central by UPC or name
   */
  private async getUSDABySearch(query: string): Promise<NutritionData | null> {
    try {
      const response = await this.usdaClient.get(EXTERNAL_APIS.USDA_FOOD_DATA.SEARCH, {
        params: {
          query,
          dataType: ['Branded'],
          pageSize: 1
        }
      });

      if (response.data?.foods && response.data.foods.length > 0) {
        const food = response.data.foods[0];
        return this.mapUSDAToNutrition(food);
      }

      return null;

    } catch (error) {
      logger.error(`USDA search failed for "${query}":`, error);
      return null;
    }
  }

  /**
   * Search USDA database
   */
  private async searchUSDA(name: string, brand?: string): Promise<NutritionData[]> {
    try {
      const searchTerms = brand ? `${brand} ${name}` : name;
      
      const response = await this.usdaClient.get(EXTERNAL_APIS.USDA_FOOD_DATA.SEARCH, {
        params: {
          query: searchTerms,
          dataType: ['Branded'],
          pageSize: 10
        }
      });

      if (response.data?.foods) {
        return response.data.foods
          .map((food: USDAProduct) => this.mapUSDAToNutrition(food))
          .filter((nutrition: NutritionData | null) => nutrition !== null);
      }

      return [];

    } catch (error) {
      logger.error(`USDA search failed for "${name}":`, error);
      return [];
    }
  }

  /**
   * Map Open Food Facts product to our NutritionData format
   */
  private mapOpenFoodFactsToNutrition(product: OpenFoodFactsProduct): NutritionData | null {
    try {
      const nutriments = product.nutriments || {};

      return {
        servingSize: product.serving_size || undefined,
        servingsPerContainer: undefined,
        
        calories: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || undefined,
        caloriesFromFat: undefined,
        
        totalFat: nutriments['fat_100g'] || nutriments['fat'] || undefined,
        saturatedFat: nutriments['saturated-fat_100g'] || nutriments['saturated-fat'] || undefined,
        transFat: nutriments['trans-fat_100g'] || nutriments['trans-fat'] || undefined,
        
        cholesterol: nutriments['cholesterol_100g'] || nutriments['cholesterol'] || undefined,
        sodium: nutriments['sodium_100g'] || nutriments['sodium'] || undefined,
        
        totalCarbs: nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || undefined,
        dietaryFiber: nutriments['fiber_100g'] || nutriments['fiber'] || undefined,
        sugars: nutriments['sugars_100g'] || nutriments['sugars'] || undefined,
        addedSugars: undefined,
        
        protein: nutriments['proteins_100g'] || nutriments['proteins'] || undefined,
        
        vitaminA: nutriments['vitamin-a_100g'] || nutriments['vitamin-a'] || undefined,
        vitaminC: nutriments['vitamin-c_100g'] || nutriments['vitamin-c'] || undefined,
        calcium: nutriments['calcium_100g'] || nutriments['calcium'] || undefined,
        iron: nutriments['iron_100g'] || nutriments['iron'] || undefined,
        potassium: nutriments['potassium_100g'] || nutriments['potassium'] || undefined,
        vitaminD: nutriments['vitamin-d_100g'] || nutriments['vitamin-d'] || undefined
      };

    } catch (error) {
      logger.error('Error mapping Open Food Facts data:', error);
      return null;
    }
  }

  /**
   * Map USDA product to our NutritionData format
   */
  private mapUSDAToNutrition(food: USDAProduct): NutritionData | null {
    try {
      const nutritionData: Partial<NutritionData> = {};

      // Map USDA nutrients to our schema
      for (const nutrient of food.foodNutrients || []) {
        switch (nutrient.nutrientId) {
          case 1008: // Energy (kcal)
            nutritionData.calories = nutrient.value;
            break;
          case 1004: // Total lipid (fat)
            nutritionData.totalFat = nutrient.value;
            break;
          case 1258: // Fatty acids, total saturated
            nutritionData.saturatedFat = nutrient.value;
            break;
          case 1257: // Fatty acids, total trans
            nutritionData.transFat = nutrient.value;
            break;
          case 1253: // Cholesterol
            nutritionData.cholesterol = nutrient.value;
            break;
          case 1093: // Sodium
            nutritionData.sodium = nutrient.value;
            break;
          case 1005: // Carbohydrate, by difference
            nutritionData.totalCarbs = nutrient.value;
            break;
          case 1079: // Fiber, total dietary
            nutritionData.dietaryFiber = nutrient.value;
            break;
          case 2000: // Total sugars
            nutritionData.sugars = nutrient.value;
            break;
          case 1003: // Protein
            nutritionData.protein = nutrient.value;
            break;
          case 1106: // Vitamin A, RAE
            nutritionData.vitaminA = nutrient.value;
            break;
          case 1162: // Vitamin C, total ascorbic acid
            nutritionData.vitaminC = nutrient.value;
            break;
          case 1087: // Calcium, Ca
            nutritionData.calcium = nutrient.value;
            break;
          case 1089: // Iron, Fe
            nutritionData.iron = nutrient.value;
            break;
          case 1092: // Potassium, K
            nutritionData.potassium = nutrient.value;
            break;
          case 1114: // Vitamin D (D2 + D3)
            nutritionData.vitaminD = nutrient.value;
            break;
        }
      }

      return nutritionData as NutritionData;

    } catch (error) {
      logger.error('Error mapping USDA data:', error);
      return null;
    }
  }

  /**
   * Remove duplicate nutrition data results
   */
  private deduplicateResults(results: NutritionData[]): NutritionData[] {
    const seen = new Set();
    return results.filter(result => {
      // Create a simple hash based on key nutrition values
      const hash = `${result.calories}-${result.totalFat}-${result.protein}-${result.sodium}`;
      if (seen.has(hash)) {
        return false;
      }
      seen.add(hash);
      return true;
    });
  }

  /**
   * Batch process multiple products for nutrition enrichment
   */
  async batchEnrichProducts(products: Partial<Product>[]): Promise<Array<{ product: Partial<Product>, nutrition: NutritionData | null }>> {
    const results = await Promise.allSettled(
      products.map(product => this.enrichProductWithNutrition(product))
    );

    return products.map((product, index) => ({
      product,
      nutrition: results[index].status === 'fulfilled' ? results[index].value : null
    }));
  }

  /**
   * Get detailed nutrition information including ingredients and additives
   */
  async getDetailedNutritionInfo(upc: string): Promise<{ nutrition: NutritionData, ingredients: string[], additives: string[] } | null> {
    try {
      const response = await this.openFoodFactsClient.get(`${EXTERNAL_APIS.OPEN_FOOD_FACTS.PRODUCT_BY_BARCODE}/${upc}.json`);
      
      if (response.data?.status === 1 && response.data?.product) {
        const product = response.data.product;
        const nutrition = this.mapOpenFoodFactsToNutrition(product);
        
        if (!nutrition) return null;

        // Extract ingredients and additives
        const ingredients = product.ingredients_text ? product.ingredients_text.split(',').map((i: string) => i.trim()) : [];
        const additives = product.additives_tags || [];

        return {
          nutrition,
          ingredients,
          additives
        };
      }

      return null;

    } catch (error) {
      logger.error(`Error getting detailed nutrition info for UPC ${upc}:`, error);
      return null;
    }
  }
}

export const nutritionDataService = new NutritionDataService();