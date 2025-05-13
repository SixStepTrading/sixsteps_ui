import { v4 as uuidv4 } from 'uuid';

export interface ProductPrice {
  supplier: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  ean: string;
  minsan: string;
  name: string;
  description: string;
  manufacturer: string;
  category: string;
  publicPrice: number;
  vat: number;
  bestPrices: ProductPrice[];
  inStock: boolean;
}

// Helper function to generate random EAN-13
const generateEAN = (): string => {
  let ean = '80';
  for (let i = 0; i < 10; i++) {
    ean += Math.floor(Math.random() * 10);
  }
  return ean;
};

// Helper function to generate random Minsan code
const generateMinsan = (): string => {
  // Format: Typically a 9-digit number starting with specific digits for pharmaceuticals
  let minsan = '0';
  for (let i = 0; i < 8; i++) {
    minsan += Math.floor(Math.random() * 10);
  }
  return minsan;
};

// Helper function to get random element from array
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Categories
const categories = [
  'Analgesics',
  'Antibiotics',
  'Antivirals',
  'Vitamins',
  'Supplements',
  'Dermatological',
  'Gastrointestinal',
  'Cardiovascular',
  'Respiratory',
  'Eye care',
  'Dental care',
  'First aid',
  'Hygiene products',
  'Baby care',
  'Orthopedic',
  'Diabetes management'
];

// Manufacturers
const manufacturers = [
  'Garasshi',
  'Bayer',
  'Sandoz',
  'Pfizer',
  'Novartis',
  'GSK',
  'Roche',
  'Sanofi',
  'Merck',
  'AstraZeneca',
  'Johnson & Johnson',
  'Teva',
  'Gilead',
  'Abbott',
  'Amgen'
];

// Suppliers
const suppliers = [
  'MedSupply',
  'PharmaWholesale',
  'HealthStock',
  'MediDelivery',
  'PharmaDirect',
  'GlobalMeds',
  'EuroDrug',
  'FastPharma',
  'MedExpress',
  'PharmaPrime'
];

// Product name prefixes by category
const productNamesByCat: Record<string, string[]> = {
  'Analgesics': ['Paracetamol', 'Ibuprofen', 'Aspirin', 'Naproxen', 'Diclofenac', 'Ketorolac', 'Tramadol'],
  'Antibiotics': ['Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Doxycycline', 'Cephalexin', 'Clarithromycin'],
  'Antivirals': ['Acyclovir', 'Oseltamivir', 'Valacyclovir', 'Ribavirin', 'Zanamivir'],
  'Vitamins': ['Vitamin C', 'Vitamin D3', 'Vitamin B12', 'Multivitamin', 'Folic Acid', 'Biotin', 'Vitamin E'],
  'Supplements': ['Omega 3', 'Magnesium', 'Zinc', 'Iron', 'Calcium', 'Probiotics', 'CoQ10', 'Melatonin'],
  'Dermatological': ['Hydrocortisone', 'Benzoyl Peroxide', 'Tretinoin', 'Clotrimazole', 'Salicylic Acid'],
  'Gastrointestinal': ['Omeprazole', 'Loperamide', 'Simethicone', 'Bisacodyl', 'Lactase', 'Ranitidine'],
  'Cardiovascular': ['Amlodipine', 'Atenolol', 'Lisinopril', 'Simvastatin', 'Warfarin', 'Clopidogrel'],
  'Respiratory': ['Salbutamol', 'Fluticasone', 'Montelukast', 'Cetirizine', 'Loratadine', 'Diphenhydramine'],
  'Eye care': ['Artificial Tears', 'Olopatadine', 'Gentamicin Eye Drops', 'Hypromellose', 'Tobramycin'],
  'Dental care': ['Fluoride', 'Benzocaine', 'Chlorhexidine', 'Hydrogen Peroxide'],
  'First aid': ['Adhesive Bandage', 'Antiseptic', 'Burn Gel', 'Gauze Pad', 'Medical Tape'],
  'Hygiene products': ['Hand Sanitizer', 'Antiseptic Wipes', 'Surgical Masks', 'Latex Gloves', 'Disinfectant'],
  'Baby care': ['Baby Moisturizer', 'Diaper Rash Cream', 'Baby Shampoo', 'Baby Wipes'],
  'Orthopedic': ['Elastic Bandage', 'Cold Pack', 'Heat Patch', 'Joint Support', 'Posture Corrector'],
  'Diabetes management': ['Glucose Test Strips', 'Lancets', 'Insulin Syringes', 'Glucose Tablets']
};

// Dosages
const dosages = ['100mg', '200mg', '250mg', '400mg', '500mg', '1000mg', '5mg', '10mg', '20mg', '25mg', '50mg', '1g', '2g', '5ml', '10ml'];

// Formulations
const formulations = ['Tablets', 'Capsules', 'Syrup', 'Cream', 'Gel', 'Ointment', 'Solution', 'Suspension', 'Injection', 'Drops', 'Spray', 'Lozenges', 'Suppositories', 'Patch'];

// Helper function to generate product names
const generateProductName = (category: string): string => {
  const names = productNamesByCat[category] || ['Generic Product'];
  const name = getRandomElement(names);
  
  // For some categories, add dosage and formulation
  if (['Analgesics', 'Antibiotics', 'Antivirals', 'Vitamins', 'Supplements', 'Gastrointestinal', 'Cardiovascular', 'Respiratory'].includes(category)) {
    return `${name} ${getRandomElement(dosages)} ${getRandomElement(formulations)}`;
  }
  
  // For others, just add a generic descriptor
  return `${name} ${getRandomElement(formulations)}`;
};

// Generate 1000 products
export const generateMockProducts = (count: number = 1000): Product[] => {
  const products: Product[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = getRandomElement(categories);
    const manufacturer = getRandomElement(manufacturers);
    const publicPrice = +(Math.random() * 100 + 2).toFixed(2);
    const inStock = Math.random() > 0.1; // 90% of products are in stock
    
    // Generate between 3 and 10 supplier prices
    const numberOfPrices = Math.floor(Math.random() * 8) + 3;
    const bestPrices: ProductPrice[] = [];
    
    for (let j = 0; j < numberOfPrices; j++) {
      // Supplier prices are lower than public price
      const price = +(publicPrice * (0.3 + Math.random() * 0.5)).toFixed(2);
      const stock = Math.floor(Math.random() * 500) + 1;
      
      bestPrices.push({
        supplier: getRandomElement(suppliers),
        price,
        stock
      });
    }
    
    // Sort prices from lowest to highest
    bestPrices.sort((a, b) => a.price - b.price);
    
    products.push({
      id: uuidv4(),
      ean: generateEAN(),
      minsan: generateMinsan(),
      name: generateProductName(category),
      description: `${manufacturer} ${category.toLowerCase()} product for health and wellness.`,
      manufacturer,
      category,
      publicPrice,
      vat: category.includes('Baby') ? 4 : 22, // Different VAT rates
      bestPrices,
      inStock
    });
  }
  
  return products;
};

// Export 1000 mock products
export const mockProducts = generateMockProducts(1000); 