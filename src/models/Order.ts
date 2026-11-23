import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItemDocument {
  dish?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface IOrderDocument extends Document {
  orderNumber: string;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  items: IOrderItemDocument[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryPhone?: string;
  notes?: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod: 'paypal' | 'paypal_simulated';
  paypalOrderId?: string;
  status: 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado';
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItemDocument>(
  {
    dish: {
      type: Schema.Types.ObjectId,
      ref: 'Dish',
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(val: any[]) => val.length > 0, 'La orden debe tener al menos un plato'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryAddress: {
      type: String,
      required: [true, 'La dirección de entrega es requerida'],
    },
    deliveryPhone: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    paymentMethod: {
      type: String,
      enum: ['paypal', 'paypal_simulated'],
      default: 'paypal_simulated',
    },
    paypalOrderId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pendiente', 'En preparación', 'Listo', 'Entregado'],
      default: 'Pendiente',
    },
  },
  {
    timestamps: true,
  }
);

export const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export default Order;
