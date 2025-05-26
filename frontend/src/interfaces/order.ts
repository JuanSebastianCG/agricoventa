export interface IOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productImage?: string;
}

export interface IOrder {
  id: string;
  orderNumber: string;
  buyerUserId: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  shippingMethod?: string;
  trackingNumber?: string;
  items: IOrderItem[];
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderFilters {
  buyerUserId?: string;
  sellerId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fromDate?: string;
  toDate?: string;
}

export interface CreateOrderPayload {
  cartItems: { productId: string; quantity: number }[];
  paymentMethod: string;
  shippingMethod: string;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingNumber?: string;
}

export interface CancelOrderPayload {
  cancellationReason: string;
} 