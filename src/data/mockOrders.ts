import { v4 as uuidv4 } from 'uuid';

// Definizione dei tipi di dato
export type OrderStatus = 'Draft' | 'Pending Approval' | 'Processing' | 'Approved' | 'Rejected' | 'Counter Offer';

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

// Interface for counter offer details
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
}

// Interface for order product details with supplier info
export interface OrderProductDetail {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplierId?: string;
  supplierName?: string;
  stockAvailable?: number;
  estimatedDelivery?: string;
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
  'ODA-2590': {
    id: 'CO-001',
    originalAmount: 95000.00,
    proposedAmount: 89500.00,
    message: 'We can offer a 6% discount for bulk purchase. This includes free express delivery and extended payment terms. Some quantities adjusted based on current stock availability.',
    createdDate: 'May 10, 2025',
    expiryDate: 'May 17, 2025',
    status: 'Pending',
    adminId: 'ADM-001',
    adminName: 'Marco Rossi',
    productChanges: [
      {
        productId: 'P001',
        originalQuantity: 50,
        proposedQuantity: 45,
        originalUnitPrice: 22.50,
        proposedUnitPrice: 21.00,
        originalTotalPrice: 1125.00,
        proposedTotalPrice: 945.00,
        reason: 'Limited stock, better unit price offered'
      },
      {
        productId: 'P007',
        originalQuantity: 200,
        proposedQuantity: 200,
        originalUnitPrice: 8.50,
        proposedUnitPrice: 7.90,
        originalTotalPrice: 1700.00,
        proposedTotalPrice: 1580.00,
        reason: 'Bulk discount applied'
      }
    ]
  },
  'ODA-2591': {
    id: 'CO-002',
    originalAmount: 156000.00,
    proposedAmount: 148200.00,
    message: 'Special pricing available for loyal customers. Includes priority handling and dedicated support. Express delivery quantities optimized.',
    createdDate: 'May 9, 2025',
    expiryDate: 'May 16, 2025',
    status: 'Pending',
    adminId: 'ADM-002',
    adminName: 'Laura Bianchi',
    productChanges: [
      {
        productId: 'P002',
        originalQuantity: 80,
        proposedQuantity: 75,
        originalUnitPrice: 15.80,
        proposedUnitPrice: 15.20,
        originalTotalPrice: 1264.00,
        proposedTotalPrice: 1140.00,
        reason: 'Express delivery optimization'
      },
      {
        productId: 'P010',
        originalQuantity: 300,
        proposedQuantity: 320,
        originalUnitPrice: 6.90,
        proposedUnitPrice: 6.50,
        originalTotalPrice: 2070.00,
        proposedTotalPrice: 2080.00,
        reason: 'Better availability, volume discount'
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
export const ORDER_DETAILS: Record<string, OrderProductDetail[]> = {
  'ODA-2587': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 10, unitPrice: 22.50, totalPrice: 225.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 150, estimatedDelivery: '2-3 days' },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 15, unitPrice: 15.80, totalPrice: 237.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 89, estimatedDelivery: '1-2 days' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 25, unitPrice: 9.90, totalPrice: 247.50, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 200, estimatedDelivery: '2-3 days' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 45, unitPrice: 11.90, totalPrice: 535.50, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', stockAvailable: 67, estimatedDelivery: '3-5 days' }
  ],
  'ODA-2590': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 50, unitPrice: 22.50, totalPrice: 1125.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 150, estimatedDelivery: '2-3 days' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 200, unitPrice: 8.50, totalPrice: 1700.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 500, estimatedDelivery: '2-3 days' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 150, unitPrice: 14.20, totalPrice: 2130.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 300, estimatedDelivery: '2-3 days' },
    { id: 'P009', code: 'AMOX-009', name: 'AMOXICILLIN 875MG', quantity: 100, unitPrice: 25.80, totalPrice: 2580.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 120, estimatedDelivery: '2-3 days' }
  ],
  'ODA-2591': [
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 80, unitPrice: 15.80, totalPrice: 1264.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 89, estimatedDelivery: '1-2 days' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 120, unitPrice: 12.40, totalPrice: 1488.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', stockAvailable: 200, estimatedDelivery: '3-5 days' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 60, unitPrice: 18.70, totalPrice: 1122.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 150, estimatedDelivery: '1-2 days' },
    { id: 'P010', code: 'ASPI-010', name: 'ASPIRIN 100MG', quantity: 300, unitPrice: 6.90, totalPrice: 2070.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', stockAvailable: 400, estimatedDelivery: '3-5 days' }
  ],
  'ODA-2586': [
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 20, unitPrice: 12.40, totalPrice: 248.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 200, estimatedDelivery: '1-2 days' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 32, unitPrice: 18.70, totalPrice: 598.40, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 150, estimatedDelivery: '1-2 days' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 100, unitPrice: 8.50, totalPrice: 850.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 500, estimatedDelivery: '1-2 days' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 75, unitPrice: 14.20, totalPrice: 1065.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 300, estimatedDelivery: '1-2 days' }
  ],
  'ODA-2585': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 15, unitPrice: 22.50, totalPrice: 337.50, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', stockAvailable: 50, estimatedDelivery: '3-5 days' },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 25, unitPrice: 15.80, totalPrice: 395.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', stockAvailable: 100, estimatedDelivery: '1 day' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 30, unitPrice: 12.40, totalPrice: 372.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', stockAvailable: 200, estimatedDelivery: '3-5 days' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 40, unitPrice: 9.90, totalPrice: 396.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', stockAvailable: 250, estimatedDelivery: '1 day' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 12, unitPrice: 18.70, totalPrice: 224.40, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', stockAvailable: 150, estimatedDelivery: '3-5 days' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 15, unitPrice: 11.25, totalPrice: 168.75, supplierId: 'SUP-004', supplierName: 'BioMed Express', stockAvailable: 200, estimatedDelivery: '1 day' }
  ],
  'ODA-2584-DRAFT': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 5, unitPrice: 22.50, totalPrice: 112.50, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 150, estimatedDelivery: '2-3 days' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 10, unitPrice: 12.40, totalPrice: 124.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 200, estimatedDelivery: '1-2 days' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 8, unitPrice: 11.25, totalPrice: 90.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', stockAvailable: 200, estimatedDelivery: '3-5 days' }
  ],
  'ODA-2583-DRAFT': [
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 50, unitPrice: 8.50, totalPrice: 425.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 500, estimatedDelivery: '2-3 days' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 30, unitPrice: 14.20, totalPrice: 426.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 300, estimatedDelivery: '1-2 days' },
    { id: 'P010', code: 'ASPI-010', name: 'ASPIRIN 100MG', quantity: 100, unitPrice: 6.90, totalPrice: 690.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', stockAvailable: 400, estimatedDelivery: '3-5 days' }
  ],
  // Complex order with multiple suppliers for same products
  'ODA-2592': [
    { id: 'P007-A', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 150, unitPrice: 8.50, totalPrice: 1275.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 200, estimatedDelivery: '2-3 days' },
    { id: 'P007-B', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 100, unitPrice: 8.30, totalPrice: 830.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 300, estimatedDelivery: '1-2 days' },
    { id: 'P008-A', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 80, unitPrice: 14.20, totalPrice: 1136.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 150, estimatedDelivery: '1-2 days' },
    { id: 'P008-B', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 70, unitPrice: 13.90, totalPrice: 973.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', stockAvailable: 200, estimatedDelivery: '1 day' },
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 25, unitPrice: 22.50, totalPrice: 562.50, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 150, estimatedDelivery: '2-3 days' }
  ],
  // Large order with all suppliers
  'ODA-2593': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 30, unitPrice: 22.50, totalPrice: 675.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 150, estimatedDelivery: '2-3 days' },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 40, unitPrice: 15.80, totalPrice: 632.00, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 89, estimatedDelivery: '1-2 days' },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 50, unitPrice: 12.40, totalPrice: 620.00, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', stockAvailable: 200, estimatedDelivery: '3-5 days' },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 60, unitPrice: 9.90, totalPrice: 594.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', stockAvailable: 250, estimatedDelivery: '1 day' },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 35, unitPrice: 18.70, totalPrice: 654.50, supplierId: 'SUP-002', supplierName: 'PharmaDistribution', stockAvailable: 150, estimatedDelivery: '1-2 days' },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 45, unitPrice: 11.25, totalPrice: 506.25, supplierId: 'SUP-003', supplierName: 'HealthCare Solutions', stockAvailable: 200, estimatedDelivery: '3-5 days' },
    { id: 'P007', code: 'PARA-007', name: 'PARACETAMOL 500MG', quantity: 80, unitPrice: 8.50, totalPrice: 680.00, supplierId: 'SUP-001', supplierName: 'MediSupply Italia', stockAvailable: 500, estimatedDelivery: '2-3 days' },
    { id: 'P008', code: 'IBUP-008', name: 'IBUPROFEN 400MG', quantity: 55, unitPrice: 14.20, totalPrice: 781.00, supplierId: 'SUP-004', supplierName: 'BioMed Express', stockAvailable: 300, estimatedDelivery: '1 day' }
  ]
};

// Additional information for each order
export const ORDER_ADDITIONAL_INFO: Record<string, OrderAdditionalInfo> = {
  'ODA-2587': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    deliveryDate: 'May 15, 2025',
    paymentMethod: 'Bank Transfer',
    notes: 'Delivered successfully. All items received in good condition.'
  },
  'ODA-2590': {
    deliveryAddress: 'Pharmacy Central Warehouse, Via Torino 456, Milano',
    paymentMethod: 'Bank Transfer',
    notes: 'Bulk order for Q2 inventory. Counter offer pending review.'
  },
  'ODA-2591': {
    deliveryAddress: 'Pharmacy Express Hub, Via Napoli 789, Milano',
    paymentMethod: 'Credit Card',
    notes: 'Express delivery required. Multiple suppliers involved.'
  },
  'ODA-2586': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    paymentMethod: 'Credit Card',
    notes: 'Standard order awaiting approval from management.'
  },
  'ODA-2585': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    deliveryDate: 'May 20, 2025',
    paymentMethod: 'Bank Transfer',
    notes: 'Deliver during business hours (9AM-6PM). Call before delivery. Multiple suppliers coordinated.'
  },
  'ODA-2584-DRAFT': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    paymentMethod: 'Credit Card',
    notes: 'Draft order - 60% complete. Missing some product specifications.'
  },
  'ODA-2583-DRAFT': {
    deliveryAddress: 'Pharmacy Secondary Location, Via Venezia 321, Milano',
    paymentMethod: 'Bank Transfer',
    notes: 'Draft order - early stage. Basic pain relief medications for secondary location.'
  },
  'ODA-2592': {
    deliveryAddress: 'Pharmacy Distribution Center, Via Firenze 555, Milano',
    paymentMethod: 'Bank Transfer',
    notes: 'Complex order with multiple suppliers for same products. Price comparison completed.'
  },
  'ODA-2593': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    paymentMethod: 'Credit Card',
    notes: 'Large comprehensive order involving all suppliers. Coordinated delivery required.'
  }
};

// Mock orders data
export const MOCK_ORDERS: OrderWithDetails[] = [
  {
    id: 'ODA-2587',
    createdOn: 'May 8, 2025',
    totalProducts: 128,
    items: 895,
    amount: 124580.80,
    status: 'Approved',
    deliveryStatus: 'Delivered',
    deliveryDate: 'May 15, 2025',
    suppliers: [MOCK_SUPPLIERS[0], MOCK_SUPPLIERS[1]],
    priority: 'Medium',
    orderType: 'Standard'
  },
  {
    id: 'ODA-2590',
    createdOn: 'May 10, 2025',
    totalProducts: 95,
    items: 650,
    amount: 95000.00,
    status: 'Counter Offer',
    estimatedDelivery: 'Pending response',
    counterOffer: MOCK_COUNTER_OFFERS['ODA-2590'],
    suppliers: [MOCK_SUPPLIERS[0]],
    priority: 'High',
    orderType: 'Bulk'
  },
  {
    id: 'ODA-2591',
    createdOn: 'May 9, 2025',
    totalProducts: 156,
    items: 1200,
    amount: 156000.00,
    status: 'Counter Offer',
    estimatedDelivery: 'Pending response',
    counterOffer: MOCK_COUNTER_OFFERS['ODA-2591'],
    suppliers: [MOCK_SUPPLIERS[1], MOCK_SUPPLIERS[2]],
    priority: 'High',
    orderType: 'Express'
  },
  {
    id: 'ODA-2586',
    createdOn: 'May 7, 2025',
    totalProducts: 215,
    items: 1452,
    amount: 184550.50,
    status: 'Pending Approval',
    estimatedDelivery: 'Awaiting approval',
    suppliers: [MOCK_SUPPLIERS[1]],
    priority: 'Medium',
    orderType: 'Standard'
  },
  {
    id: 'ODA-2585',
    createdOn: 'May 6, 2025',
    totalProducts: 142,
    items: 1037,
    amount: 189230.30,
    status: 'Processing',
    estimatedDelivery: 'May 20, 2025',
    suppliers: [MOCK_SUPPLIERS[2], MOCK_SUPPLIERS[3]],
    priority: 'Low',
    orderType: 'Standard'
  },
  {
    id: 'ODA-2584-DRAFT',
    createdOn: 'May 5, 2025',
    totalProducts: 108,
    items: 722,
    amount: 132075.75,
    status: 'Draft',
    completion: 60,
    priority: 'Medium',
    orderType: 'Standard'
  },
  {
    id: 'ODA-2583-DRAFT',
    createdOn: 'May 3, 2025',
    totalProducts: 90,
    items: 490,
    amount: 100000.00,
    status: 'Draft',
    completion: 10,
    priority: 'Low',
    orderType: 'Standard'
  },
  {
    id: 'ODA-2592',
    createdOn: 'May 11, 2025',
    totalProducts: 325,
    items: 425,
    amount: 4776.50,
    status: 'Pending Approval',
    estimatedDelivery: 'Awaiting approval',
    suppliers: [MOCK_SUPPLIERS[0], MOCK_SUPPLIERS[1], MOCK_SUPPLIERS[3]],
    priority: 'High',
    orderType: 'Bulk'
  },
  {
    id: 'ODA-2593',
    createdOn: 'May 12, 2025',
    totalProducts: 395,
    items: 395,
    amount: 5142.75,
    status: 'Processing',
    estimatedDelivery: 'May 25, 2025',
    suppliers: [MOCK_SUPPLIERS[0], MOCK_SUPPLIERS[1], MOCK_SUPPLIERS[2], MOCK_SUPPLIERS[3]],
    priority: 'Medium',
    orderType: 'Standard'
  }
];

// Function to get order details for display in modal
export const getOrderDetails = (orderId: string): OrderDetailData | null => {
  const order = MOCK_ORDERS.find(o => o.id === orderId);
  const products = ORDER_DETAILS[orderId] || [];
  const additionalInfo = ORDER_ADDITIONAL_INFO[orderId] || {};
  
  if (!order) {
    return null;
  }
  
  return {
    id: order.id,
    createdOn: order.createdOn,
    status: order.status,
    products,
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
    MOCK_ORDERS[orderIndex].status = 'Approved';
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
    MOCK_ORDERS[orderIndex].status = 'Rejected';
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
    'Approved', 'Pending Approval', 'Processing', 'Draft'
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
    if (status === 'Approved') {
      const deliveryDate = new Date(date);
      deliveryDate.setDate(date.getDate() + Math.floor(Math.random() * 14) + 1);
      newOrder.deliveryStatus = Math.random() > 0.5 ? 'Delivered' : 'In Transit';
      newOrder.deliveryDate = deliveryDate.toLocaleDateString('en-US', { 
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

// Export generated orders with more variety
export const mockOrders = generateMockOrders(20); 