import axios from 'axios';
import { Product, ProductPrice } from '../data/mockProducts';
import { staticMockProducts } from '../data/staticMockData';

// Base URL for the pharmaceutical products API
const API_BASE_URL = 'https://api.pharmaceutical-database.io/v1';

// Sixstep Core API Configuration
const SIXSTEP_CORE_URL = process.env.REACT_APP_SIXSTEP_CORE_URL || 'https://sixstep-be-uq52c.ondigitalocean.app';

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

// Create Sixstep Core axios instance
const sixstepClient = axios.create({
  baseURL: SIXSTEP_CORE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add session token dynamically
sixstepClient.interceptors.request.use(
  (config) => {
    const sessionToken = localStorage.getItem('sixstep_token');
    if (sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
sixstepClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('sixstep_token');
      localStorage.removeItem('sixstep_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  role: string; // 'admin' or 'user' from backend
  entityType: string;
  entityName: string;
  referralName: string;
  referralContacts: string;
  username: string;
  crmId?: string;
  notes?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
  message: string;
}

export interface Entity {
  id: string;
  entityType: 'PHARMA' | 'LANDLORD' | 'TENANT' | 'ADMIN' | 'PHARMACY' | 'SUPPLIER';
  entityName: string;
  country?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  referralName?: string;
  referralContacts?: string;
  username?: string;
  crmId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEntityData {
  entityType: 'PHARMA' | 'LANDLORD' | 'TENANT' | 'ADMIN' | 'PHARMACY' | 'SUPPLIER';
  entityName: string;
  country: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CreateUserData {
  name: string;
  surname: string;
  role: 'admin' | 'user';
  email: string;
  entity: string; // Entity ID
  password: string;
  secret?: string; // Required only for admin creation
}

export interface UserResponse {
  id: string;
  name: string;
  surname: string;
  role: string;
  email: string;
  entity: string;
  createdAt?: string;
  updatedAt?: string;
}

// SIXSTEP CORE API FUNCTIONS

// Login function
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    console.log(`Attempting login to ${SIXSTEP_CORE_URL}/users/login`);
    const response = await sixstepClient.post('/users/login', credentials);
    
    // Debug: log the actual response structure
    console.log('Login API Response:', response.data);
    
    // Check for successful login (error: false means success)
    if (response.data.error === false && response.data.session) {
      // Store session token and refresh token
      localStorage.setItem('sixstep_token', response.data.session);
      localStorage.setItem('sixstep_refresh_token', response.data.refreshToken);
      
      // Create user object from available data (using nested user object)
      const userData = response.data.user || {};
      const user: AuthUser = {
        id: userData.id || response.data.userId || 'unknown',
        role: userData.type || 'user', // Backend uses 'type' field inside user object: 'admin' or 'user'
        entityType: userData.entityType || response.data.entityType || 'ADMIN',
        entityName: userData.entityName || response.data.entityName || 'Unknown Entity',
        referralName: userData.name + ' ' + userData.surname || 'Admin User',
        referralContacts: userData.email || credentials.email,
        username: userData.email || credentials.email,
        crmId: userData.crmId || response.data.crmId || '',
        notes: userData.notes || response.data.notes || ''
      };
      
      localStorage.setItem('sixstep_user', JSON.stringify(user));
      
      // Return a compatible response structure
      return {
        success: true,
        token: response.data.session,
        user: user,
        message: response.data.message || 'Login successful'
      };
    }
    
    throw new Error(response.data.message || 'Login failed');
  } catch (error: any) {
    console.error('Login API error:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Network error during login'
    );
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint if available (might be /users/logout or similar)
    await sixstepClient.post('/users/logout');
  } catch (error) {
    console.warn('Logout endpoint error:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem('sixstep_token');
    localStorage.removeItem('sixstep_refresh_token');
    localStorage.removeItem('sixstep_user');
  }
};

// Get all entities
export const getAllEntities = async (): Promise<Entity[]> => {
  try {
    const response = await sixstepClient.get('/entities/get/all');
    console.log('Raw API response:', response.data);
    
    // Extract entities from the response structure
    if (response.data && response.data.entities && Array.isArray(response.data.entities)) {
      const entities = response.data.entities.map((item: any) => ({
        id: item.entity._id, // Map _id to id
        entityType: item.entity.entityType,
        entityName: item.entity.entityName,
        country: item.entity.country || 'Unknown',
        notes: item.entity.notes || '',
        status: item.entity.status || 'ACTIVE',
        referralName: item.entity.referralName || '',
        referralContacts: item.entity.referralContacts || '',
        username: item.entity.username || '',
        crmId: item.entity.crmId || '',
        createdAt: item.entity.createdAt || new Date(item.entity.lastUpdated).toISOString(),
        updatedAt: item.entity.updatedAt || new Date(item.entity.lastUpdated).toISOString()
      }));
      
      console.log('Processed entities:', entities);
      return entities;
    }
    
    console.warn('No entities found in response');
    return [];
  } catch (error: any) {
    console.error('Get all entities error:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch entities'
    );
  }
};

// Get single entity
export const getEntity = async (entityId: string): Promise<Entity> => {
  try {
    const response = await sixstepClient.get(`/entities/get/${entityId}`);
    return response.data;
  } catch (error: any) {
    console.error('Get entity error:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch entity'
    );
  }
};

// Update entity
export const updateEntity = async (entityData: Partial<Entity> & { entityId: string }): Promise<Entity> => {
  try {
    const response = await sixstepClient.post('/entities/update', entityData);
    return response.data;
  } catch (error: any) {
    console.error('Update entity error:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to update entity'
    );
  }
};

// Create new entity
export const createEntity = async (entityData: CreateEntityData): Promise<Entity> => {
  try {
    console.log('Creating entity with data:', entityData);
    const response = await sixstepClient.post('/entities/create', entityData);
    console.log('Raw Create Entity API response:', response.data);
    
    // Handle different response structures
    if (response.data) {
      // If response has entity wrapped (like other APIs)
      if (response.data.entity) {
        console.log('Entity found in wrapped structure:', response.data.entity);
        const entity = {
          id: response.data.entity._id || response.data.entity.id,
          entityType: response.data.entity.entityType,
          entityName: response.data.entity.entityName,
          country: response.data.entity.country || 'Unknown',
          notes: response.data.entity.notes || '',
          status: response.data.entity.status || 'ACTIVE',
          referralName: response.data.entity.referralName || '',
          referralContacts: response.data.entity.referralContacts || '',
          username: response.data.entity.username || '',
          crmId: response.data.entity.crmId || '',
          createdAt: response.data.entity.createdAt || new Date().toISOString(),
          updatedAt: response.data.entity.updatedAt || new Date().toISOString()
        };
        console.log('Processed created entity:', entity);
        return entity;
      }
      
      // If response is direct entity object
      if (response.data._id || response.data.id) {
        console.log('Entity found as direct object:', response.data);
        const entity = {
          id: response.data._id || response.data.id,
          entityType: response.data.entityType,
          entityName: response.data.entityName,
          country: response.data.country || 'Unknown',
          notes: response.data.notes || '',
          status: response.data.status || 'ACTIVE',
          referralName: response.data.referralName || '',
          referralContacts: response.data.referralContacts || '',
          username: response.data.username || '',
          crmId: response.data.crmId || '',
          createdAt: response.data.createdAt || new Date().toISOString(),
          updatedAt: response.data.updatedAt || new Date().toISOString()
        };
        console.log('Processed created entity:', entity);
        return entity;
      }
    }
    
    console.error('Unexpected create entity response structure:', response.data);
    throw new Error('Invalid response structure from create entity API');
  } catch (error: any) {
    console.error('Create entity error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to create entity'
    );
  }
};

// Search all users using POST /users/search
export const getAllUsers = async (): Promise<UserResponse[]> => {
  try {
    // Empty payload to get all users (no entity filter)
    const searchPayload = {};
    
    console.log('Searching users with payload:', searchPayload);
    const response = await sixstepClient.post('/users/search', searchPayload);
    console.log('Raw Users Search API response:', response.data);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Check if response has users data
    if (response.data) {
      // If it's a direct array
      if (Array.isArray(response.data)) {
        console.log('Users response is direct array:', response.data.length, 'users');
        return response.data.map((user: any) => ({
          id: user.id || user._id,
          name: user.name,
          surname: user.surname,
          role: user.role || user.type,
          email: user.email,
          entity: user.entity,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }));
      }
      
      // If it's nested (e.g., response.data.users)
      if (response.data.users && Array.isArray(response.data.users)) {
        console.log('Users found in nested structure:', response.data.users.length, 'users');
        const users = response.data.users.map((item: any) => ({
          id: item._id || item.id,
          name: item.name,
          surname: item.surname,
          email: item.email,
          role: item.role || item.type,
          entity: item.entity || 'Unknown'
        }));
        return users;
      }
      
      // If it's nested as results (common in search endpoints)
      if (response.data.results && Array.isArray(response.data.results)) {
        console.log('Users found in results:', response.data.results.length, 'users');
        const users = response.data.results.map((item: any) => ({
          id: item._id || item.id,
          name: item.name,
          surname: item.surname,
          email: item.email,
          role: item.role || item.type,
          entity: item.entity || 'Unknown'
        }));
        return users;
      }
      
      // If it's a single user object
      if (response.data.user) {
        console.log('Single user found, converting to array:', response.data.user);
        const user = {
          id: response.data.user.id,
          name: response.data.user.name,
          surname: response.data.user.surname,
          email: response.data.user.email,
          role: response.data.user.type || response.data.user.role,
          entity: response.data.user.entity || 'Unknown'
        };
        return [user]; // Return as array with single user
      }
      
      // If the response looks like search result with no matches
      if (response.data.message && response.data.error === false) {
        console.log('Search successful but no users found');
        return [];
      }
    }
    
    console.warn('Unexpected search response structure:', response.data);
    return [];
  } catch (error: any) {
    console.error('Search users error:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data);
    
    // If 404, the endpoint might not exist
    if (error.response?.status === 404) {
      console.warn('Users search endpoint not found - API might not have this endpoint yet');
      return []; // Return empty array instead of throwing
    }
    
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to search users'
    );
  }
};

// Create new user (admin or regular user)
export const createUser = async (userData: CreateUserData): Promise<UserResponse> => {
  try {
    console.log('Creating user with data:', userData);
    const response = await sixstepClient.post('/users/create', userData);
    console.log('Raw Create User API response:', response.data);
    console.log('Response status:', response.status);
    
    // Handle different response structures
    if (response.data) {
      // If response has user wrapped
      if (response.data.user) {
        console.log('User found in wrapped structure:', response.data.user);
        const user = {
          id: response.data.user._id || response.data.user.id,
          name: response.data.user.name,
          surname: response.data.user.surname,
          email: response.data.user.email,
          role: response.data.user.role || response.data.user.type,
          entity: response.data.user.entity,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.updatedAt
        };
        console.log('Processed created user:', user);
        return user;
      }
      
      // If response is direct user object
      if (response.data.id || response.data._id) {
        console.log('User found as direct object:', response.data);
        const user = {
          id: response.data._id || response.data.id,
          name: response.data.name,
          surname: response.data.surname,
          email: response.data.email,
          role: response.data.role || response.data.type,
          entity: response.data.entity,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt
        };
        console.log('Processed created user:', user);
        return user;
      }
      
      // If it's a success message with user data  
      if (response.data.message && !response.data.error) {
        console.log('Success response with message:', response.data.message);
        return response.data; // Return as-is for now
      }
    }
    
    console.error('Unexpected create user response structure:', response.data);
    return response.data; // Fallback to raw response
  } catch (error: any) {
    console.error('Create user error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to create user'
    );
  }
};

// Edit existing user
export interface EditUserData {
  userId: string;
  name: string;
  surname: string;
  role: string;
  email: string;
  password?: string; // Optional for edit
  entity: string;
}

export const editUser = async (userData: EditUserData): Promise<void> => {
  try {
    console.log('Editing user with data:', userData);
    const response = await sixstepClient.post('/users/edit', userData);
    console.log('Edit User API response:', response.data);
    console.log('Response status:', response.status);
    
    // API returns no response body on success
    return;
  } catch (error: any) {
    console.error('Edit user error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to edit user'
    );
  }
};

// Delete user
export interface DeleteUserData {
  userId: string;
}

export const deleteUserById = async (userData: DeleteUserData): Promise<void> => {
  try {
    console.log('Deleting user with ID:', userData.userId);
    const response = await sixstepClient.post('/users/delete', userData);
    console.log('Delete User API response:', response.data);
    console.log('Response status:', response.status);
    
    // API returns no response body on success
    return;
  } catch (error: any) {
    console.error('Delete user error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to delete user'
    );
  }
};

// Delete entity
export const deleteEntity = async (entityId: string): Promise<void> => {
  try {
    await sixstepClient.delete(`/entities/delete/${entityId}`);
  } catch (error: any) {
    console.error('Delete entity error:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to delete entity'
    );
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('sixstep_token');
  const user = localStorage.getItem('sixstep_user');
  return !!(token && user);
};

// Get current user from localStorage
export const getCurrentUser = (): AuthUser | null => {
  try {
    const userStr = localStorage.getItem('sixstep_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('sixstep_user');
    return null;
  }
};

// Verify token validity
export const verifyToken = async (): Promise<boolean> => {
  try {
    await sixstepClient.get('/auth/verify');
    return true;
  } catch (error) {
    return false;
  }
}; 