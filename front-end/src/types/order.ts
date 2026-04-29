export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'stripe' | 'cod' | 'jazzcash';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface CartItem {
  productId: number;
  variantId: number;
  name: string;
  slug: string;
  image: string;
  price: number;
  salePrice: number | null;
  size: string | null;
  color: string | null;
  quantity: number;
}

export interface Address {
  id?: number;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: number;
  product: number;
  productName: string;
  productSlug: string;
  variant: number | null;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  user: number;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
}
