import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const additivesSeedData = [
  // GREEN - Safe additives (0 point deduction)
  {
    eNumber: 'E300',
    name: 'Ascorbic acid (Vitamin C)',
    riskLevel: 'green',
    description: 'Natural antioxidant, vitamin C',
    pointDeduction: 0,
    healthImpacts: ['Antioxidant properties', 'Essential vitamin']
  },
  {
    eNumber: 'E301',
    name: 'Sodium ascorbate',
    riskLevel: 'green',
    description: 'Sodium salt of vitamin C, antioxidant',
    pointDeduction: 0,
    healthImpacts: ['Antioxidant properties']
  },
  {
    eNumber: 'E306',
    name: 'Tocopherols (Vitamin E)',
    riskLevel: 'green',
    description: 'Natural antioxidant, vitamin E',
    pointDeduction: 0,
    healthImpacts: ['Antioxidant properties', 'Essential vitamin']
  },
  {
    eNumber: 'E330',
    name: 'Citric acid',
    riskLevel: 'green',
    description: 'Natural acid found in citrus fruits',
    pointDeduction: 0,
    healthImpacts: ['Natural preservative']
  },
  {
    eNumber: 'E440',
    name: 'Pectin',
    riskLevel: 'green',
    description: 'Natural fiber found in fruits',
    pointDeduction: 0,
    healthImpacts: ['Natural thickener', 'Dietary fiber']
  },
  {
    eNumber: 'E415',
    name: 'Xanthan gum',
    riskLevel: 'green',
    description: 'Natural thickener produced by fermentation',
    pointDeduction: 0,
    healthImpacts: ['Natural thickener']
  },
  {
    eNumber: 'E410',
    name: 'Locust bean gum',
    riskLevel: 'green',
    description: 'Natural thickener from carob seeds',
    pointDeduction: 0,
    healthImpacts: ['Natural thickener', 'Dietary fiber']
  },

  // YELLOW - Acceptable with limitations (5 point deduction)
  {
    eNumber: 'E322',
    name: 'Lecithin',
    riskLevel: 'yellow',
    description: 'Emulsifier, usually from soy or sunflower',
    pointDeduction: 5,
    healthImpacts: ['Generally safe', 'May cause allergic reactions in sensitive individuals']
  },
  {
    eNumber: 'E202',
    name: 'Potassium sorbate',
    riskLevel: 'yellow',
    description: 'Preservative, antimicrobial agent',
    pointDeduction: 5,
    healthImpacts: ['Effective preservative', 'May cause skin irritation in large amounts']
  },
  {
    eNumber: 'E211',
    name: 'Sodium benzoate',
    riskLevel: 'yellow',
    description: 'Preservative, antimicrobial agent',
    pointDeduction: 5,
    healthImpacts: ['Effective preservative', 'May form benzene when combined with vitamin C']
  },
  {
    eNumber: 'E407',
    name: 'Carrageenan',
    riskLevel: 'yellow',
    description: 'Thickener extracted from seaweed',
    pointDeduction: 5,
    healthImpacts: ['May cause digestive issues', 'Inflammatory potential in processed form']
  },
  {
    eNumber: 'E412',
    name: 'Guar gum',
    riskLevel: 'yellow',
    description: 'Natural thickener from guar beans',
    pointDeduction: 5,
    healthImpacts: ['May cause digestive upset in large quantities', 'Generally recognized as safe']
  },
  {
    eNumber: 'E414',
    name: 'Acacia gum (Gum arabic)',
    riskLevel: 'yellow',
    description: 'Natural thickener from acacia trees',
    pointDeduction: 5,
    healthImpacts: ['Generally safe', 'May cause allergic reactions']
  },

  // ORANGE - Avoid when possible (10 point deduction)
  {
    eNumber: 'E249',
    name: 'Potassium nitrite',
    riskLevel: 'orange',
    description: 'Preservative used in processed meats',
    pointDeduction: 10,
    healthImpacts: ['May form nitrosamines (carcinogenic)', 'Linked to cancer risk']
  },
  {
    eNumber: 'E250',
    name: 'Sodium nitrite',
    riskLevel: 'orange',
    description: 'Preservative used in processed meats',
    pointDeduction: 10,
    healthImpacts: ['May form nitrosamines (carcinogenic)', 'Linked to cancer risk']
  },
  {
    eNumber: 'E621',
    name: 'Monosodium glutamate (MSG)',
    riskLevel: 'orange',
    description: 'Flavor enhancer',
    pointDeduction: 10,
    healthImpacts: ['May cause headaches', 'Chinese Restaurant Syndrome', 'Neurotoxicity concerns']
  },
  {
    eNumber: 'E150d',
    name: 'Caramel IV (ammonia sulfite)',
    riskLevel: 'orange',
    description: 'Artificial coloring agent',
    pointDeduction: 10,
    healthImpacts: ['Contains 4-methylimidazole (potentially carcinogenic)', 'Artificial coloring']
  },
  {
    eNumber: 'E319',
    name: 'TBHQ (tert-Butylhydroquinone)',
    riskLevel: 'orange',
    description: 'Synthetic antioxidant',
    pointDeduction: 10,
    healthImpacts: ['May cause DNA damage', 'Potential endocrine disruption']
  },
  {
    eNumber: 'E320',
    name: 'BHA (Butylated hydroxyanisole)',
    riskLevel: 'orange',
    description: 'Synthetic antioxidant',
    pointDeduction: 10,
    healthImpacts: ['Possible carcinogen', 'Endocrine disruption']
  },
  {
    eNumber: 'E321',
    name: 'BHT (Butylated hydroxytoluene)',
    riskLevel: 'orange',
    description: 'Synthetic antioxidant',
    pointDeduction: 10,
    healthImpacts: ['Possible carcinogen', 'May cause hyperactivity']
  },

  // RED - Avoid completely (20 point deduction)
  {
    eNumber: 'E102',
    name: 'Tartrazine (Yellow 5)',
    riskLevel: 'red',
    description: 'Artificial yellow coloring',
    pointDeduction: 20,
    healthImpacts: ['Hyperactivity in children', 'Allergic reactions', 'Asthma triggers']
  },
  {
    eNumber: 'E110',
    name: 'Sunset Yellow (Yellow 6)',
    riskLevel: 'red',
    description: 'Artificial orange/yellow coloring',
    pointDeduction: 20,
    healthImpacts: ['Hyperactivity in children', 'Potential carcinogen', 'Allergic reactions']
  },
  {
    eNumber: 'E129',
    name: 'Allura Red (Red 40)',
    riskLevel: 'red',
    description: 'Artificial red coloring',
    pointDeduction: 20,
    healthImpacts: ['Hyperactivity in children', 'Potential carcinogen', 'Allergic reactions']
  },
  {
    eNumber: 'E133',
    name: 'Brilliant Blue (Blue 1)',
    riskLevel: 'red',
    description: 'Artificial blue coloring',
    pointDeduction: 20,
    healthImpacts: ['Hyperactivity in children', 'Potential neurotoxicity', 'Chromosomal damage']
  },
  {
    eNumber: 'E951',
    name: 'Aspartame',
    riskLevel: 'red',
    description: 'Artificial sweetener',
    pointDeduction: 20,
    healthImpacts: ['Potential neurotoxicity', 'Linked to headaches', 'May cause mood disorders']
  },
  {
    eNumber: 'E954',
    name: 'Saccharin',
    riskLevel: 'red',
    description: 'Artificial sweetener',
    pointDeduction: 20,
    healthImpacts: ['Potential carcinogen', 'Bladder cancer link in studies']
  },
  {
    eNumber: 'E952',
    name: 'Cyclamate',
    riskLevel: 'red',
    description: 'Artificial sweetener',
    pointDeduction: 20,
    healthImpacts: ['Banned in US', 'Potential carcinogen', 'Birth defects risk']
  },

  // Common additives without E-numbers
  {
    eNumber: null,
    name: 'High fructose corn syrup',
    riskLevel: 'red',
    description: 'Processed sweetener from corn',
    pointDeduction: 20,
    healthImpacts: ['Obesity risk', 'Diabetes risk', 'Metabolic syndrome', 'Liver damage']
  },
  {
    eNumber: null,
    name: 'Partially hydrogenated oils',
    riskLevel: 'red',
    description: 'Trans fats',
    pointDeduction: 20,
    healthImpacts: ['Heart disease', 'Increased LDL cholesterol', 'Banned in many countries']
  },
  {
    eNumber: null,
    name: 'Artificial flavor',
    riskLevel: 'orange',
    description: 'Generic artificial flavoring',
    pointDeduction: 10,
    healthImpacts: ['Unknown chemical compounds', 'Potential allergens']
  },
  {
    eNumber: null,
    name: 'Natural flavor',
    riskLevel: 'yellow',
    description: 'Natural flavoring compounds',
    pointDeduction: 5,
    healthImpacts: ['Generally safe', 'May contain allergens']
  },
  {
    eNumber: null,
    name: 'Sodium phosphates',
    riskLevel: 'orange',
    description: 'Preservative and emulsifier',
    pointDeduction: 10,
    healthImpacts: ['Kidney damage risk', 'Bone health concerns', 'Cardiovascular issues']
  },
  {
    eNumber: 'E338',
    name: 'Phosphoric acid',
    riskLevel: 'orange',
    description: 'Acidifier, common in sodas',
    pointDeduction: 10,
    healthImpacts: ['Bone density loss', 'Tooth enamel erosion', 'Kidney problems']
  },

  // Additional preservatives
  {
    eNumber: 'E200',
    name: 'Sorbic acid',
    riskLevel: 'yellow',
    description: 'Natural antimicrobial preservative',
    pointDeduction: 5,
    healthImpacts: ['Generally safe', 'May cause skin irritation']
  },
  {
    eNumber: 'E203',
    name: 'Calcium sorbate',
    riskLevel: 'yellow',
    description: 'Calcium salt of sorbic acid',
    pointDeduction: 5,
    healthImpacts: ['Generally safe', 'Effective antimicrobial']
  },
  {
    eNumber: 'E210',
    name: 'Benzoic acid',
    riskLevel: 'yellow',
    description: 'Natural preservative',
    pointDeduction: 5,
    healthImpacts: ['May cause allergic reactions', 'ADHD link in some studies']
  },

  // Colorings
  {
    eNumber: 'E100',
    name: 'Curcumin',
    riskLevel: 'green',
    description: 'Natural yellow coloring from turmeric',
    pointDeduction: 0,
    healthImpacts: ['Anti-inflammatory properties', 'Natural antioxidant']
  },
  {
    eNumber: 'E160a',
    name: 'Beta-carotene',
    riskLevel: 'green',
    description: 'Natural orange coloring, vitamin A precursor',
    pointDeduction: 0,
    healthImpacts: ['Vitamin A precursor', 'Antioxidant properties']
  },
  {
    eNumber: 'E163',
    name: 'Anthocyanins',
    riskLevel: 'green',
    description: 'Natural purple/red coloring from fruits',
    pointDeduction: 0,
    healthImpacts: ['Antioxidant properties', 'Anti-inflammatory']
  }
];

export async function seedAdditives() {
  console.log('Seeding additives database...');
  
  try {
    // Delete existing additives
    await prisma.additive.deleteMany();
    
    // Insert new additives
    const result = await prisma.additive.createMany({
      data: additivesSeedData,
      skipDuplicates: true
    });
    
    console.log(`✅ Successfully seeded ${result.count} additives`);
    
    // Log summary by risk level
    const summary = await prisma.additive.groupBy({
      by: ['riskLevel'],
      _count: true
    });
    
    console.log('Additives by risk level:');
    summary.forEach(item => {
      console.log(`  ${item.riskLevel}: ${item._count} additives`);
    });
    
  } catch (error) {
    console.error('Error seeding additives:', error);
    throw error;
  }
}

if (require.main === module) {
  seedAdditives()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}