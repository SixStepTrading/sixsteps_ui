export interface PriceBreakdown {
  quantity: number;
  unitPrice: number;
  supplier: string;
  stock: number;
  warehouse?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  code: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  averagePrice?: number;
  priceBreakdowns?: PriceBreakdown[];
} 