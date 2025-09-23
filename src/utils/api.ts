import axios from "axios";
import * as XLSX from "xlsx";
import { Product, ProductPrice } from "../data/mockProducts";

// Sixstep Core API Configuration
const SIXSTEP_CORE_URL =
  process.env.REACT_APP_SIXSTEP_CORE_URL ||
  "https://sixstep-be-uq52c.ondigitalocean.app";

console.log("🌐 API Configuration:", {
  SIXSTEP_CORE_URL,
  environment: process.env.NODE_ENV,
});

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
    console.log("🚀 Fetching products from Sixstep Core API...");

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

    console.log("📦 Calling POST /products/get with payload:", payload);
    const response = await sixstepClient.post("/products/get", payload);

    console.log("✅ Sixstep Core API response:", response.data);

    // Check if response has the expected structure
    if (!response.data || !Array.isArray(response.data.products)) {
      console.warn("⚠️ Unexpected API response structure, using fallback");
      throw new Error("Invalid API response structure");
    }

    // Get all entities to map entityId to supplier names (only for admin users)
    let entities: Entity[] = [];
    if (isAdmin) {
      try {
        entities = await getAllEntities();
        console.log("📋 Loaded entities for supplier mapping:", entities.length);
      } catch (error: any) {
        console.warn("⚠️ Could not load entities for supplier mapping:", error);
      }
    } else {
      console.log("📋 Skipping entities loading for non-admin user");
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

    console.log(`✅ Processed ${products.length} products`);

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

    console.log("📊 Final result stats:", {
      products: result.products.length,
      categories: result.categories.length,
      manufacturers: result.manufacturers.length,
      suppliers: result.suppliers.length,
    });

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
    console.log(`Attempting login to ${SIXSTEP_CORE_URL}/users/login`);
    const response = await sixstepClient.post("/users/login", credentials);

    // Debug: log the actual response structure
    console.log("Login API Response:", response.data);

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
    console.error("Login API error:", error);
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
    console.warn("Logout endpoint error:", error);
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
    console.log("Raw API response:", response.data);

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

      console.log("Processed entities:", entities);
      return entities;
    }

    console.warn("No entities found in response");
    return [];
  } catch (error: any) {
    console.error("Get all entities error:", error);
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
    console.log("🔍 Fetching current user entity...");
    const response = await sixstepClient.get("/users/get");
    
    console.log("✅ Current user entity response:", response.data);
    
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
    
    console.log("📊 Mapped current user entity:", entity);
    return entity;
  } catch (error) {
    console.error("❌ Error fetching current user entity:", error);
    throw error;
  }
};

// Get single entity
export const getEntity = async (entityId: string): Promise<Entity> => {
  try {
    const response = await sixstepClient.get(`/entities/get/${entityId}`);
    return response.data;
  } catch (error: any) {
    console.error("Get entity error:", error);
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
    console.error("Update entity error:", error);
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
    console.log("Creating entity with data:", entityData);
    
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
    
    console.log("Mapped payload for backend:", backendPayload);
    const response = await sixstepClient.post("/entities/create", backendPayload);
    console.log("Raw Create Entity API response:", response.data);

    // Handle different response structures
    if (response.data) {
      // If response has entity wrapped (like other APIs)
      if (response.data.entity) {
        console.log("Entity found in wrapped structure:", response.data.entity);
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
        console.log("Processed created entity:", entity);
        return entity;
      }

      // If response is direct entity object
      if (response.data._id || response.data.id) {
        console.log("Entity found as direct object:", response.data);
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
        console.log("Processed created entity:", entity);
        return entity;
      }

      // If response is success message format (new API structure)
      if (response.data.message && response.data.error === false) {
        console.log("Entity created successfully, fetching updated entities list");
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
        console.log("Returning temporary entity for UI refresh:", tempEntity);
        return tempEntity;
      }
    }

    console.error(
      "Unexpected create entity response structure:",
      response.data
    );
    throw new Error("Invalid response structure from create entity API");
  } catch (error: any) {
    console.error(
      "Create entity error:",
      error.response?.data || error.message
    );
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

    console.log("Searching users with payload:", searchPayload);
    const response = await sixstepClient.post("/users/search", searchPayload);
    console.log("Raw Users Search API response:", response.data);
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    // Check if response has users data
    if (response.data) {
      // If it's a direct array
      if (Array.isArray(response.data)) {
        console.log(
          "Users response is direct array:",
          response.data.length,
          "users"
        );
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
        console.log(
          "Users found in nested structure:",
          response.data.users.length,
          "users"
        );
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
        console.log(
          "Users found in results:",
          response.data.results.length,
          "users"
        );
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
        console.log(
          "Single user found, converting to array:",
          response.data.user
        );
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
        console.log("Search successful but no users found");
        return [];
      }
    }

    console.warn("Unexpected search response structure:", response.data);
    return [];
  } catch (error: any) {
    console.error(
      "Search users error:",
      error.response?.status,
      error.response?.statusText
    );
    console.error("Error details:", error.response?.data);

    // If 404, the endpoint might not exist
    if (error.response?.status === 404) {
      console.warn(
        "Users search endpoint not found - API might not have this endpoint yet"
      );
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
    console.log("Creating user with data:", userData);
    const response = await sixstepClient.post("/users/create", userData);
    console.log("Raw Create User API response:", response.data);
    console.log("Response status:", response.status);

    // Handle different response structures
    if (response.data) {
      // If response has user wrapped
      if (response.data.user) {
        console.log("User found in wrapped structure:", response.data.user);
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
        console.log("Processed created user:", user);
        return user;
      }

      // If response is direct user object
      if (response.data.id || response.data._id) {
        console.log("User found as direct object:", response.data);
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
        console.log("Processed created user:", user);
        return user;
      }

      // If it's a success message with user data
      if (response.data.message && !response.data.error) {
        console.log("Success response with message:", response.data.message);
        return response.data; // Return as-is for now
      }
    }

    console.error("Unexpected create user response structure:", response.data);
    return response.data; // Fallback to raw response
  } catch (error: any) {
    console.error("Create user error:", error.response?.data || error.message);
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
    console.log("Editing user with data:", userData);
    const response = await sixstepClient.post("/users/edit", userData);
    console.log("Edit User API response:", response.data);
    console.log("Response status:", response.status);

    // API returns no response body on success
    return;
  } catch (error: any) {
    console.error("Edit user error:", error.response?.data || error.message);
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
    console.log("Deleting user with ID:", userData.userId);
    const response = await sixstepClient.post("/users/delete", userData);
    console.log("Delete User API response:", response.data);
    console.log("Response status:", response.status);

    // API returns no response body on success
    return;
  } catch (error: any) {
    console.error("Delete user error:", error.response?.data || error.message);
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
    console.log("Delete Entity API response:", response.data);
  } catch (error: any) {
    console.error("Delete entity error:", error);
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
    console.log("Resetting supplies for entity:", entityId, "warehouse:", warehouse);
    const response = await sixstepClient.post("/supply/delete-all-for-entity", {
      entityId: entityId,
      warehouse: warehouse
    });
    console.log("Reset Entity Supplies API response:", response.data);
  } catch (error: any) {
    console.error("Reset entity supplies error:", error);
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
    console.log("🔍 Fetching logs for warehouse:", warehouseName);
    
    // First, get all recent logs and filter client-side since the warehouse field is nested
    const response = await sixstepClient.get("/logs/get", {
      params: {
        sort: JSON.stringify({ timestamp: -1 }),
        limit: 50 // Get more logs to filter client-side
      }
    });
    
    console.log("📊 All logs response:", response.data);
    
    // Filter logs that have the warehouse in details.metadata.warehouse
    const filteredLogs = (response.data.logs || []).filter((log: any) => {
      // Check if warehouse exists in details.metadata.warehouse
      const warehouseInMetadata = log.details?.metadata?.warehouse === warehouseName;
      // Also check the top-level warehouse field for backward compatibility
      const warehouseTopLevel = log.warehouse === warehouseName;
      
      return warehouseInMetadata || warehouseTopLevel;
    });
    
    console.log("✅ Filtered warehouse logs:", filteredLogs);
    return filteredLogs.slice(0, 1); // Return only the most recent
  } catch (error) {
    console.error("❌ Error fetching warehouse logs:", error);
    throw error;
  }
};

// Get current user from localStorage
export const getCurrentUser = (): AuthUser | null => {
  try {
    const userStr = localStorage.getItem("sixstep_user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
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

    console.log("Fetching logs from API...", payload);

    const response = await sixstepClient.post("/logs/get", payload);

    console.log("Logs API response:", response.data);

    if (response.data && !response.data.error) {
      return response.data;
    } else {
      console.error("Invalid logs response format:", response.data);
      return {
        message: "Error",
        error: true,
        logs: [],
        pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 0 },
      };
    }
  } catch (error) {
    console.error("Error fetching logs:", error);
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

    console.log("Downloading logs CSV...", payload);

    const response = await sixstepClient.post("/logs/download", payload, {
      responseType: "blob",
    });

    console.log("Logs download response:", response);

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

    console.log("Logs CSV downloaded successfully");
  } catch (error) {
    console.error("Error downloading logs:", error);
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
    console.log("🚀 Starting products file upload...", {
      fileName: file.name,
      mapping: columnMapping,
    });

    const formData = new FormData();
    formData.append("csvFile", file);
    // formData.append("columnMapping", JSON.stringify(columnMapping));

    const response = await sixstepClient.post("/upload/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Products file uploaded successfully:", response.data);
    console.log("🔍 Raw API Response Details:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      dataType: typeof response.data,
      dataKeys: Object.keys(response.data || {}),
      hasUploadId: !!(response.data && response.data.uploadId),
      uploadId: response.data?.uploadId,
      success: response.data?.success,
      error: response.data?.error,
    });

    // Check if server returned an error even with 200 status
    if (response.data?.error || response.data?.success === false) {
      console.error(
        "❌ Server returned error in response body:",
        response.data
      );
      throw new Error(
        response.data?.message ||
          response.data?.reason ||
          "Server returned error"
      );
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error uploading products:", error);
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
    console.log("🚀 Starting supplies CSV upload...", {
      fileName: file.name,
      mapping: columnMapping,
      entityId: entityId,
      warehouse: warehouse,
    });

    const formData = new FormData();
    formData.append("csvFile", file);
    // formData.append("columnMapping", JSON.stringify(columnMapping));
    if (entityId) {
      formData.append("entityId", entityId);
    }
    if (warehouse) {
      formData.append("warehouse", warehouse);
    }

    console.log("📤 FormData prepared:", {
      fileAppended: formData.has("csvFile"),
      entityAppended: formData.has("entityId"),
      warehouseAppended: formData.has("warehouse"),
    });

    const response = await sixstepClient.post("/upload/supplies", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Supplies uploaded successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error uploading supplies:", error);
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
    console.log("🚀 Starting admin supplies file upload...", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      mapping: columnMapping,
      entityId: supplierId,
      warehouse: warehouse,
    });

    const formData = new FormData();
    formData.append("csvFile", file);
    // formData.append("columnMapping", JSON.stringify(columnMapping));
    formData.append("entityId", supplierId);
    if (warehouse) {
      formData.append("warehouse", warehouse);
    }

    console.log("📤 FormData prepared:", {
      fileAppended: formData.has("csvFile"),
      mappingAppended: false, // Column mapping disabled - file should have correct headers
      entityAppended: formData.has("entityId"),
      warehouseAppended: formData.has("warehouse"),
    });

    console.log("🌐 Making API request to: POST /upload/supplies/admin");
    console.log(
      "📡 Request headers will include: Content-Type: multipart/form-data"
    );

    const response = await sixstepClient.post(
      "/upload/supplies/admin",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ Admin supplies uploaded successfully!");
    console.log("📊 API Response status:", response.status);
    console.log("📊 API Response data:", response.data);
    console.log("📊 API Response headers:", response.headers);

    return response.data;
  } catch (error: any) {
    console.error("❌ Error uploading admin supplies:", error);

    if (error.response) {
      console.error("📍 API Error Details:");
      console.error("  Status:", error.response.status);
      console.error("  Status Text:", error.response.statusText);
      console.error("  Data:", error.response.data);
      console.error("  Headers:", error.response.headers);
    } else if (error.request) {
      console.error("📍 Network Error - No response received:");
      console.error("  Request:", error.request);
    } else {
      console.error("📍 Request Setup Error:", error.message);
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
        console.log("📋 Validating file headers for:", file.name);
        let headers: string[] = [];

        if (isExcelFile) {
          // Handle Excel files using XLSX library
          console.log("📊 Processing Excel file...");
          const data = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(data, { type: "array" });

          // Get first worksheet
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          // Extract headers from first row
          headers = (jsonData[0] as string[]) || [];
          console.log("📊 Excel headers detected:", headers);
        } else {
          // Handle CSV files as text
          console.log("📊 Processing CSV file...");
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
            console.log("📊 Detected semicolon separator");
          } else {
            console.log("📊 Using comma separator");
          }

          headers = firstLine
            .split(separator)
            .map((h) => h.trim().replace(/['"]/g, ""));
          console.log("📊 CSV headers detected:", headers);
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

        console.log("🎯 Suggested mappings:", suggestedMappings);

        resolve({
          success: true,
          message: "File headers detected successfully",
          detectedColumns: headers,
          suggestedMappings,
        });
      } catch (error) {
        console.error("❌ Error parsing file:", error);
        reject(new Error(`Error parsing file: ${error}`));
      }
    };

    reader.onerror = () => {
      console.error("❌ Error reading file");
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
    console.log(`📊 Getting upload progress for ID: ${uploadId}`);

    const response = await sixstepClient.post("/upload/progress", {
      uploadId,
    });

    console.log("✅ Upload progress response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error getting upload progress:", error);
    throw error;
  }
};

// Get active uploads
export const getActiveUploads = async (): Promise<ActiveUploadsResponse> => {
  try {
    console.log("🔄 Getting active uploads...");
    const response = await sixstepClient.post("/upload/active");
    console.log("✅ Active uploads retrieved:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error getting active uploads:", error);
    throw error;
  }
};
