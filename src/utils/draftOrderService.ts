import { ProductItem } from '../components/common/molecules/OrderConfirmationModal';

export interface DraftOrder {
  id: string;
  items: {
    product: {
      id: string;
      name: string;
      code: string;
      supplier: string;
      price: number;
    };
    quantity: number;
    selected: boolean;
  }[];
  totalAmount: number;
  timestamp: string;
  name?: string;
}

const STORAGE_KEY = 'sixsteps_draft_orders';

// Get all draft orders
export const getDraftOrders = (): DraftOrder[] => {
  try {
    const ordersJson = localStorage.getItem(STORAGE_KEY);
    if (!ordersJson) return [];
    return JSON.parse(ordersJson);
  } catch (error) {
    return [];
  }
};

// Save a draft order
export const saveDraftOrder = (draft: Omit<DraftOrder, 'id'>): DraftOrder => {
  try {
    const orders = getDraftOrders();
    const newDraft: DraftOrder = {
      ...draft,
      id: `draft-${Date.now()}`
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newDraft, ...orders]));
    return newDraft;
  } catch (error) {
    throw new Error('Could not save draft order');
  }
};

// Delete a draft order
export const deleteDraftOrder = (id: string): boolean => {
  try {
    const orders = getDraftOrders();
    const updatedOrders = orders.filter(order => order.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    return true;
  } catch (error) {
    return false;
  }
};

// Get a draft order by ID
export const getDraftOrderById = (id: string): DraftOrder | null => {
  try {
    const orders = getDraftOrders();
    const order = orders.find(order => order.id === id);
    return order || null;
  } catch (error) {
    return null;
  }
};

// Convert a draft order to the format expected by the OrderConfirmationModal
export const draftToModalProducts = (draft: DraftOrder): ProductItem[] => {
  return draft.items
    .filter(item => item.selected)
    .map(item => ({
      id: item.product.id,
      name: item.product.name,
      code: item.product.code,
      supplier: item.product.supplier,
      quantity: item.quantity,
      unitPrice: item.product.price
    }));
};

export default {
  getDraftOrders,
  saveDraftOrder,
  deleteDraftOrder,
  getDraftOrderById,
  draftToModalProducts
}; 