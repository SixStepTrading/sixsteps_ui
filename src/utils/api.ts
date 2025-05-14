import axios from 'axios';
import { Product, ProductPrice } from '../data/mockProducts';
import { staticMockProducts } from '../data/staticMockData';

// Base URL for the pharmaceutical products API
const API_BASE_URL = 'https://api.pharmaceutical-database.io/v1';

// API key for authentication
const API_KEY = process.env.REACT_APP_PHARMA_API_KEY || '';

// Create axios instance with common configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Function to fetch pharmaceutical products with pagination and filtering
export const fetchProducts = async (
  page: number = 1,
  limit: number = 50,
  filters: {
    searchTerm?: string;
    category?: string;
    manufacturer?: string;
    inStockOnly?: boolean;
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<{ 
  products: Product[], 
  totalCount: number, 
  categories: string[], 
  manufacturers: string[] 
}> => {
  try {
    // Build query parameters
    const params: Record<string, any> = {
      page,
      limit,
      ...filters.searchTerm && { search: filters.searchTerm },
      ...filters.category && { category: filters.category },
      ...filters.manufacturer && { manufacturer: filters.manufacturer },
      ...filters.inStockOnly && { inStock: true },
      ...filters.minPrice !== undefined && { minPrice: filters.minPrice },
      ...filters.maxPrice !== undefined && { maxPrice: filters.maxPrice }
    };

    const response = await apiClient.get('/products', { params });
    
    // Transform the API response to match our Product interface
    const products: Product[] = response.data.products.map((item: any) => {
      // Transform supplier prices to match our ProductPrice interface
      const bestPrices: ProductPrice[] = item.suppliers.map((supplier: any) => ({
        supplier: supplier.name,
        price: supplier.price,
        stock: supplier.stockQuantity
      })).sort((a: ProductPrice, b: ProductPrice) => a.price - b.price);

      return {
        id: item.id.toString(),
        ean: item.ean,
        minsan: item.minsan || '', // Handle the Minsan field from API
        name: item.name,
        description: item.description,
        manufacturer: item.manufacturer,
        category: item.category,
        publicPrice: item.publicPrice,
        vat: item.vatRate,
        bestPrices,
        inStock: bestPrices.some(price => price.stock > 0)
      };
    });

    return {
      products,
      totalCount: response.data.totalCount,
      categories: response.data.categories || [],
      manufacturers: response.data.manufacturers || []
    };
  } catch (error) {
    console.error('Error fetching pharmaceutical products:', error);
    throw error;
  }
};

// Fallback function to use mock data when API is not available
export const getFallbackProducts = async (): Promise<{ 
  products: Product[], 
  totalCount: number, 
  categories: string[], 
  manufacturers: string[] 
}> => {
  // Use the static mock products directly
  console.log(`Using ${staticMockProducts.length} static mock products`);
  
  // Extract unique categories and manufacturers
  const categories = Array.from(new Set(staticMockProducts.map(p => p.category))).sort();
  const manufacturers = Array.from(new Set(staticMockProducts.map(p => p.manufacturer))).sort();
  
  return {
    products: staticMockProducts,
    totalCount: staticMockProducts.length,
    categories,
    manufacturers
  };
}; 