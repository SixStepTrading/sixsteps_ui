

// Definizione dei tipi di dato
export type OrderStatus = 'Draft' | 'Processing' | 'Pending Approval' | 'Partially Filled' | 'Executed';

// Interface for supplier information
export interface SupplierInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  deliveryTime: string;
}

// Interface for product-level counter offer changes
export interface ProductCounterOffer {
  productId: string;
  originalQuantity: number;
  proposedQuantity: number;
  originalUnitPrice: number;
  proposedUnitPrice: number;
  originalTotalPrice: number;
  proposedTotalPrice: number;
  reason?: string;
}

// New interface for picking management
export interface PickingDetails {
  id: string;
  originalQuantity: number;
  availableQuantity: number;
  allocatedQuantity: number;
  reason: string;
  alternativeProducts?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  estimatedRestockDate?: string;
  supplierComment?: string;
}

// New interface for buyer preferences
export interface BuyerPickingPreferences {
  autoAcceptPartialDelivery: boolean;
  maxAcceptableReduction: number; // percentage (e.g., 20 means accept up to 20% reduction)
  requireConfirmationForAlternatives: boolean;
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
}

// Interface for picking notification
export interface PickingNotification {
  id: string;
  orderId: string;
  productId: string;
  type: 'partial_available' | 'out_of_stock' | 'alternative_suggested';
  message: string;
  createdAt: string;
  acknowledged: boolean;
  autoProcessed: boolean;
}

// Product status type
export type ProductStatus = 'Executed' | 'Pending Approval' | 'Rejected';

// Enhanced interface for order product details with picking info
export interface OrderProductDetail {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string; // Warehouse identifier (format: "Entity | Warehouse")
  warehouseName?: string; // Warehouse display name
  stockAvailable?: number;
  estimatedDelivery?: string;
  productStatus?: ProductStatus; // Status of individual product (Executed, Pending Approval, Rejected)
  // New fields for buyer view with pricing information
  publicPrice?: number; // Retail price
  vat?: number; // VAT percentage
  averagePrice?: number | null; // Average purchase price
  targetPrice?: number | null; // Target price set by buyer
  bestPrices?: Array<{ price: number; stock: number; supplier?: string; warehouse?: string; entityName?: string }>; // Available prices
  ean?: string; // EAN code
  minsan?: string; // Minsan code
  manufacturer?: string; // Manufacturer name
}

// Interface for counter offer details (enhanced)
export interface CounterOfferDetail {
  id: string;
  originalAmount: number;
  proposedAmount: number;
  message: string;
  createdDate: string;
  expiryDate: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  adminId: string;
  adminName: string;
  productChanges?: ProductCounterOffer[]; // New: detailed product-level changes
  pickingChanges?: PickingDetails[]; // New: picking-related changes
  requiresPickingApproval?: boolean; // New: if this counter offer includes picking adjustments
}

// Interface for additional info about orders
export interface OrderAdditionalInfo {
  deliveryAddress?: string;
  deliveryDate?: string;
  paymentMethod?: string;
  notes?: string;
}

// Interface for order data
export interface OrderWithDetails {
  id: string;
  createdOn: string;
  status: OrderStatus;
  totalProducts: number;
  items: number;
  amount: number;
  deliveryStatus?: string;
  deliveryDate?: string;
  estimatedDelivery?: string;
  completion?: number;
  buyerId?: string;
  buyerName?: string;
  counterOffer?: CounterOfferDetail;
  suppliers?: SupplierInfo[];
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  orderType?: 'Standard' | 'Express' | 'Bulk';
  // New picking-related fields
  pickingRequired?: boolean;
  pickingNotifications?: PickingNotification[];
  buyerPreferences?: BuyerPickingPreferences;
  hasPartialPickingApproval?: boolean; // Indicates if buyer has approved partial delivery
}

// Interface for order detail data used in the modal
export interface OrderDetailData {
  id: string;
  createdOn: string;
  status: string;
  products: OrderProductDetail[];
  deliveryAddress: string;
  deliveryDate: string;
  paymentMethod: string;
  notes: string;
  totalAmount: number;
  totalProducts: number;
  suppliers?: SupplierInfo[];
  counterOffer?: CounterOfferDetail;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  orderType?: 'Standard' | 'Express' | 'Bulk';
  buyerId?: string;
  buyerName?: string;
}

// Mock suppliers data
export const MOCK_SUPPLIERS: SupplierInfo[] = [
  {
    id: 'SUP-001',
    name: 'MediSupply Italia',
    email: 'orders@medisupply.it',
    phone: '+39 02 1234567',
    address: 'Via Milano 45, 20100 Milano, Italy',
    rating: 4.8,
    deliveryTime: '2-3 business days'
  },
  {
    id: 'SUP-002',
    name: 'PharmaDistribution',
    email: 'sales@pharmadist.com',
    phone: '+39 06 9876543',
    address: 'Via Roma 123, 00100 Roma, Italy',
    rating: 4.5,
    deliveryTime: '1-2 business days'
  },
  {
    id: 'SUP-003',
    name: 'HealthCare Solutions',
    email: 'info@healthcare-sol.it',
    phone: '+39 011 5555555',
    address: 'Corso Torino 78, 10100 Torino, Italy',
    rating: 4.2,
    deliveryTime: '3-5 business days'
  },
  {
    id: 'SUP-004',
    name: 'BioMed Express',
    email: 'orders@biomedexpress.eu',
    phone: '+39 051 7777777',
    address: 'Via Bologna 234, 40100 Bologna, Italy',
    rating: 4.9,
    deliveryTime: '1 business day'
  }
];

// Mock counter offers data
export const MOCK_COUNTER_OFFERS: Record<string, CounterOfferDetail> = {
  'ODA-PEND-001': {
    id: 'CO-001',
    originalAmount: 5670.90,
    proposedAmount: 5350.00,
    message: 'We can offer a 6% discount for bulk purchase. This includes free express delivery and extended payment terms. Some quantities adjusted based on current stock availability.',
    createdDate: 'May 11, 2025',
    expiryDate: 'May 18, 2025',
    status: 'Pending',
    adminId: 'ADM-001',
    adminName: 'Marco Rossi',
    productChanges: [
      {
        productId: 'P001',
        originalQuantity: 30,
        proposedQuantity: 28,
        originalUnitPrice: 22.50,
        proposedUnitPrice: 21.00,
        originalTotalPrice: 675.00,
        proposedTotalPrice: 588.00,
        reason: 'Limited stock, better unit price offered'
      },
      {
        productId: 'P007',
        originalQuantity: 15,
        proposedQuantity: 15,
        originalUnitPrice: 8.50,
        proposedUnitPrice: 7.90,
        originalTotalPrice: 127.50,
        proposedTotalPrice: 118.50,
        reason: 'Bulk discount applied'
      }
    ]
  }
};

// Sample product data for orders
export const ORDER_PRODUCTS = [
  {
    id: 'P001',
    code: 'ALVG-001',
    name: 'ALVITA GINOCCHIERA',
    price: 22.50
  },
  {
    id: 'P002',
    code: 'BIOD-002',
    name: 'BIODERMA ATODERM',
    price: 15.80
  },
  {
    id: 'P003',
    code: 'ZERO-003',
    name: 'ZERODOL GEL',
    price: 12.40
  },
  {
    id: 'P004',
    code: 'ENTG-004',
    name: 'ENTEROGERMINA 2MLD',
    price: 9.90
  },
  {
    id: 'P005',
    code: 'OMEG-005',
    name: 'OMEGA 3 PLUS',
    price: 18.70
  },
  {
    id: 'P006',
    code: 'VITC-006',
    name: 'VITAMINA C 1000MG',
    price: 11.25
  },
  {
    id: 'P007',
    code: 'PARA-007',
    name: 'PARACETAMOL 500MG',
    price: 8.50
  },
  {
    id: 'P008',
    code: 'IBUP-008',
    name: 'IBUPROFEN 400MG',
    price: 14.20
  },
  {
    id: 'P009',
    code: 'AMOX-009',
    name: 'AMOXICILLIN 875MG',
    price: 25.80
  },
  {
    id: 'P010',
    code: 'ASPI-010',
    name: 'ASPIRIN 100MG',
    price: 6.90
  }
];

// Detailed product data for each order
// Detailed product data for each order - with warehouse information for Admin view
export const ORDER_DETAILS: Record<string, OrderProductDetail[]> = {
  // DRAFT orders
  'ODA-DRAFT-001': [
    { 
      id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 10, unitPrice: 22.50, totalPrice: 225.00, 
      supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', 
      stockAvailable: 150, estimatedDelivery: '2-3 days',
      ean: '8001234567890', minsan: '934512688', manufacturer: 'URIACH ITALY SRL',
      publicPrice: 28.50, vat: 22,
      bestPrices: [
        { price: 22.50, stock: 100, supplier: 'MediSupply Italia', warehouse: 'Warehouse Milano', entityName: 'MediSupply Italia' },
        { price: 23.20, stock: 50, supplier: 'PharmaDistribution', warehouse: 'Warehouse Roma', entityName: 'PharmaDistribution' }
      ],
      averagePrice: 22.85, targetPrice: 22.00
    },
    { 
      id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 15, unitPrice: 15.80, totalPrice: 237.00, 
      supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', 
      stockAvailable: 89, estimatedDelivery: '1-2 days',
      ean: '8001234567891', minsan: '934512689', manufacturer: 'BIODERMA LABORATORIES',
      publicPrice: 19.90, vat: 22,
      bestPrices: [
        { price: 15.80, stock: 89, supplier: 'PharmaDistribution', warehouse: 'Warehouse Roma', entityName: 'PharmaDistribution' },
        { price: 16.20, stock: 120, supplier: 'MediSupply Italia', warehouse: 'Warehouse Milano', entityName: 'MediSupply Italia' }
      ],
      averagePrice: 15.80, targetPrice: null
    },
    { 
      id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 8, unitPrice: 12.40, totalPrice: 99.20, 
      supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', 
      stockAvailable: 200, estimatedDelivery: '3-5 days',
      ean: '8001234567892', minsan: '934512690', manufacturer: 'MENARINI',
      publicPrice: 15.20, vat: 22,
      bestPrices: [
        { price: 12.40, stock: 150, supplier: 'HealthCare Solutions', warehouse: 'Warehouse Torino', entityName: 'HealthCare Solutions' },
        { price: 12.80, stock: 50, supplier: 'MediSupply Italia', warehouse: 'Warehouse Milano', entityName: 'MediSupply Italia' }
      ],
      averagePrice: 12.40, targetPrice: 12.00
    },
    { 
      id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 7, unitPrice: 9.90, totalPrice: 69.30, 
      supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', 
      stockAvailable: 200, estimatedDelivery: '2-3 days',
      ean: '8001234567893', minsan: '934512691', manufacturer: 'SANOFI',
      publicPrice: 12.50, vat: 22,
      bestPrices: [
        { price: 9.90, stock: 200, supplier: 'MediSupply Italia', warehouse: 'Warehouse Milano', entityName: 'MediSupply Italia' },
        { price: 10.20, stock: 100, supplier: 'PharmaDistribution', warehouse: 'Warehouse Roma', entityName: 'PharmaDistribution' }
      ],
      averagePrice: 9.90, targetPrice: null
    },
    { 
      id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 5, unitPrice: 18.70, totalPrice: 93.50, 
      supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', 
      stockAvailable: 150, estimatedDelivery: '1-2 days',
      ean: '8001234567894', minsan: '934512692', manufacturer: 'SOLGAR',
      publicPrice: 23.80, vat: 22,
      bestPrices: [
        { price: 18.70, stock: 150, supplier: 'PharmaDistribution', warehouse: 'Warehouse Roma', entityName: 'PharmaDistribution' },
        { price: 19.20, stock: 80, supplier: 'MediSupply Italia', warehouse: 'Warehouse Milano', entityName: 'MediSupply Italia' }
      ],
      averagePrice: 18.70, targetPrice: 18.50
    }
  ],
  'ODA-DRAFT-002': [
    { 
      id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 8, unitPrice: 11.25, totalPrice: 90.00, 
      supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', 
      stockAvailable: 200, estimatedDelivery: '3-5 days',
      ean: '8001234567895', minsan: '934512693', manufacturer: 'SOLGAR',
      publicPrice: 14.20, vat: 22,
      bestPrices: [
        { price: 11.25, stock: 150, supplier: 'HealthCare Solutions', warehouse: 'Warehouse Torino', entityName: 'HealthCare Solutions' },
        { price: 11.50, stock: 50, supplier: 'MediSupply Italia', warehouse: 'Warehouse Milano', entityName: 'MediSupply Italia' }
      ],
      averagePrice: 11.25, targetPrice: null
    },
    { 
      id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 12, unitPrice: 8.50, totalPrice: 102.00, 
      supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', 
      stockAvailable: 500, estimatedDelivery: '2-3 days',
      ean: '8001234567896', minsan: '934512694', manufacturer: 'ANGELINI',
      publicPrice: 10.80, vat: 22,
      bestPrices: [
        { price: 8.50, stock: 300, supplier: 'MediSupply Italia', warehouse: 'Warehouse Milano', entityName: 'MediSupply Italia' },
        { price: 8.70, stock: 200, supplier: 'PharmaDistribution', warehouse: 'Warehouse Roma', entityName: 'PharmaDistribution' }
      ],
      averagePrice: 8.50, targetPrice: 8.30
    },
    { 
      id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 8, unitPrice: 14.20, totalPrice: 113.60, 
      supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', 
      stockAvailable: 300, estimatedDelivery: '1-2 days',
      ean: '8001234567897', minsan: '934512695', manufacturer: 'MENARINI',
      publicPrice: 18.00, vat: 22,
      bestPrices: [
        { price: 14.20, stock: 200, supplier: 'PharmaDistribution', warehouse: 'Warehouse Roma', entityName: 'PharmaDistribution' },
        { price: 14.50, stock: 100, supplier: 'MediSupply Italia', warehouse: 'Warehouse Milano', entityName: 'MediSupply Italia' }
      ],
      averagePrice: 14.20, targetPrice: null
    }
  ],
  // PROCESSING orders
  'ODA-PROC-001': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 20, unitPrice: 22.50, totalPrice: 450.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 150, estimatedDelivery: '2-3 days' },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 25, unitPrice: 15.80, totalPrice: 395.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 89, estimatedDelivery: '1-2 days' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 15, unitPrice: 12.40, totalPrice: 186.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 200, estimatedDelivery: '2-3 days' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 18, unitPrice: 9.90, totalPrice: 178.20, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 200, estimatedDelivery: '1-2 days' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 12, unitPrice: 18.70, totalPrice: 224.40, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 150, estimatedDelivery: '2-3 days' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 10, unitPrice: 11.25, totalPrice: 112.50, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 200, estimatedDelivery: '1-2 days' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 10, unitPrice: 8.50, totalPrice: 85.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 500, estimatedDelivery: '2-3 days' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 10, unitPrice: 14.20, totalPrice: 142.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 300, estimatedDelivery: '1-2 days' }
  ],
  'ODA-PROC-002': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 15, unitPrice: 22.50, totalPrice: 337.50, supplierId: 'SUP-002', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 50, estimatedDelivery: '3-5 days' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 20, unitPrice: 12.40, totalPrice: 248.00, supplierId: 'SUP-002', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 200, estimatedDelivery: '3-5 days' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 10, unitPrice: 18.70, totalPrice: 187.00, supplierId: 'SUP-002', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 150, estimatedDelivery: '3-5 days' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 15, unitPrice: 11.25, totalPrice: 168.75, supplierId: 'SUP-002', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 200, estimatedDelivery: '3-5 days' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 20, unitPrice: 8.50, totalPrice: 170.00, supplierId: 'SUP-002', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 500, estimatedDelivery: '3-5 days' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 15, unitPrice: 14.20, totalPrice: 213.00, supplierId: 'SUP-002', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 300, estimatedDelivery: '3-5 days' }
  ],
  // PENDING APPROVAL orders
  'ODA-PEND-001': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 30, unitPrice: 22.50, totalPrice: 675.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 150, estimatedDelivery: '2-3 days' },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 25, unitPrice: 15.80, totalPrice: 395.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 100, estimatedDelivery: '1 day' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 20, unitPrice: 12.40, totalPrice: 248.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 200, estimatedDelivery: '2-3 days' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 15, unitPrice: 9.90, totalPrice: 148.50, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 250, estimatedDelivery: '1 day' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 18, unitPrice: 18.70, totalPrice: 336.60, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 150, estimatedDelivery: '2-3 days' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 12, unitPrice: 11.25, totalPrice: 135.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 200, estimatedDelivery: '1 day' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 15, unitPrice: 8.50, totalPrice: 127.50, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 500, estimatedDelivery: '2-3 days' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 10, unitPrice: 14.20, totalPrice: 142.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 300, estimatedDelivery: '1 day' },
    { id: 'P009', code: 'AMOX-009', name: 'AMOXICILLIN 875MG', quantity: 8, unitPrice: 25.80, totalPrice: 206.40, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 120, estimatedDelivery: '2-3 days' },
    { id: 'P010', code: 'ASPI-010', name: 'ASPIRIN 100MG', quantity: 17, unitPrice: 6.90, totalPrice: 117.30, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 400, estimatedDelivery: '1 day' }
  ],
  'ODA-PEND-002': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 20, unitPrice: 22.50, totalPrice: 450.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 89, estimatedDelivery: '1-2 days' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 25, unitPrice: 12.40, totalPrice: 310.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 200, estimatedDelivery: '3-5 days' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 18, unitPrice: 9.90, totalPrice: 178.20, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 200, estimatedDelivery: '1-2 days' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 15, unitPrice: 18.70, totalPrice: 280.50, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 150, estimatedDelivery: '3-5 days' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 20, unitPrice: 11.25, totalPrice: 225.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 200, estimatedDelivery: '1-2 days' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 22, unitPrice: 8.50, totalPrice: 187.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 500, estimatedDelivery: '3-5 days' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 25, unitPrice: 14.20, totalPrice: 355.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 300, estimatedDelivery: '1-2 days' }
  ],
  // PARTIALLY FILLED orders - mix of Executed, Pending Approval, and Rejected products
  'ODA-PART-001': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 40, unitPrice: 22.50, totalPrice: 900.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 150, estimatedDelivery: '2-3 days', productStatus: 'Executed' },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 35, unitPrice: 15.80, totalPrice: 553.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 89, estimatedDelivery: '1-2 days', productStatus: 'Executed' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 30, unitPrice: 12.40, totalPrice: 372.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 200, estimatedDelivery: '3-5 days', productStatus: 'Pending Approval' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 25, unitPrice: 9.90, totalPrice: 247.50, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 200, estimatedDelivery: '2-3 days', productStatus: 'Rejected' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 28, unitPrice: 18.70, totalPrice: 523.60, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 150, estimatedDelivery: '1-2 days', productStatus: 'Executed' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 22, unitPrice: 11.25, totalPrice: 247.50, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 200, estimatedDelivery: '3-5 days', productStatus: 'Pending Approval' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 20, unitPrice: 8.50, totalPrice: 170.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 500, estimatedDelivery: '2-3 days', productStatus: 'Rejected' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 18, unitPrice: 14.20, totalPrice: 255.60, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 300, estimatedDelivery: '1-2 days', productStatus: 'Executed' },
    { id: 'P009', code: 'AMOX-009', name: 'AMOXICILLIN 875MG', quantity: 15, unitPrice: 25.80, totalPrice: 387.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 120, estimatedDelivery: '3-5 days', productStatus: 'Pending Approval' },
    { id: 'P010', code: 'ASPI-010', name: 'ASPIRIN 100MG', quantity: 12, unitPrice: 6.90, totalPrice: 82.80, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 400, estimatedDelivery: '2-3 days', productStatus: 'Rejected' },
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 8, unitPrice: 22.50, totalPrice: 180.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 89, estimatedDelivery: '1-2 days', productStatus: 'Pending Approval' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 5, unitPrice: 12.40, totalPrice: 62.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 200, estimatedDelivery: '2-3 days', productStatus: 'Executed' }
  ],
  'ODA-PART-002': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 25, unitPrice: 22.50, totalPrice: 562.50, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 50, estimatedDelivery: '3-5 days', productStatus: 'Executed' },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 20, unitPrice: 15.80, totalPrice: 316.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 100, estimatedDelivery: '1 day', productStatus: 'Pending Approval' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 30, unitPrice: 9.90, totalPrice: 297.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 250, estimatedDelivery: '1 day', productStatus: 'Rejected' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 22, unitPrice: 18.70, totalPrice: 411.40, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 150, estimatedDelivery: '3-5 days', productStatus: 'Executed' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 28, unitPrice: 11.25, totalPrice: 315.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 200, estimatedDelivery: '1 day', productStatus: 'Pending Approval' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 25, unitPrice: 8.50, totalPrice: 212.50, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 500, estimatedDelivery: '3-5 days', productStatus: 'Rejected' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 20, unitPrice: 14.20, totalPrice: 284.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 300, estimatedDelivery: '1 day', productStatus: 'Executed' },
    { id: 'P009', code: 'AMOX-009', name: 'AMOXICILLIN 875MG', quantity: 12, unitPrice: 25.80, totalPrice: 309.60, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 120, estimatedDelivery: '3-5 days', productStatus: 'Pending Approval' },
    { id: 'P010', code: 'ASPI-010', name: 'ASPIRIN 100MG', quantity: 13, unitPrice: 6.90, totalPrice: 89.70, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 400, estimatedDelivery: '1 day', productStatus: 'Rejected' }
  ],
  // EXECUTED orders - mix of Executed and Rejected products (NO Pending Approval)
  'ODA-EXEC-001': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 50, unitPrice: 22.50, totalPrice: 1125.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 150, estimatedDelivery: '2-3 days', productStatus: 'Executed' },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 45, unitPrice: 15.80, totalPrice: 711.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 89, estimatedDelivery: '1-2 days', productStatus: 'Executed' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 40, unitPrice: 12.40, totalPrice: 496.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 250, estimatedDelivery: '1 day', productStatus: 'Rejected' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 35, unitPrice: 9.90, totalPrice: 346.50, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 200, estimatedDelivery: '2-3 days', productStatus: 'Executed' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 38, unitPrice: 18.70, totalPrice: 710.60, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 150, estimatedDelivery: '1-2 days', productStatus: 'Executed' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 32, unitPrice: 11.25, totalPrice: 360.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 200, estimatedDelivery: '1 day', productStatus: 'Rejected' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 30, unitPrice: 8.50, totalPrice: 255.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 500, estimatedDelivery: '2-3 days', productStatus: 'Executed' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 28, unitPrice: 14.20, totalPrice: 397.60, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 300, estimatedDelivery: '1-2 days', productStatus: 'Executed' },
    { id: 'P009', code: 'AMOX-009', name: 'AMOXICILLIN 875MG', quantity: 25, unitPrice: 25.80, totalPrice: 645.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 120, estimatedDelivery: '1 day', productStatus: 'Rejected' },
    { id: 'P010', code: 'ASPI-010', name: 'ASPIRIN 100MG', quantity: 22, unitPrice: 6.90, totalPrice: 151.80, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', warehouseId: 'MediSupply Italia | Warehouse Milano', warehouseName: 'MediSupply Italia | Warehouse Milano', stockAvailable: 400, estimatedDelivery: '2-3 days', productStatus: 'Executed' },
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 5, unitPrice: 22.50, totalPrice: 112.50, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 100, estimatedDelivery: '1 day', productStatus: 'Rejected' },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 3, unitPrice: 15.80, totalPrice: 47.40, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 100, estimatedDelivery: '1 day', productStatus: 'Executed' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 2, unitPrice: 12.40, totalPrice: 24.80, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 250, estimatedDelivery: '1 day', productStatus: 'Rejected' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 1, unitPrice: 9.90, totalPrice: 9.90, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 250, estimatedDelivery: '1 day', productStatus: 'Executed' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 1, unitPrice: 18.70, totalPrice: 18.70, supplierId: 'SUP-004', supplierName: 'BioMed Express', warehouseId: 'BioMed Express | Warehouse Bologna', warehouseName: 'BioMed Express | Warehouse Bologna', stockAvailable: 150, estimatedDelivery: '1 day', productStatus: 'Rejected' }
  ],
  'ODA-EXEC-002': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 35, unitPrice: 22.50, totalPrice: 787.50, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 89, estimatedDelivery: '1-2 days', productStatus: 'Executed' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 40, unitPrice: 12.40, totalPrice: 496.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 200, estimatedDelivery: '3-5 days', productStatus: 'Rejected' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 38, unitPrice: 9.90, totalPrice: 376.20, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 200, estimatedDelivery: '1-2 days', productStatus: 'Executed' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 32, unitPrice: 18.70, totalPrice: 598.40, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 150, estimatedDelivery: '3-5 days', productStatus: 'Executed' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 30, unitPrice: 11.25, totalPrice: 337.50, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 200, estimatedDelivery: '1-2 days', productStatus: 'Rejected' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 28, unitPrice: 8.50, totalPrice: 238.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 500, estimatedDelivery: '3-5 days', productStatus: 'Executed' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 25, unitPrice: 14.20, totalPrice: 355.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 300, estimatedDelivery: '1-2 days', productStatus: 'Executed' },
    { id: 'P009', code: 'AMOX-009', name: 'AMOXICILLIN 875MG', quantity: 20, unitPrice: 25.80, totalPrice: 516.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 120, estimatedDelivery: '3-5 days', productStatus: 'Rejected' },
    { id: 'P010', code: 'ASPI-010', name: 'ASPIRIN 100MG', quantity: 18, unitPrice: 6.90, totalPrice: 124.20, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', warehouseId: 'PharmaDistribution | Warehouse Roma', warehouseName: 'PharmaDistribution | Warehouse Roma', stockAvailable: 400, estimatedDelivery: '1-2 days', productStatus: 'Executed' },
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 2, unitPrice: 22.50, totalPrice: 45.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 50, estimatedDelivery: '3-5 days', productStatus: 'Rejected' },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 1, unitPrice: 15.80, totalPrice: 15.80, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', warehouseId: 'HealthCare Solutions | Warehouse Torino', warehouseName: 'HealthCare Solutions | Warehouse Torino', stockAvailable: 200, estimatedDelivery: '3-5 days', productStatus: 'Executed' }
  ]
};

// Additional information for each order
export const ORDER_ADDITIONAL_INFO: Record<string, OrderAdditionalInfo> = {
  // DRAFT orders
  'ODA-DRAFT-001': {
    deliveryAddress: 'Farmacia Central, Via Roma 123, Milano',
    paymentMethod: 'Credit Card',
    notes: 'Draft order - 75% complete. Reviewing final product quantities.'
  },
  'ODA-DRAFT-002': {
    deliveryAddress: 'Farmacia San Marco, Via Venezia 321, Milano',
    paymentMethod: 'Bank Transfer',
    notes: 'Draft order - 45% complete. Early stage order preparation.'
  },
  // PROCESSING orders
  'ODA-PROC-001': {
    deliveryAddress: 'Farmacia Central, Via Roma 123, Milano',
    paymentMethod: 'Bank Transfer',
    notes: 'Order confirmed and processing. Awaiting warehouse response.'
  },
  'ODA-PROC-002': {
    deliveryAddress: 'Farmacia Nord, Via Torino 456, Milano',
    paymentMethod: 'Credit Card',
    notes: 'Express order in processing. Priority handling requested.'
  },
  // PENDING APPROVAL orders
  'ODA-PEND-001': {
    deliveryAddress: 'Farmacia Central, Via Roma 123, Milano',
    paymentMethod: 'Bank Transfer',
    notes: 'Bulk order awaiting approval. Counter offer pending review.'
  },
  'ODA-PEND-002': {
    deliveryAddress: 'Farmacia San Marco, Via Venezia 321, Milano',
    paymentMethod: 'Credit Card',
    notes: 'Standard order awaiting approval. Picking notifications received.'
  },
  // PARTIALLY FILLED orders
  'ODA-PART-001': {
    deliveryAddress: 'Farmacia Central, Via Roma 123, Milano',
    paymentMethod: 'Bank Transfer',
    notes: 'Order partially filled. Some products confirmed, others pending warehouse response.'
  },
  'ODA-PART-002': {
    deliveryAddress: 'Farmacia Nord, Via Torino 456, Milano',
    paymentMethod: 'Credit Card',
    notes: 'Partial delivery confirmed. Remaining items in process.'
  },
  // EXECUTED orders
  'ODA-EXEC-001': {
    deliveryAddress: 'Farmacia Central, Via Roma 123, Milano',
    deliveryDate: 'May 14, 2025',
    paymentMethod: 'Bank Transfer',
    notes: 'Order executed successfully. All items delivered in good condition.'
  },
  'ODA-EXEC-002': {
    deliveryAddress: 'Farmacia San Marco, Via Venezia 321, Milano',
    deliveryDate: 'May 13, 2025',
    paymentMethod: 'Credit Card',
    notes: 'Express order executed. All products delivered on time.'
  }
};

// Mock orders data
// Mock buyer preferences
export const MOCK_BUYER_PREFERENCES: BuyerPickingPreferences = {
  autoAcceptPartialDelivery: false, // Default to requiring manual approval
  maxAcceptableReduction: 15, // Accept up to 15% reduction automatically
  requireConfirmationForAlternatives: true,
  notificationPreferences: {
    email: true,
    inApp: true,
    sms: false
  }
};

// Mock picking notifications
export const MOCK_PICKING_NOTIFICATIONS: PickingNotification[] = [
  {
    id: 'PN-001',
    orderId: 'ODA-PEND-002',
    productId: 'P001',
    type: 'partial_available',
    message: 'Only 18 units available out of 20 requested for ALVITA GINOCCHIERA. Estimated restock: May 20, 2025',
    createdAt: 'May 10, 2025 09:30',
    acknowledged: false,
    autoProcessed: false
  },
  {
    id: 'PN-002',
    orderId: 'ODA-PEND-002',
    productId: 'P003',
    type: 'out_of_stock',
    message: 'ZERODOL GEL is currently out of stock. Alternative product VOLTAREN GEL available at similar price.',
    createdAt: 'May 10, 2025 14:15',
    acknowledged: false,
    autoProcessed: false
  }
];

// Mock orders data - 2 orders per status (10 total)
export const MOCK_ORDERS: OrderWithDetails[] = [
  // DRAFT - 2 orders
  {
    id: 'ODA-DRAFT-001',
    createdOn: 'May 15, 2025',
    totalProducts: 5,
    items: 45,
    amount: 1250.50,
    status: 'Draft',
    completion: 75,
    priority: 'Medium',
    orderType: 'Standard',
    buyerId: 'BUY-001',
    buyerName: 'Farmacia Central'
  },
  {
    id: 'ODA-DRAFT-002',
    createdOn: 'May 14, 2025',
    totalProducts: 3,
    items: 28,
    amount: 890.30,
    status: 'Draft',
    completion: 45,
    priority: 'Low',
    orderType: 'Standard',
    buyerId: 'BUY-002',
    buyerName: 'Farmacia San Marco'
  },
  // PROCESSING - 2 orders
  {
    id: 'ODA-PROC-001',
    createdOn: 'May 13, 2025',
    totalProducts: 8,
    items: 120,
    amount: 3450.80,
    status: 'Processing',
    estimatedDelivery: 'May 25, 2025',
    suppliers: [MOCK_SUPPLIERS[0], MOCK_SUPPLIERS[1]],
    priority: 'Medium',
    orderType: 'Standard',
    buyerId: 'BUY-001',
    buyerName: 'Farmacia Central'
  },
  {
    id: 'ODA-PROC-002',
    createdOn: 'May 12, 2025',
    totalProducts: 6,
    items: 95,
    amount: 2780.40,
    status: 'Processing',
    estimatedDelivery: 'May 24, 2025',
    suppliers: [MOCK_SUPPLIERS[2]],
    priority: 'High',
    orderType: 'Express',
    buyerId: 'BUY-003',
    buyerName: 'Farmacia Nord'
  },
  // PENDING APPROVAL - 2 orders
  {
    id: 'ODA-PEND-001',
    createdOn: 'May 11, 2025',
    totalProducts: 10,
    items: 180,
    amount: 5670.90,
    status: 'Pending Approval',
    estimatedDelivery: 'Awaiting approval',
    suppliers: [MOCK_SUPPLIERS[0], MOCK_SUPPLIERS[3]],
    priority: 'High',
    orderType: 'Bulk',
    buyerId: 'BUY-001',
    buyerName: 'Farmacia Central',
    counterOffer: MOCK_COUNTER_OFFERS['ODA-2590']
  },
  {
    id: 'ODA-PEND-002',
    createdOn: 'May 10, 2025',
    totalProducts: 7,
    items: 145,
    amount: 4120.60,
    status: 'Pending Approval',
    estimatedDelivery: 'Awaiting approval',
    suppliers: [MOCK_SUPPLIERS[1], MOCK_SUPPLIERS[2]],
    priority: 'Medium',
    orderType: 'Standard',
    buyerId: 'BUY-002',
    buyerName: 'Farmacia San Marco',
    pickingRequired: true,
    buyerPreferences: MOCK_BUYER_PREFERENCES,
    pickingNotifications: [MOCK_PICKING_NOTIFICATIONS[0]],
    hasPartialPickingApproval: false
  },
  // PARTIALLY FILLED - 2 orders
  {
    id: 'ODA-PART-001',
    createdOn: 'May 9, 2025',
    totalProducts: 12,
    items: 250,
    amount: 7890.20,
    status: 'Partially Filled',
    estimatedDelivery: 'May 22, 2025',
    suppliers: [MOCK_SUPPLIERS[0], MOCK_SUPPLIERS[1], MOCK_SUPPLIERS[2]],
    priority: 'High',
    orderType: 'Bulk',
    buyerId: 'BUY-001',
    buyerName: 'Farmacia Central',
    hasPartialPickingApproval: true
  },
  {
    id: 'ODA-PART-002',
    createdOn: 'May 8, 2025',
    totalProducts: 9,
    items: 195,
    amount: 6230.70,
    status: 'Partially Filled',
    estimatedDelivery: 'May 21, 2025',
    suppliers: [MOCK_SUPPLIERS[2], MOCK_SUPPLIERS[3]],
    priority: 'Medium',
    orderType: 'Standard',
    buyerId: 'BUY-003',
    buyerName: 'Farmacia Nord',
    hasPartialPickingApproval: true
  },
  // EXECUTED - 2 orders
  {
    id: 'ODA-EXEC-001',
    createdOn: 'May 7, 2025',
    totalProducts: 15,
    items: 320,
    amount: 12450.80,
    status: 'Executed',
    deliveryStatus: 'Delivered',
    deliveryDate: 'May 14, 2025',
    suppliers: [MOCK_SUPPLIERS[0], MOCK_SUPPLIERS[1], MOCK_SUPPLIERS[3]],
    priority: 'Medium',
    orderType: 'Standard',
    buyerId: 'BUY-001',
    buyerName: 'Farmacia Central'
  },
  {
    id: 'ODA-EXEC-002',
    createdOn: 'May 6, 2025',
    totalProducts: 11,
    items: 275,
    amount: 9870.40,
    status: 'Executed',
    deliveryStatus: 'Delivered',
    deliveryDate: 'May 13, 2025',
    suppliers: [MOCK_SUPPLIERS[1], MOCK_SUPPLIERS[2]],
    priority: 'High',
    orderType: 'Express',
    buyerId: 'BUY-002',
    buyerName: 'Farmacia San Marco'
  }
];

// Function to get order details for display in modal
// Helper function to enrich product with missing data
const enrichProductData = (product: OrderProductDetail): OrderProductDetail => {
  // If product already has all required fields, return as is
  if (product.publicPrice && product.vat && product.bestPrices) {
    return product;
  }
  
  // Enrich with default/mock data based on product code or name
  const defaultPublicPrice = product.publicPrice || product.unitPrice * 1.25; // ~25% markup
  const defaultVat = product.vat || 22;
  
  // Create bestPrices if not present
  const defaultBestPrices = product.bestPrices || [
    {
      price: product.unitPrice,
      stock: product.stockAvailable || 100,
      supplier: product.supplierName || 'Unknown Supplier',
      warehouse: product.warehouseName?.split(' | ')[1] || 'Default Warehouse',
      entityName: product.warehouseName?.split(' | ')[0] || product.supplierName || 'Unknown Entity'
    }
  ];
  
  // Calculate average price if not present
  let defaultAveragePrice = product.averagePrice;
  if (defaultAveragePrice === null || defaultAveragePrice === undefined) {
    if (product.quantity > 0 && defaultBestPrices.length > 0) {
      // Simple average calculation
      const sortedPrices = [...defaultBestPrices].sort((a, b) => a.price - b.price);
      let remainingQuantity = product.quantity;
      let totalCost = 0;
      
      for (const pricePoint of sortedPrices) {
        if (remainingQuantity <= 0) break;
        const quantityFromThisSupplier = Math.min(remainingQuantity, pricePoint.stock);
        totalCost += quantityFromThisSupplier * pricePoint.price;
        remainingQuantity -= quantityFromThisSupplier;
      }
      
      if (remainingQuantity > 0) {
        totalCost += remainingQuantity * defaultPublicPrice;
      }
      
      defaultAveragePrice = totalCost / product.quantity;
    } else {
      defaultAveragePrice = product.unitPrice;
    }
  }
  
  return {
    ...product,
    publicPrice: defaultPublicPrice,
    vat: defaultVat,
    bestPrices: defaultBestPrices,
    averagePrice: defaultAveragePrice,
    ean: product.ean || `800${product.code.replace(/\D/g, '').padStart(10, '0')}`,
    minsan: product.minsan || product.code,
    manufacturer: product.manufacturer || 'Unknown Manufacturer',
    targetPrice: product.targetPrice !== undefined ? product.targetPrice : null
  };
};

export const getOrderDetails = (orderId: string): OrderDetailData | null => {
  const order = MOCK_ORDERS.find(o => o.id === orderId);
  const products = ORDER_DETAILS[orderId] || [];
  const additionalInfo = ORDER_ADDITIONAL_INFO[orderId] || {};
  
  if (!order) {
    return null;
  }
  
  // Enrich products with missing data
  const enrichedProducts = products.map(enrichProductData);
  
  return {
    id: order.id,
    createdOn: order.createdOn,
    status: order.status,
    products: enrichedProducts,
    deliveryAddress: additionalInfo.deliveryAddress || '',
    deliveryDate: additionalInfo.deliveryDate || order.deliveryDate || order.estimatedDelivery || '',
    paymentMethod: additionalInfo.paymentMethod || '',
    notes: additionalInfo.notes || '',
    totalAmount: order.amount,
    totalProducts: order.items,
    suppliers: order.suppliers || [],
    counterOffer: order.counterOffer,
    priority: order.priority,
    orderType: order.orderType,
    buyerId: order.buyerId,
    buyerName: order.buyerName
  };
};

// Function to get supplier by ID
export const getSupplierById = (supplierId: string): SupplierInfo | null => {
  return MOCK_SUPPLIERS.find(supplier => supplier.id === supplierId) || null;
};

// Function to accept counter offer
export const acceptCounterOffer = (orderId: string): boolean => {
  const orderIndex = MOCK_ORDERS.findIndex(order => order.id === orderId);
  if (orderIndex !== -1 && MOCK_ORDERS[orderIndex].counterOffer) {
    // Counter offers are handled internally, status remains as Pending Approval
    // The backend will update status when warehouse responds
    MOCK_ORDERS[orderIndex].amount = MOCK_ORDERS[orderIndex].counterOffer!.proposedAmount;
    if (MOCK_ORDERS[orderIndex].counterOffer) {
      MOCK_ORDERS[orderIndex].counterOffer!.status = 'Accepted';
    }
    return true;
  }
  return false;
};

// Function to reject counter offer
export const rejectCounterOffer = (orderId: string): boolean => {
  const orderIndex = MOCK_ORDERS.findIndex(order => order.id === orderId);
  if (orderIndex !== -1 && MOCK_ORDERS[orderIndex].counterOffer) {
    // Rejection doesn't change order status, it remains in current state
    // The backend will handle status updates when warehouse responds
    if (MOCK_ORDERS[orderIndex].counterOffer) {
      MOCK_ORDERS[orderIndex].counterOffer!.status = 'Rejected';
    }
    return true;
  }
  return false;
};

// Function to generate more orders (similar to generateMockProducts in mockProducts.ts)
export const generateMockOrders = (count: number = 20): OrderWithDetails[] => {
  const orders: OrderWithDetails[] = [...MOCK_ORDERS]; // Start with existing orders
  
  if (count <= orders.length) {
    return orders.slice(0, count);
  }
  
  // Statuses for new orders
  const statuses: OrderStatus[] = [
    'Draft', 'Processing', 'Pending Approval', 'Partially Filled', 'Executed'
  ];
  
  // Generate additional orders
  for (let i = orders.length; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const totalProducts = Math.floor(Math.random() * 250) + 100; // More products (100-350)
    const items = totalProducts * (Math.floor(Math.random() * 10) + 5); // More items (5-15x products)
    // Generate amounts between 50,000 and 250,000
    const amount = +(Math.random() * 200000 + 50000).toFixed(2);
    
    // Create a date in the past
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    const createdOn = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    let newOrder: OrderWithDetails = {
      id: `ODA-${2588 + i}`,
      createdOn,
      totalProducts,
      items,
      amount,
      status
    };
    
    // Add status-specific fields
    if (status === 'Executed') {
      const deliveryDate = new Date(date);
      deliveryDate.setDate(date.getDate() + Math.floor(Math.random() * 14) + 1);
      newOrder.deliveryStatus = Math.random() > 0.5 ? 'Delivered' : 'In Transit';
      newOrder.deliveryDate = deliveryDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } else if (status === 'Partially Filled') {
      const estimatedDate = new Date(date);
      estimatedDate.setDate(date.getDate() + Math.floor(Math.random() * 14) + 7);
      newOrder.estimatedDelivery = estimatedDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } else if (status === 'Processing') {
      const estimatedDate = new Date(date);
      estimatedDate.setDate(date.getDate() + Math.floor(Math.random() * 14) + 7);
      newOrder.estimatedDelivery = estimatedDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } else if (status === 'Pending Approval') {
      newOrder.estimatedDelivery = 'Awaiting approval';
    } else if (status === 'Draft') {
      newOrder.completion = Math.floor(Math.random() * 91) + 10; // 10-100%
    }
    
    orders.push(newOrder);
  }
  
  return orders;
};

// Enhanced mock orders with picking scenarios (deprecated - using MOCK_ORDERS instead)
const ENHANCED_PICKING_ORDERS: OrderWithDetails[] = [
  {
    id: 'ODA-2593',
    createdOn: 'May 12, 2025',
    status: 'Pending Approval',
    totalProducts: 3,
    items: 150,
    amount: 3875.00,
    buyerId: 'BUY-001',
    buyerName: 'Farmacia Central',
    pickingRequired: true,
    buyerPreferences: MOCK_BUYER_PREFERENCES,
    pickingNotifications: [MOCK_PICKING_NOTIFICATIONS[0]],
    hasPartialPickingApproval: false,
    priority: 'Medium',
    orderType: 'Standard',
    suppliers: [MOCK_SUPPLIERS[0], MOCK_SUPPLIERS[1]]
  },
  {
    id: 'ODA-2594',
    createdOn: 'May 12, 2025',
    status: 'Pending Approval',
    totalProducts: 4,
    items: 220,
    amount: 4250.00,
    buyerId: 'BUY-002',
    buyerName: 'Farmacia San Marco',
    pickingRequired: true,
    buyerPreferences: {
      ...MOCK_BUYER_PREFERENCES,
      autoAcceptPartialDelivery: true,
      maxAcceptableReduction: 25
    },
    pickingNotifications: [MOCK_PICKING_NOTIFICATIONS[1]],
    hasPartialPickingApproval: false,
    priority: 'High',
    orderType: 'Express',
    counterOffer: {
      id: 'CO-003',
      originalAmount: 4250.00,
      proposedAmount: 3950.00,
      message: 'Adjusted quantities based on current stock availability. Alternative products included with better pricing.',
      createdDate: 'May 12, 2025',
      expiryDate: 'May 19, 2025',
      status: 'Pending',
      adminId: 'ADM-001',
      adminName: 'Marco Rossi',
      requiresPickingApproval: true,
      pickingChanges: [
        {
          id: 'PD-001',
          originalQuantity: 100,
          availableQuantity: 65,
          allocatedQuantity: 65,
          reason: 'Current stock limitation - high demand product',
          alternativeProducts: [
            {
              productId: 'P003-ALT',
              productName: 'VOLTAREN GEL 50g (Alternative)',
              quantity: 35,
              unitPrice: 11.80
            }
          ],
          estimatedRestockDate: 'May 22, 2025',
          supplierComment: 'Premium alternative available with similar efficacy'
        }
      ]
    },
    suppliers: [MOCK_SUPPLIERS[2]]
  }
];

// Generate standard mock orders and combine with enhanced picking orders
// Export only the fixed mock orders (10 orders - 2 per status)
// No randomly generated orders
export const mockOrders: OrderWithDetails[] = MOCK_ORDERS;

// Functions for managing picking and preferences
export const updateBuyerPreferences = (buyerId: string, preferences: BuyerPickingPreferences): boolean => {
  // In a real app, this would update the database
  return true;
};

export const processPickingDecision = (orderId: string, decision: 'accept' | 'reject' | 'request_alternatives'): boolean => {
  // In a real app, this would update the order status and notify suppliers
  const orderIndex = mockOrders.findIndex(order => order.id === orderId);
  if (orderIndex !== -1) {
    if (decision === 'accept') {
      mockOrders[orderIndex].status = 'Partially Filled';
      mockOrders[orderIndex].hasPartialPickingApproval = true;
    } else if (decision === 'reject') {
      // Rejection doesn't change order status, order remains in current state
      // Status will be updated by backend when warehouse responds
    }
    return true;
  }
  return false;
};

export const acknowledgePickingNotification = (notificationId: string): boolean => {
  // Mark notification as acknowledged
  const notification = MOCK_PICKING_NOTIFICATIONS.find(n => n.id === notificationId);
  if (notification) {
    notification.acknowledged = true;
    return true;
  }
  return false;
}; 