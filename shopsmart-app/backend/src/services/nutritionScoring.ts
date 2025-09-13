import { 
  SCORING_WEIGHTS, 
  SCORE_THRESHOLDS, 
  ADDITIVE_RISK_LEVELS,
  ADDITIVE_POINT_DEDUCTIONS,
  CERTIFICATIONS 
} from '@/shared/constants';
import { 
  NutritionData as NutritionDataType, 
  NutritionScoring,
  AdditiveInfo,
  ScoreCategory,
  ScoreColor 
} from '@/shared/types';
import { logger } from '../config/logger';
import { prisma } from '../index';

export class NutritionScoringService {
  
  /**
   * Calculate comprehensive nutrition score using Yuka-style algorithm
   * 60% Nutritional Quality + 30% Additives Impact + 10% Organic Bonus
   */
  async calculateScore(nutritionData: NutritionDataType): Promise<NutritionScoring> {
    try {
      // Calculate individual components
      const nutritionalQuality = this.calculateNutritionalQuality(nutritionData);
      const additivesData = await this.calculateAdditivesImpact(nutritionData);
      const organicBonus = this.calculateOrganicBonus(nutritionData);

      // Calculate weighted final score
      const finalScore = Math.round(
        (nutritionalQuality * SCORING_WEIGHTS.NUTRITIONAL_QUALITY) +
        (additivesData.score * SCORING_WEIGHTS.ADDITIVES_IMPACT) +
        (organicBonus * SCORING_WEIGHTS.ORGANIC_BONUS)
      );

      // Determine category and color
      const category = this.getScoreCategory(finalScore);
      const color = this.getScoreColor(category);

      // Generate improvement suggestions
      const improvements = this.generateImprovements(
        nutritionalQuality, 
        additivesData, 
        organicBonus
      );

      return {
        finalScore,
        category,
        color,
        breakdown: {
          nutritionalQuality,
          additivesImpact: additivesData.score,
          organicBonus
        },
        additives: additivesData.additives,
        improvements
      };

    } catch (error) {
      logger.error('Error calculating nutrition score:', error);
      throw new Error('Failed to calculate nutrition score');
    }
  }

  /**
   * Calculate nutritional quality score based on Nutri-Score algorithm
   * Adapted for 0-100 scale
   */
  private calculateNutritionalQuality(nutrition: NutritionDataType): number {
    let score = 100; // Start with perfect score

    // Negative points for unfavorable nutrients
    if (nutrition.calories) {
      const caloriesPer100g = this.normalizeToPerPor100g(nutrition.calories, nutrition.servingSize);
      if (caloriesPer100g > 335) score -= 10;
      else if (caloriesPer100g > 270) score -= 8;
      else if (caloriesPer100g > 225) score -= 6;
      else if (caloriesPer100g > 180) score -= 4;
      else if (caloriesPer100g > 135) score -= 2;
    }

    if (nutrition.saturatedFat) {
      const satFatPer100g = this.normalizeToPerPor100g(nutrition.saturatedFat, nutrition.servingSize);
      if (satFatPer100g > 10) score -= 10;
      else if (satFatPer100g > 8) score -= 8;
      else if (satFatPer100g > 6) score -= 6;
      else if (satFatPer100g > 4) score -= 4;
      else if (satFatPer100g > 2) score -= 2;
    }

    if (nutrition.sugars) {
      const sugarsPer100g = this.normalizeToPerPor100g(nutrition.sugars, nutrition.servingSize);
      if (sugarsPer100g > 45) score -= 10;
      else if (sugarsPer100g > 36) score -= 8;
      else if (sugarsPer100g > 27) score -= 6;
      else if (sugarsPer100g > 18) score -= 4;
      else if (sugarsPer100g > 9) score -= 2;
    }

    if (nutrition.sodium) {
      const sodiumPer100g = this.normalizeToPerPor100g(nutrition.sodium, nutrition.servingSize);
      if (sodiumPer100g > 900) score -= 10;
      else if (sodiumPer100g > 720) score -= 8;
      else if (sodiumPer100g > 540) score -= 6;
      else if (sodiumPer100g > 360) score -= 4;
      else if (sodiumPer100g > 180) score -= 2;
    }

    // Positive points for favorable nutrients
    if (nutrition.dietaryFiber) {
      const fiberPer100g = this.normalizeToPerPor100g(nutrition.dietaryFiber, nutrition.servingSize);
      if (fiberPer100g > 4.7) score += 5;
      else if (fiberPer100g > 3.7) score += 4;
      else if (fiberPer100g > 2.8) score += 3;
      else if (fiberPer100g > 1.9) score += 2;
      else if (fiberPer100g > 0.9) score += 1;
    }

    if (nutrition.protein) {
      const proteinPer100g = this.normalizeToPerPor100g(nutrition.protein, nutrition.servingSize);
      if (proteinPer100g > 8) score += 5;
      else if (proteinPer100g > 6.4) score += 4;
      else if (proteinPer100g > 4.8) score += 3;
      else if (proteinPer100g > 3.2) score += 2;
      else if (proteinPer100g > 1.6) score += 1;
    }

    // Ensure score stays within 0-100 bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate additives impact score
   */
  private async calculateAdditivesImpact(nutrition: NutritionDataType): Promise<{score: number, additives: AdditiveInfo[]}> {
    if (!nutrition.ingredients) {
      return { score: 100, additives: [] }; // No ingredients data = assume clean
    }

    const additives: AdditiveInfo[] = [];
    let score = 100;

    // Extract E-numbers and common additive names
    const extractedAdditives = await this.extractAdditives(nutrition.ingredients);

    for (const additive of extractedAdditives) {
      additives.push({
        code: additive.eNumber || additive.name,
        name: additive.name,
        riskLevel: additive.riskLevel as any,
        description: additive.description,
        pointDeduction: additive.pointDeduction
      });

      score -= additive.pointDeduction;
    }

    return {
      score: Math.max(0, score),
      additives
    };
  }

  /**
   * Calculate organic bonus score
   */
  private calculateOrganicBonus(nutrition: NutritionDataType): number {
    // This would be determined by product certifications
    // For now, check if product has organic certification
    // This will be enhanced when we have access to product certifications
    return 0; // Default to no bonus without certification data
  }

  /**
   * Extract additives from ingredients list
   */
  private async extractAdditives(ingredients: string[]): Promise<any[]> {
    const extractedAdditives = [];
    const ingredientsText = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;

    // Extract E-numbers
    const eNumberPattern = /E\d{3}[a-z]?/gi;
    const eNumbers = ingredientsText.match(eNumberPattern) || [];

    for (const eNumber of eNumbers) {
      const additive = await prisma.additive.findFirst({
        where: { eNumber: eNumber.toUpperCase() }
      });

      if (additive) {
        extractedAdditives.push({
          eNumber: additive.eNumber,
          name: additive.name,
          riskLevel: additive.riskLevel,
          description: additive.description,
          pointDeduction: additive.pointDeduction
        });
      }
    }

    // Extract common additive names
    const commonAdditives = [
      'sodium benzoate', 'potassium sorbate', 'citric acid', 'ascorbic acid',
      'tocopherols', 'lecithin', 'carrageenan', 'xanthan gum', 'guar gum',
      'sodium nitrite', 'sodium nitrate', 'monosodium glutamate', 'msg',
      'high fructose corn syrup', 'artificial flavor', 'artificial color',
      'red 40', 'yellow 5', 'blue 1', 'caramel color'
    ];

    for (const additiveName of commonAdditives) {
      if (ingredientsText.toLowerCase().includes(additiveName.toLowerCase())) {
        const additive = await prisma.additive.findFirst({
          where: { 
            name: { 
              contains: additiveName, 
              mode: 'insensitive' 
            } 
          }
        });

        if (additive && !extractedAdditives.find(a => a.name === additive.name)) {
          extractedAdditives.push({
            eNumber: additive.eNumber,
            name: additive.name,
            riskLevel: additive.riskLevel,
            description: additive.description,
            pointDeduction: additive.pointDeduction
          });
        }
      }
    }

    return extractedAdditives;
  }

  /**
   * Normalize nutrient value to per 100g for consistent scoring
   */
  private normalizeToPerPor100g(value: number, servingSize?: string): number {
    if (!servingSize) return value;

    // Parse serving size to extract grams
    const gramMatch = servingSize.match(/(\d+)\s*g/i);
    if (gramMatch) {
      const grams = parseInt(gramMatch[1]);
      return (value / grams) * 100;
    }

    // If no grams found, assume serving size is reasonable (around 30g)
    return (value / 30) * 100;
  }

  /**
   * Get score category based on final score
   */
  private getScoreCategory(score: number): ScoreCategory {
    if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'excellent';
    if (score >= SCORE_THRESHOLDS.GOOD) return 'good';
    if (score >= SCORE_THRESHOLDS.FAIR) return 'fair';
    return 'poor';
  }

  /**
   * Get score color based on category
   */
  private getScoreColor(category: ScoreCategory): ScoreColor {
    switch (category) {
      case 'excellent': return 'green';
      case 'good': return 'light-green';
      case 'fair': return 'orange';
      case 'poor': return 'red';
    }
  }

  /**
   * Generate improvement suggestions based on scoring breakdown
   */
  private generateImprovements(
    nutritionalQuality: number,
    additivesData: { score: number, additives: AdditiveInfo[] },
    organicBonus: number
  ): string[] {
    const improvements: string[] = [];

    if (nutritionalQuality < 60) {
      improvements.push('Look for products with lower sugar, sodium, and saturated fat');
      improvements.push('Choose products with higher fiber and protein content');
    }

    if (additivesData.score < 80) {
      const highRiskAdditives = additivesData.additives.filter(a => a.riskLevel === 'red' || a.riskLevel === 'orange');
      if (highRiskAdditives.length > 0) {
        improvements.push(`Avoid products with ${highRiskAdditives.map(a => a.name).join(', ')}`);
      }
      improvements.push('Choose products with fewer artificial additives and preservatives');
    }

    if (organicBonus === 0) {
      improvements.push('Consider organic alternatives when available');
    }

    return improvements;
  }

  /**
   * Batch calculate scores for multiple products
   */
  async batchCalculateScores(nutritionDataList: NutritionDataType[]): Promise<NutritionScoring[]> {
    const results = await Promise.allSettled(
      nutritionDataList.map(nutrition => this.calculateScore(nutrition))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        logger.error(`Failed to calculate score for product ${index}:`, result.reason);
        // Return default poor score for failed calculations
        return {
          finalScore: 0,
          category: 'poor' as ScoreCategory,
          color: 'red' as ScoreColor,
          breakdown: {
            nutritionalQuality: 0,
            additivesImpact: 0,
            organicBonus: 0
          },
          additives: [],
          improvements: ['Unable to calculate nutrition score']
        };
      }
    });
  }
}

export const nutritionScoringService = new NutritionScoringService();