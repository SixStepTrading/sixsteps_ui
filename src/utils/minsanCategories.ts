// MINSAN Category mapping based on first digit of MINSAN code
export interface MinsanCategory {
  code: string;
  name: string;
  description: string;
}

// Available MINSAN categories based on first digit
export const MINSAN_CATEGORIES: MinsanCategory[] = [
  {
    code: '0',
    name: 'Human Use Medicines',
    description: 'Medicines intended for human use'
  },
  {
    code: '1',
    name: 'Veterinary Medicines',
    description: 'Medicines intended for veterinary use'
  },
  {
    code: '8',
    name: 'Homeopathic / Natural Products',
    description: 'Homeopathic and natural products'
  },
  {
    code: '9',
    name: 'Parapharmaceuticals',
    description: 'Supplements, vitamins, cosmetics, devices, etc.'
  }
];

/**
 * Determines the category of a product based on its MINSAN code
 * @param minsan - The MINSAN code of the product
 * @returns The category name or 'Other' if not recognized
 */
export const getCategoryFromMinsan = (minsan: string): string => {
  if (!minsan || minsan.length === 0) {
    return 'Other';
  }

  const firstDigit = minsan.charAt(0);
  const category = MINSAN_CATEGORIES.find(cat => cat.code === firstDigit);
  
  return category ? category.name : 'Other';
};

/**
 * Gets all available categories from a list of products based on their MINSAN codes
 * @param products - Array of products with minsan property
 * @returns Array of unique category names found in the products
 */
export const getAvailableCategoriesFromProducts = (products: Array<{ minsan: string }>): string[] => {
  const categoriesSet = new Set<string>();
  
  products.forEach(product => {
    const category = getCategoryFromMinsan(product.minsan);
    categoriesSet.add(category);
  });
  
  return Array.from(categoriesSet).sort();
};

/**
 * Gets the category description for a given category name
 * @param categoryName - The name of the category
 * @returns The description of the category or empty string if not found
 */
export const getCategoryDescription = (categoryName: string): string => {
  const category = MINSAN_CATEGORIES.find(cat => cat.name === categoryName);
  return category ? category.description : '';
};

/**
 * Gets the MINSAN digit code for a given category name
 * @param categoryName - The name of the category
 * @returns The digit code (0, 1, 8, 9) or null if not found
 */
export const getDigitFromCategoryName = (categoryName: string): string | null => {
  const category = MINSAN_CATEGORIES.find(cat => cat.name === categoryName);
  return category ? category.code : null;
};
