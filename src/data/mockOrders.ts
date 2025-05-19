import { v4 as uuidv4 } from 'uuid';

// Definizione dei tipi di dato
export type OrderStatus = 'Draft' | 'Pending Approval' | 'Processing' | 'Approved' | 'Rejected' | 'Counter Offer Sent';

// Interface for order product details
export interface OrderProductDetail {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  counterOffer?: {
    amount: number;
    message: string;
    date: string;
  }
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
}

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
  }
];

// Detailed product data for each order
export const ORDER_DETAILS: Record<string, OrderProductDetail[]> = {
  'ODA-2587': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 10, unitPrice: 22.50, totalPrice: 225.00 },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 15, unitPrice: 15.80, totalPrice: 237.00 },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 25, unitPrice: 9.90, totalPrice: 247.50 },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 45, unitPrice: 11.90, totalPrice: 535.50 }
  ],
  'ODA-2586': [
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 20, unitPrice: 12.40, totalPrice: 248.00 },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 32, unitPrice: 18.70, totalPrice: 598.40 }
  ],
  'ODA-2585': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 15, unitPrice: 22.50, totalPrice: 337.50 },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 25, unitPrice: 15.80, totalPrice: 395.00 },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 30, unitPrice: 12.40, totalPrice: 372.00 },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 40, unitPrice: 9.90, totalPrice: 396.00 },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 12, unitPrice: 18.70, totalPrice: 224.40 },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 15, unitPrice: 11.25, totalPrice: 168.75 }
  ],
  'ODA-2584-DRAFT': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 5, unitPrice: 22.50, totalPrice: 112.50 },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 10, unitPrice: 12.40, totalPrice: 124.00 },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 7.50, unitPrice: 11.25, totalPrice: 84.38 }
  ],
  'ODA-2583-DRAFT': []
};

// Additional information for each order
export const ORDER_ADDITIONAL_INFO: Record<string, OrderAdditionalInfo> = {
  'ODA-2587': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    deliveryDate: 'May 15, 2025',
    paymentMethod: 'Bank Transfer',
  },
  'ODA-2586': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    paymentMethod: 'Credit Card',
  },
  'ODA-2585': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    deliveryDate: 'May 20, 2025',
    paymentMethod: 'Bank Transfer',
    notes: 'Deliver during business hours (9AM-6PM). Call before delivery.'
  },
  'ODA-2584-DRAFT': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    paymentMethod: 'Credit Card',
  },
  'ODA-2583-DRAFT': {}
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
    deliveryDate: 'May 15, 2025'
  },
  {
    id: 'ODA-2586',
    createdOn: 'May 7, 2025',
    totalProducts: 215,
    items: 1452,
    amount: 184550.50,
    status: 'Pending Approval',
    estimatedDelivery: 'Awaiting approval'
  },
  {
    id: 'ODA-2585',
    createdOn: 'May 6, 2025',
    totalProducts: 142,
    items: 1037,
    amount: 189230.30,
    status: 'Processing',
    estimatedDelivery: 'May 20, 2025'
  },
  {
    id: 'ODA-2584-DRAFT',
    createdOn: 'May 5, 2025',
    totalProducts: 108,
    items: 722,
    amount: 132075.75,
    status: 'Draft',
    completion: 60
  },
  {
    id: 'ODA-2583-DRAFT',
    createdOn: 'May 3, 2025',
    totalProducts: 90,
    items: 490,
    amount: 100000.00,
    status: 'Draft',
    completion: 10
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
    totalProducts: order.items
  };
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