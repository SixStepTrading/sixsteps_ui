import axios from "axios";
import * as XLSX from "xlsx";
import { Product, ProductPrice } from "../data/mockProducts";

// Sixstep Core API Configuration
const SIXSTEP_CORE_URL =
  process.env.REACT_APP_SIXSTEP_CORE_URL ||
  "https://sixstep-be-uq52c.ondigitalocean.app";


// Create Sixstep Core axios instance
const sixstepClient = axios.create({
  baseURL: SIXSTEP_CORE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add session token dynamically
sixstepClient.interceptors.request.use(
  (config) => {
    const sessionToken = localStorage.getItem("sixstep_token");
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
      // Check if this is a permission-related 401 (not a token expiration)
      const url = error.config?.url || '';
      
      // For specific endpoints that might have permission restrictions,
      // don't automatically logout - let the component handle the error
      if (url.includes('/products/get') || url.includes('/entities/get') || url.includes('/entities/get/all')) {
        // This might be a permission issue, not token expiration
        // Let the component handle this gracefully
        return Promise.reject(error);
      }
      
      // For other endpoints (like auth endpoints), treat as token expiration
      localStorage.removeItem("sixstep_token");
      localStorage.removeItem("sixstep_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Function to consolidate prices with same value but different suppliers
const consolidatePrices = (prices: ProductPrice[]): ProductPrice[] => {
  const priceMap = new Map<number, {
    price: number;
    stock: number;
    suppliers: string[];
    originalPrices: ProductPrice[]; // Keep original price objects for stock details
  }>();

  // Group prices by price value
  prices.forEach(price => {
    const existing = priceMap.get(price.price);
    if (existing) {
      existing.stock += price.stock;
      existing.suppliers.push(price.supplier);
      existing.originalPrices.push(price);
    } else {
      priceMap.set(price.price, {
        price: price.price,
        stock: price.stock,
        suppliers: [price.supplier],
        originalPrices: [price]
      });
    }
  });

  // Convert back to ProductPrice array
  return Array.from(priceMap.values()).map(consolidated => ({
    price: consolidated.price,
    stock: consolidated.stock,
    supplier: consolidated.suppliers.join(', '), // For display purposes
    suppliers: consolidated.suppliers, // Keep original suppliers for detailed view
    originalPrices: consolidated.originalPrices, // Keep original price objects for stock details
    // For consolidated prices, we'll use the first price's warehouse/entity info as representative
    warehouse: consolidated.originalPrices[0]?.warehouse,
    entityName: consolidated.originalPrices[0]?.entityName
  }));
};

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
  } = {},
  isAdmin: boolean = false
): Promise<{
  products: Product[];
  totalCount: number;
  categories: string[];
  manufacturers: string[];
  suppliers: string[];
}> => {
  try {

    // Build payload for Sixstep Core API
    const payload: Record<string, any> = {
      page,
      limit,
      ...(filters.searchTerm && { search: filters.searchTerm }),
      ...(filters.category && { category: filters.category }),
      ...(filters.manufacturer && { manufacturer: filters.manufacturer }),
      ...(filters.inStockOnly && { inStock: true }),
      ...(filters.minPrice !== undefined && { minPrice: filters.minPrice }),
      ...(filters.maxPrice !== undefined && { maxPrice: filters.maxPrice }),
    };

    const response = await sixstepClient.post("/products/get", payload);


    // Check if response has the expected structure
    if (!response.data || !Array.isArray(response.data.products)) {
      throw new Error("Invalid API response structure");
    }

    // Get all entities to map entityId to supplier names (only for admin users)
    let entities: Entity[] = [];
    if (isAdmin) {
      try {
        entities = await getAllEntities();
      } catch (error: any) {
      }
    } else {
    }

    // Create entity lookup map
    const entityMap = new Map<string, string>();
    const entityWarehouseMap = new Map<string, { entityName: string; warehouses: string[] }>();
    entities.forEach(entity => {
      entityMap.set(entity.id, entity.entityName);
      entityWarehouseMap.set(entity.id, {
        entityName: entity.entityName,
        warehouses: entity.warehouses || []
      });
    });

    // Transform the API response to match our Product interface
    const products: Product[] = response.data.products.map((item: any) => {
      // Handle supplies/suppliers - check if they're integrated in the product
      let bestPrices: ProductPrice[] = [];

      if (item.supplies && Array.isArray(item.supplies)) {
        // New format with integrated supplies - use entityId to get supplier name and warehouse info
        bestPrices = item.supplies.map((supply: any) => {
          const entityInfo = entityWarehouseMap.get(supply.entityId);
          const entityName = entityInfo?.entityName || entityMap.get(supply.entityId) || supply.supplier || supply.supplierName || `Supplier ${supply.entityId}` || "Unknown Supplier";
          const warehouse = supply.warehouse || "Default Warehouse";
          
          return {
            supplier: entityName,
            price: supply.price || supply.publicPrice || 0,
            stock: supply.stock || supply.quantity || 0,
            warehouse: warehouse,
            entityName: entityName,
          };
        });
      } else if (item.suppliers && Array.isArray(item.suppliers)) {
        // Old format with separate suppliers
        bestPrices = item.suppliers.map((supplier: any) => ({
          supplier: supplier.name || supplier.supplier || "Unknown Supplier",
          price: supplier.price || supplier.publicPrice || 0,
          stock: supplier.stockQuantity || supplier.stock || 0,
          warehouse: supplier.warehouse || "Default Warehouse",
          entityName: supplier.name || supplier.supplier || "Unknown Supplier",
        }));
      } else {
        // No supply data, create default entry
        bestPrices = [
          {
            supplier: "Internal Stock",
            price: item.publicPrice || 0,
            stock: 0,
            warehouse: "Internal Warehouse",
            entityName: "Internal Stock",
          },
        ];
      }

      // Sort by price first
      bestPrices.sort((a: ProductPrice, b: ProductPrice) => a.price - b.price);
      
      // Consolidate prices with same value but different suppliers
      bestPrices = consolidatePrices(bestPrices);

      // Keep original prices for filtering (before consolidation)
      let allOriginalPrices: ProductPrice[] = [];
      if (item.supplies && Array.isArray(item.supplies)) {
        allOriginalPrices = item.supplies.map((supply: any) => {
          const entityInfo = entityWarehouseMap.get(supply.entityId);
          const entityName = entityInfo?.entityName || entityMap.get(supply.entityId) || supply.supplier || supply.supplierName || `Supplier ${supply.entityId}` || "Unknown Supplier";
          const warehouse = supply.warehouse || "Default Warehouse";
          
          return {
            supplier: entityName,
            price: supply.price || supply.publicPrice || 0,
            stock: supply.stock || supply.quantity || 0,
            warehouse: warehouse,
            entityName: entityName,
          };
        });
      } else if (item.suppliers && Array.isArray(item.suppliers)) {
        allOriginalPrices = item.suppliers.map((supplier: any) => ({
          supplier: supplier.name || supplier.supplier || "Unknown Supplier",
          price: supplier.price || supplier.publicPrice || 0,
          stock: supplier.stockQuantity || supplier.stock || 0,
          warehouse: supplier.warehouse || "Default Warehouse",
          entityName: supplier.name || supplier.supplier || "Unknown Supplier",
        }));
      }

      return {
        id: item.id?.toString() || item._id?.toString() || "",
        ean: item.ean || item.EAN || "",
        minsan: item.sku || item.minsan || item.MINSAN || "", // Use sku from backend for minsan
        name: item.name || item.productName || "Unknown Product",
        description: item.description || "",
        manufacturer: item.producer || item.manufacturer || "Unknown Manufacturer", // Use producer from backend
        category: item.category || "Uncategorized",
        publicPrice: item.publicPrice || item.price || 0,
        vat: item.publicVat || item.vatRate || item.vat || 22, // Use publicVat from backend
        bestPrices,
        allPrices: allOriginalPrices, // Add all original prices for filtering
        inStock: bestPrices.some((price) => price.stock > 0),
      };
    });

    // Extract unique suppliers from ALL original data (not just bestPrices)
    const allSuppliers = new Set<string>();
    
    // Extract suppliers from original API response data
    response.data.products.forEach((item: any) => {
      if (item.supplies && Array.isArray(item.supplies)) {
        // New format with integrated supplies
        item.supplies.forEach((supply: any) => {
          const entityInfo = entityWarehouseMap.get(supply.entityId);
          const entityName = entityInfo?.entityName || entityMap.get(supply.entityId) || supply.supplier || supply.supplierName || `Supplier ${supply.entityId}` || "Unknown Supplier";
          const warehouse = supply.warehouse || "Default Warehouse";
          
          // Create supplier name with warehouse info: "Entity Name | Warehouse Name"
          const supplierWithWarehouse = `${entityName} | ${warehouse}`;
          allSuppliers.add(supplierWithWarehouse);
        });
      } else if (item.suppliers && Array.isArray(item.suppliers)) {
        // Old format with separate suppliers
        item.suppliers.forEach((supplier: any) => {
          const entityName = supplier.name || supplier.supplier || "Unknown Supplier";
          const warehouse = supplier.warehouse || "Default Warehouse";
          
          // Create supplier name with warehouse info: "Entity Name | Warehouse Name"
          const supplierWithWarehouse = `${entityName} | ${warehouse}`;
          allSuppliers.add(supplierWithWarehouse);
        });
      }
    });


    // Extract unique values for filters
    const categories = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ).sort();
    const manufacturers = Array.from(
      new Set(products.map((p) => p.manufacturer).filter(Boolean))
    ).sort();

    const result = {
      products,
      totalCount: response.data.totalCount || products.length,
      categories,
      manufacturers,
      suppliers: Array.from(allSuppliers).sort(),
    };

    return result;
  } catch (error) {
    console.error("Error fetching pharmaceutical products:", error);
    throw error;
  }
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
  entityType:
    | "SUPPLIER"
    | "MANAGER"
    | "PHARMACY"
    | "ADMIN"
    | "company"; // Backend compatibility
  entityName: string;
  country?: string;
  notes?: string;
  status?: "ACTIVE" | "INACTIVE";
  referralName?: string;
  referralContacts?: string;
  username?: string;
  crmId?: string;
  warehouses?: string[]; // Array of warehouse names
  address?: string; // Entity address
  phone?: string; // Entity phone
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEntityData {
  entityType:
    | "SUPPLIER"
    | "MANAGER"
    | "PHARMACY"
    | "ADMIN";
  entityName: string;
  country: string;
  notes?: string;
  status: "ACTIVE" | "INACTIVE";
  address?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  warehouses?: string[]; // Array of warehouse names
}

export interface CreateUserData {
  name: string;
  surname: string;
  role: "admin" | "user";
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
export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const response = await sixstepClient.post("/users/login", credentials);

    // Debug: log the actual response structure

    // Check for successful login (error: false means success)
    if (response.data.error === false && response.data.session) {
      // Store session token and refresh token
      localStorage.setItem("sixstep_token", response.data.session);
      localStorage.setItem("sixstep_refresh_token", response.data.refreshToken);

      // Create user object from available data (using nested user object)
      const userData = response.data.user || {};
      const user: AuthUser = {
        id: userData.id || response.data.userId || "unknown",
        role: userData.type || "user", // Backend uses 'type' field inside user object: 'admin' or 'user'
        entityType: userData.entityType || response.data.entityType || "ADMIN",
        entityName:
          userData.entityName || response.data.entityName || "Unknown Entity",
        referralName: userData.name + " " + userData.surname || "Admin User",
        referralContacts: userData.email || credentials.email,
        username: userData.email || credentials.email,
        crmId: userData.crmId || response.data.crmId || "",
        notes: userData.notes || response.data.notes || "",
      };

      localStorage.setItem("sixstep_user", JSON.stringify(user));

      // Return a compatible response structure
      return {
        success: true,
        token: response.data.session,
        user: user,
        message: response.data.message || "Login successful",
      };
    }

    throw new Error(response.data.message || "Login failed");
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Network error during login"
    );
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint if available (might be /users/logout or similar)
    await sixstepClient.post("/users/logout");
  } catch (error) {
    console.error("Logout endpoint error:", error);
  } finally {
    // Always clear local storage
    localStorage.removeItem("sixstep_token");
    localStorage.removeItem("sixstep_refresh_token");
    localStorage.removeItem("sixstep_user");
  }
};

// Get all entities
export const getAllEntities = async (): Promise<Entity[]> => {
  try {
    const response = await sixstepClient.get("/entities/get/all");

    // Extract entities from the response structure
    if (
      response.data &&
      response.data.entities &&
      Array.isArray(response.data.entities)
    ) {
      const entities = response.data.entities.map((item: any) => ({
        id: item.entity._id, // Map _id to id
        entityType: item.entity.entityType,
        entityName: item.entity.entityName,
        country: item.entity.country || "Unknown",
        notes: item.entity.notes || "",
        status: item.entity.status || "ACTIVE",
        referralName: item.entity.referralName || "",
        referralContacts: item.entity.referralContacts || "",
        username: item.entity.username || "",
        crmId: item.entity.crmId || "",
        warehouses: item.entity.warehouses || [], // Map warehouses array
        address: item.entity.address || "", // Map address
        phone: item.entity.phone || "", // Map phone
        createdAt:
          item.entity.createdAt ||
          new Date(item.entity.lastUpdated).toISOString(),
        updatedAt:
          item.entity.updatedAt ||
          new Date(item.entity.lastUpdated).toISOString(),
      }));

      return entities;
    }

    return [];
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch entities"
    );
  }
};

// Get current user entity
export const getCurrentUserEntity = async (): Promise<Entity> => {
  try {
    const response = await sixstepClient.get("/users/get");
    
    
    if (response.data.error) {
      throw new Error(response.data.message || "Failed to fetch user entity");
    }
    
    // Map the response to our Entity interface
    const entity = {
      id: response.data.entity._id,
      entityType: response.data.entity.entityType,
      entityName: response.data.entity.entityName,
      country: response.data.entity.country || "Unknown",
      notes: response.data.entity.notes || "",
      status: response.data.entity.status || "ACTIVE",
      referralName: response.data.entity.referralName || "",
      referralContacts: response.data.entity.referralContacts || "",
      username: response.data.entity.username || "",
      crmId: response.data.entity.crmId || "",
      warehouses: response.data.entity.warehouses || [], // Map warehouses array
      address: response.data.entity.address || "", // Map address
      phone: response.data.entity.phone || "", // Map phone
      createdAt: response.data.entity.createdAt || new Date(response.data.entity.lastUpdated).toISOString(),
      updatedAt: response.data.entity.updatedAt || new Date(response.data.entity.lastUpdated).toISOString(),
    };
    
    return entity;
  } catch (error) {
    throw error;
  }
};

// Get single entity
export const getEntity = async (entityId: string): Promise<Entity> => {
  try {
    const response = await sixstepClient.get(`/entities/get/${entityId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to fetch entity"
    );
  }
};

// Update entity
export const updateEntity = async (
  entityData: Partial<Entity> & { entityId: string }
): Promise<Entity> => {
  try {
    const response = await sixstepClient.post("/entities/update", entityData);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to update entity"
    );
  }
};

// Create new entity
export const createEntity = async (
  entityData: CreateEntityData
): Promise<Entity> => {
  try {
    // Map frontend data to backend format
    const backendPayload = {
      entityName: entityData.entityName,
      entityType: "company", // Backend expects "company" instead of specific types
      country: entityData.country,
      address: entityData.address || "",
      vatNumber: entityData.vatNumber || "",
      email: entityData.email || "",
      phone: entityData.phone || "",
      warehouses: entityData.warehouses || [] // Include warehouses array
    };
    
    const response = await sixstepClient.post("/entities/create", backendPayload);

    // Handle different response structures
    if (response.data) {
      // If response has entity wrapped (like other APIs)
      if (response.data.entity) {
        const entity = {
          id: response.data.entity._id || response.data.entity.id,
          entityType: response.data.entity.entityType,
          entityName: response.data.entity.entityName,
          country: response.data.entity.country || "Unknown",
          notes: response.data.entity.notes || "",
          status: response.data.entity.status || "ACTIVE",
          referralName: response.data.entity.referralName || "",
          referralContacts: response.data.entity.referralContacts || "",
          username: response.data.entity.username || "",
          crmId: response.data.entity.crmId || "",
          createdAt: response.data.entity.createdAt || new Date().toISOString(),
          updatedAt: response.data.entity.updatedAt || new Date().toISOString(),
        };
        return entity;
      }

      // If response is direct entity object
      if (response.data._id || response.data.id) {
        const entity = {
          id: response.data._id || response.data.id,
          entityType: response.data.entityType,
          entityName: response.data.entityName,
          country: response.data.country || "Unknown",
          notes: response.data.notes || "",
          status: response.data.status || "ACTIVE",
          referralName: response.data.referralName || "",
          referralContacts: response.data.referralContacts || "",
          username: response.data.username || "",
          crmId: response.data.crmId || "",
          createdAt: response.data.createdAt || new Date().toISOString(),
          updatedAt: response.data.updatedAt || new Date().toISOString(),
        };
        return entity;
      }

      // If response is success message format (new API structure)
      if (response.data.message && response.data.error === false) {
        // Since the API only returns a success message, we need to fetch the entities
        // to get the newly created one. We'll return a temporary entity object
        // and let the UI refresh the entities list
        const tempEntity = {
          id: `temp-${Date.now()}`, // Temporary ID
          entityType: backendPayload.entityType as Entity['entityType'],
          entityName: backendPayload.entityName,
          country: backendPayload.country || "Unknown",
          notes: "",
          status: "ACTIVE" as const,
          referralName: "",
          referralContacts: "",
          username: "",
          crmId: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return tempEntity;
      }
    }

    // If we reach here, return a default entity
    return {
      id: "unknown",
      entityType: "company",
      entityName: entityData.entityName,
      country: entityData.country,
      notes: "",
      status: "ACTIVE",
      referralName: "",
      warehouses: entityData.warehouses || []
    };
  } catch (error: any) {
      console.error("Create entity error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        "Failed to create entity"
      );
    }
};

// Search all users using POST /users/search
export const getAllUsers = async (): Promise<UserResponse[]> => {
  try {
    // Empty payload to get all users (no entity filter)
    const searchPayload = {};

    const response = await sixstepClient.post("/users/search", searchPayload);

    // Check if response has users data
    if (response.data) {
      // If it's a direct array
      if (Array.isArray(response.data)) {
        return response.data.map((user: any) => ({
          id: user.id || user._id,
          name: user.name,
          surname: user.surname,
          role: user.role || user.type,
          email: user.email,
          entity: user.entity,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));
      }

      // If it's nested (e.g., response.data.users)
      if (response.data.users && Array.isArray(response.data.users)) {
        const users = response.data.users.map((item: any) => ({
          id: item._id || item.id,
          name: item.name,
          surname: item.surname,
          email: item.email,
          role: item.role || item.type,
          entity: item.entity || "Unknown",
        }));
        return users;
      }

      // If it's nested as results (common in search endpoints)
      if (response.data.results && Array.isArray(response.data.results)) {
        const users = response.data.results.map((item: any) => ({
          id: item._id || item.id,
          name: item.name,
          surname: item.surname,
          email: item.email,
          role: item.role || item.type,
          entity: item.entity || "Unknown",
        }));
        return users;
      }

      // If it's a single user object
      if (response.data.user) {
        const user = {
          id: response.data.user.id,
          name: response.data.user.name,
          surname: response.data.user.surname,
          email: response.data.user.email,
          role: response.data.user.type || response.data.user.role,
          entity: response.data.user.entity || "Unknown",
        };
        return [user]; // Return as array with single user
      }

      // If the response looks like search result with no matches
      if (response.data.message && response.data.error === false) {
        return [];
      }
    }

    return [];
  } catch (error: any) {
    console.error("Search users error:", error.response?.status, error.response?.statusText);

    // If 404, the endpoint might not exist
    if (error.response?.status === 404) {
      console.error("Users search endpoint not found - API might not have this endpoint yet");
      return []; // Return empty array instead of throwing
    }

    throw new Error(
      error.response?.data?.message || error.message || "Failed to search users"
    );
  }
};

// Create new user (admin or regular user)
export const createUser = async (
  userData: CreateUserData
): Promise<UserResponse> => {
  try {
    const response = await sixstepClient.post("/users/create", userData);

    // Handle different response structures
    if (response.data) {
      // If response has user wrapped
      if (response.data.user) {
        const user = {
          id: response.data.user._id || response.data.user.id,
          name: response.data.user.name,
          surname: response.data.user.surname,
          email: response.data.user.email,
          role: response.data.user.role || response.data.user.type,
          entity: response.data.user.entity,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.updatedAt,
        };
        return user;
      }

      // If response is direct user object
      if (response.data.id || response.data._id) {
        const user = {
          id: response.data._id || response.data.id,
          name: response.data.name,
          surname: response.data.surname,
          email: response.data.email,
          role: response.data.role || response.data.type,
          entity: response.data.entity,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        };
        return user;
      }

      // If it's a success message with user data
      if (response.data.message && !response.data.error) {
        return response.data; // Return as-is for now
      }
    }

    return response.data; // Fallback to raw response
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to create user"
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
    const response = await sixstepClient.post("/users/edit", userData);

    // API returns no response body on success
    return;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to edit user"
    );
  }
};

// Delete user
export interface DeleteUserData {
  userId: string;
}

export const deleteUserById = async (
  userData: DeleteUserData
): Promise<void> => {
  try {
    const response = await sixstepClient.post("/users/delete", userData);

    // API returns no response body on success
    return;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to delete user"
    );
  }
};

// Delete entity
export const deleteEntity = async (entityId: string): Promise<void> => {
  try {
    const response = await sixstepClient.post("/entities/delete", {
      entityId: entityId
    });
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to delete entity"
    );
  }
};

// Reset supplies for entity
export const resetEntitySupplies = async (entityId: string, warehouse?: string): Promise<void> => {
  try {
    const response = await sixstepClient.post("/supply/delete-all-for-entity", {
      entityId: entityId,
      warehouse: warehouse
    });
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to reset entity supplies"
    );
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("sixstep_token");
  const user = localStorage.getItem("sixstep_user");
  return !!(token && user);
};

// Fetch logs with warehouse filtering
export const fetchWarehouseLogs = async (warehouseName: string): Promise<any[]> => {
  try {
    
    // First, get all recent logs and filter client-side since the warehouse field is nested
    const response = await sixstepClient.post("/logs/get",{
      "page": 1,
      "limit": 20000000
    });
    
    
    // Filter logs that have the warehouse in details.metadata.warehouse
    const filteredLogs = (response.data.logs || []).filter((log: any) => {
      // Check if warehouse exists in details.metadata.warehouse
      const warehouseInMetadata = log.details?.metadata?.warehouse === warehouseName;
      // Also check the top-level warehouse field for backward compatibility
      const warehouseTopLevel = log.warehouse === warehouseName;
      
      return warehouseInMetadata || warehouseTopLevel;
    });
    
    return filteredLogs.slice(0, 1); // Return only the most recent
  } catch (error) {
    throw error;
  }
};

// Fetch warehouse statistics
export const fetchWarehouseStats = async (entityId: string, warehouseName: string): Promise<{
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  lastActivity: string;
  recentUploads: number;
}> => {
  try {
    
    // Get products to calculate stats
    const productsResponse = await sixstepClient.post("/products/get", {
      page: 1,
      limit: 1000 // Get more products to calculate accurate stats
    });
    
    // Filter products that have supplies in this specific warehouse
    const warehouseProducts = productsResponse.data.products.filter((product: any) => {
      if (product.supplies && Array.isArray(product.supplies)) {
        return product.supplies.some((supply: any) => 
          supply.entityId === entityId && supply.warehouse === warehouseName
        );
      }
      return false;
    });
    
    // Calculate statistics
    let totalStock = 0;
    let totalValue = 0;
    
    warehouseProducts.forEach((product: any) => {
      if (product.supplies && Array.isArray(product.supplies)) {
        product.supplies.forEach((supply: any) => {
          if (supply.entityId === entityId && supply.warehouse === warehouseName) {
            totalStock += supply.stock || supply.quantity || 0;
            totalValue += (supply.stock || supply.quantity || 0) * (supply.price || supply.publicPrice || 0);
          }
        });
      }
    });
    
    // Get recent activity count (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const logsResponse = await sixstepClient.post("/logs/get", {
      page: 1,
      limit: 1000
    });
    
    const recentUploads = (logsResponse.data.logs || []).filter((log: any) => {
      const isWarehouseLog = log.details?.metadata?.warehouse === warehouseName || log.warehouse === warehouseName;
      const isRecent = log.timestamp > sevenDaysAgo;
      const isUploadAction = log.customAction?.includes('CSV_UPLOAD') || log.customAction?.includes('UPLOAD');
      return isWarehouseLog && isRecent && isUploadAction;
    }).length;
    
    const stats = {
      totalProducts: warehouseProducts.length,
      totalStock: totalStock,
      totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
      lastActivity: warehouseProducts.length > 0 ? 'Active' : 'No activity',
      recentUploads: recentUploads
    };
    
    return stats;
  } catch (error) {
    // Return default stats on error
    return {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
      lastActivity: 'Unknown',
      recentUploads: 0
    };
  }
};

// Delete warehouse supplies
export const deleteWarehouseSupplies = async (entityId: string, warehouseName: string): Promise<void> => {
  try {
    const response = await sixstepClient.post("/supply/delete-all-for-entity", {
      entityId: entityId,
      warehouse: warehouseName
    });
  } catch (error) {
    throw error;
  }
};

// Remove warehouse from entity
export const removeWarehouseFromEntity = async (entityId: string, warehouseName: string): Promise<void> => {
  try {
    
    // First get current entity data
    const entities = await getAllEntities();
    const entity = entities.find(e => e.id === entityId);
    
    if (!entity) {
      throw new Error("Entity not found");
    }
    
    // Remove warehouse from the list
    const updatedWarehouses = (entity.warehouses || []).filter(w => w !== warehouseName);
    
    // Use POST /entities/update endpoint directly
    const response = await sixstepClient.post("/entities/update", {
      entityId: entityId,
      entityType: entity.entityType,
      entityName: entity.entityName,
      country: entity.country || "IT",
      warehouses: updatedWarehouses,
      notes: entity.notes || "",
      status: entity.status || "active"
    });
    
  } catch (error) {
    throw error;
  }
};

// Get current user from localStorage
export const getCurrentUser = (): AuthUser | null => {
  try {
    const userStr = localStorage.getItem("sixstep_user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    localStorage.removeItem("sixstep_user");
    return null;
  }
};

// Verify token validity
export const verifyToken = async (): Promise<boolean> => {
  try {
    await sixstepClient.get("/auth/verify");
    return true;
  } catch (error) {
    return false;
  }
};

// Interface for logs API response
export interface LogEntry {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    surname: string;
    role: string;
  };
  ip: string;
  action: string;
  timestamp: number;
  formattedDate: string;
  details: any;
  userAgent: string;
}

export interface LogsResponse {
  message: string;
  error: boolean;
  logs: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

// Get logs from Sixstep Core API
export const getLogs = async (
  page: number = 1,
  limit: number = 1000000
): Promise<LogsResponse> => {
  try {
    const payload = {
      startDate: "2025-01-01",
      endDate: "3000-12-31",
      page: 1,
      limit: 1000000,
    };


    const response = await sixstepClient.post("/logs/get", payload);


    if (response.data && !response.data.error) {
      return response.data;
    } else {
      return {
        message: "Error",
        error: true,
        logs: [],
        pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 0 },
      };
    }
  } catch (error) {
    return {
      message: "Error",
      error: true,
      logs: [],
      pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 0 },
    };
  }
};

// Download logs as CSV
export const downloadLogs = async (): Promise<void> => {
  try {
    const payload = {
      startDate: "2025-01-01",
      endDate: "3000-12-31",
    };


    const response = await sixstepClient.post("/logs/download", payload, {
      responseType: "blob",
    });


    // Create blob from response
    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = `logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    throw error;
  }
};

// ===== UPLOAD ENDPOINTS =====

// Interface for column mapping
export interface ColumnMapping {
  [key: string]: string; // column header -> field name
}

// Interface for upload validation response
export interface UploadValidationResponse {
  success: boolean;
  message: string;
  detectedColumns: string[];
  suggestedMappings?: ColumnMapping;
  previewData?: any[];
}

// Interface for upload response
export interface UploadResponse {
  success: boolean;
  message: string;
  processedRows?: number;
  errors?: string[];
  uploadId?: string; // Upload ID for progress tracking
  error?: boolean; // For error responses
  reason?: string; // Error reason
  upload_id?: string; // Alternative uploadId format
  id?: string; // Alternative ID format
}

// Interface for upload progress response
export interface UploadProgressResponse {
  uploadId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  currentStepIndex: number;
  processedRows?: number;
  totalRows?: number;
  errors?: string[];
  message: string;
  estimatedTimeRemaining?: number; // in seconds
}

// Interface for active upload
export interface ActiveUpload {
  uploadId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  totalRows: number;
  processedRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  message: string;
  startTime: number;
  estimatedTimeRemaining: number;
}

// Interface for active uploads response
export interface ActiveUploadsResponse {
  message: string;
  error: boolean;
  uploads: ActiveUpload[];
}

// Upload Products CSV (Admin only) - for updating general product database
export const uploadProductsCSV = async (
  file: File,
  columnMapping: ColumnMapping
): Promise<UploadResponse> => {
  try {

    const formData = new FormData();
    formData.append("csvFile", file);
    // formData.append("columnMapping", JSON.stringify(columnMapping));

    const response = await sixstepClient.post("/upload/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Check if server returned an error even with 200 status
    if (response.data?.error || response.data?.success === false) {
      console.error("❌ Server returned error in response body:", response.data);
      throw new Error(
        response.data?.message ||
          response.data?.reason ||
          "Server returned error"
      );
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Upload Supplies CSV (Supplier) - for updating own stock levels
export const uploadSuppliesCSV = async (
  file: File,
  columnMapping: ColumnMapping,
  entityId?: string,
  warehouse?: string
): Promise<UploadResponse> => {
  try {

    const formData = new FormData();
    formData.append("csvFile", file);
    // formData.append("columnMapping", JSON.stringify(columnMapping));
    if (entityId) {
      formData.append("entityId", entityId);
    }
    if (warehouse) {
      formData.append("warehouse", warehouse);
    }

    const response = await sixstepClient.post("/upload/supplies", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Upload Supplies CSV (Admin) - for updating specific supplier's stock levels
export const uploadSuppliesAdminCSV = async (
  file: File,
  columnMapping: ColumnMapping,
  supplierId: string,
  warehouse?: string
): Promise<UploadResponse> => {
  try {

    const formData = new FormData();
    formData.append("csvFile", file);
    // formData.append("columnMapping", JSON.stringify(columnMapping));
    formData.append("entityId", supplierId);
    if (warehouse) {
      formData.append("warehouse", warehouse);
    }

    const response = await sixstepClient.post(
      "/upload/supplies/admin",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );


    return response.data;
  } catch (error: any) {

    if (error.response) {
    } else if (error.request) {
    } else {
    }

    throw error;
  }
};

// Validate CSV/Excel file and get column headers (reads only first row for performance)
export const validateCSVHeaders = async (
  file: File
): Promise<UploadValidationResponse> => {
  return new Promise((resolve, reject) => {
    const isExcelFile = file.name.match(/\.(xlsx?|xls)$/i);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let headers: string[] = [];

        if (isExcelFile) {
          // Handle Excel files using XLSX library
          const data = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(data, { type: "array" });

          // Get first worksheet
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          // Extract headers from first row
          headers = (jsonData[0] as string[]) || [];
        } else {
          // Handle CSV files as text
          const content = e.target?.result as string;

          // Get only first line for performance (as requested)
          const firstLine = content.split("\n")[0];

          // Try different separators (comma, semicolon)
          let separator = ",";
          if (
            firstLine.includes(";") &&
            firstLine.split(";").length > firstLine.split(",").length
          ) {
            separator = ";";
          } else {
          }

          headers = firstLine
            .split(separator)
            .map((h) => h.trim().replace(/['"]/g, ""));
        }

        // Suggest mappings based on common column patterns
        const suggestedMappings: ColumnMapping = {};
        headers.forEach((header) => {
          const lowerHeader = header.toLowerCase();

          // Common product field mappings (English and Italian) - Updated for separate SKU/EAN
          if (
            lowerHeader === "name" ||
            lowerHeader.includes("nome") ||
            lowerHeader.includes("descrizione")
          ) {
            suggestedMappings[header] = "name";
          } else if (
            lowerHeader === "sku" ||
            lowerHeader.includes("code") ||
            lowerHeader.includes("codice")
          ) {
            suggestedMappings[header] = "sku";
          } else if (lowerHeader.includes("minsan")) {
            suggestedMappings[header] = "minsan";
          } else if (lowerHeader === "ean") {
            suggestedMappings[header] = "ean";
          } else if (
            lowerHeader === "price" ||
            lowerHeader.includes("prezzo")
          ) {
            suggestedMappings[header] = "price";
          } else if (
            lowerHeader.includes("stock") ||
            lowerHeader.includes("giacenza") ||
            lowerHeader.includes("quantit")
          ) {
            suggestedMappings[header] = "quantity"; // Changed from 'stock' to 'quantity' for backend API
          } else if (
            lowerHeader.includes("manufacturer") ||
            lowerHeader.includes("produttore") ||
            lowerHeader.includes("ditta")
          ) {
            suggestedMappings[header] = "manufacturer";
          } else if (lowerHeader === "vat" || lowerHeader.includes("iva")) {
            suggestedMappings[header] = "vat";
          } else if (
            lowerHeader.includes("currency") ||
            lowerHeader.includes("valuta") ||
            lowerHeader.includes("moneta")
          ) {
            suggestedMappings[header] = "currency";
          } else if (
            lowerHeader.includes("unit") ||
            lowerHeader.includes("unità") ||
            lowerHeader.includes("misura") ||
            lowerHeader.includes("um")
          ) {
            suggestedMappings[header] = "unit";
          } else if (
            lowerHeader.includes("supplier") ||
            lowerHeader.includes("fornitore")
          ) {
            suggestedMappings[header] = "supplier";
          }
        });


        resolve({
          success: true,
          message: "File headers detected successfully",
          detectedColumns: headers,
          suggestedMappings,
        });
      } catch (error) {
        console.error("Error parsing file:", error);
        reject(new Error(`Error parsing file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    // Use appropriate reader method based on file type
    if (isExcelFile) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};

// Get upload progress by upload ID
export const getUploadProgress = async (
  uploadId: string
): Promise<UploadProgressResponse> => {
  try {

    const response = await sixstepClient.post("/upload/progress", {
      uploadId,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get active uploads
export const getActiveUploads = async (): Promise<ActiveUploadsResponse> => {
  try {
    const response = await sixstepClient.post("/upload/active");
    return response.data;
  } catch (error) {
    throw error;
  }
};
