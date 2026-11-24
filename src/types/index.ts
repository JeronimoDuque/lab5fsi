export type UserRole = 'cliente' | 'logistica' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  address?: string;
  city?: string;
  phone?: string;
  createdAt?: string | Date;
}

export type BookFormat = 'fisico' | 'ebook' | 'ambos';
export type BookCategory = 
  | 'Ficción' 
  | 'No Ficción' 
  | 'Tecnología' 
  | 'Negocios' 
  | 'Ciencia' 
  | 'Autoayuda' 
  | 'Literatura' 
  | 'Educación';

export interface IBook {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  price: number;
  format: BookFormat;
  category: BookCategory;
  stock: number;
  coverImage: string;
  downloadUrl?: string;
  pages?: number;
  isAvailable: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IOrderItem {
  book: string;
  title: string;
  price: number;
  quantity: number;
  format: 'fisico' | 'ebook';
  subtotal: number;
  downloadUrl?: string;
}

export type OrderStatus = 'Pendiente' | 'En Preparación' | 'Despachado' | 'Entregado' | 'Cancelado';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentMethod = 'paypal' | 'paypal_simulated';

export type CarrierType = 'Servientrega' | 'FedEx' | 'DHL' | 'Coordinadora' | 'Interrapidísimo' | 'Envía';
export type ShipmentStatus = 'Pendiente' | 'En Preparación' | 'Despachado' | 'En Tránsito' | 'Entregado';

export interface IShipment {
  _id?: string;
  order: string;
  trackingNumber: string;
  carrier: CarrierType;
  destinationAddress: string;
  city: string;
  department?: string;
  recipientName: string;
  recipientPhone?: string;
  status: ShipmentStatus;
  estimatedDelivery?: string;
  notes?: string;
  shippedAt?: string | Date;
  deliveredAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IShippingAddress {
  address: string;
  city: string;
  department?: string;
  phone?: string;
  notes?: string;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  shippingAddress: IShippingAddress;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paypalOrderId?: string;
  status: OrderStatus;
  shipment?: IShipment;
  hasPhysicalItems?: boolean;
  hasEbookItems?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  address?: string;
  city?: string;
  phone?: string;
}

export interface CartItem {
  book: IBook;
  quantity: number;
  selectedFormat: 'fisico' | 'ebook';
}
