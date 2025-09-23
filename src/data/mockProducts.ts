import { v4 as uuidv4 } from 'uuid';

export interface ProductPrice {
  supplier: string;
  price: number;
  stock: number;
  suppliers?: string[]; // Array of original suppliers for consolidated prices
  originalPrices?: ProductPrice[]; // Array of original price objects for stock details
  warehouse?: string; // Warehouse name for this supply
  entityName?: string; // Entity name for this supply
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
  allPrices?: ProductPrice[]; // All original prices for filtering (before consolidation)
  inStock: boolean;
  image?: string;
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
  // Format: 9-digit number starting with specific digits for different categories
  // 0 = Human Use Medicines, 1 = Veterinary, 8 = Homeopathic, 9 = Parapharmaceuticals
  const firstDigits = ['0', '1', '8', '9'];
  let minsan = getRandomElement(firstDigits);
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

// Generate placeholder image URLs for products
const generatePlaceholderImage = (category: string): string => {
  // Using a more reliable placeholder image service with category-based images
  const categoryToImage: Record<string, string> = {
    'Analgesics': 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=150&h=150&fit=crop',
    'Antibiotics': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&h=150&fit=crop',
    'Antivirals': 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=150&h=150&fit=crop',
    'Vitamins': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=150&h=150&fit=crop',
    'Supplements': 'https://images.unsplash.com/photo-1622363902056-09b5cc941231?w=150&h=150&fit=crop',
    'Dermatological': 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=150&h=150&fit=crop',
    'Gastrointestinal': 'https://images.unsplash.com/photo-1578496479932-143476d3ca3d?w=150&h=150&fit=crop',
    'Cardiovascular': 'https://images.unsplash.com/photo-1559757175-7b21e7afae0d?w=150&h=150&fit=crop',
    'Respiratory': 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=150&h=150&fit=crop',
    'Eye care': 'https://images.unsplash.com/photo-1516714819001-8ee7a3380b1a?w=150&h=150&fit=crop',
    'Dental care': 'https://images.unsplash.com/photo-1571586100127-cdaef780fc61?w=150&h=150&fit=crop',
    'First aid': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&h=150&fit=crop',
    'Hygiene products': 'https://images.unsplash.com/photo-1605264964528-06416fe38727?w=150&h=150&fit=crop',
    'Baby care': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=150&h=150&fit=crop',
    'Orthopedic': 'https://images.unsplash.com/photo-1538883726308-e679382d32a2?w=150&h=150&fit=crop',
    'Diabetes management': 'https://images.unsplash.com/photo-1586015555917-809317b14d86?w=150&h=150&fit=crop'
  };
  
  // Use category-specific image or a default one
  return categoryToImage[category] || 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=150&h=150&fit=crop';
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
      inStock,
      image: generatePlaceholderImage(category)
    });
  }
  
  return products;
};

// Export 1000 mock products
export const mockProducts = generateMockProducts(1000); 