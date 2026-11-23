export type UserRole = 'cliente' | 'cocinero';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  address?: string;
  phone?: string;
  createdAt?: string | Date;
}

export type DishCategory = 'Hamburguesas' | 'Pizzas' | 'Salchipapas' | 'Bebidas' | 'Postres';

export interface IDish {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: DishCategory;
  image: string;
  available: boolean;
  createdAt?: string | Date;
}

export interface IOrderItem {
  dish: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus = 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentMethod = 'paypal' | 'paypal_simulated';

export interface IOrder {
  _id: string;
  orderNumber: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  items: IOrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryPhone?: string;
  notes?: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paypalOrderId?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  address?: string;
  phone?: string;
}

export interface CartItem {
  dish: IDish;
  quantity: number;
}
