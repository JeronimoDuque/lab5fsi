import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShipmentDocument extends Document {
  order: mongoose.Types.ObjectId;
  trackingNumber: string;
  carrier: 'Servientrega' | 'FedEx' | 'DHL' | 'Coordinadora' | 'Interrapidísimo' | 'Envía';
  destinationAddress: string;
  city: string;
  department?: string;
  recipientName: string;
  recipientPhone?: string;
  status: 'Pendiente' | 'En Preparación' | 'Despachado' | 'En Tránsito' | 'Entregado';
  estimatedDelivery?: string;
  notes?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentSchema = new Schema<IShipmentDocument>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    carrier: {
      type: String,
      enum: ['Servientrega', 'FedEx', 'DHL', 'Coordinadora', 'Interrapidísimo', 'Envía'],
      default: 'Servientrega',
      required: true,
    },
    destinationAddress: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: '',
    },
    recipientName: {
      type: String,
      required: true,
    },
    recipientPhone: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pendiente', 'En Preparación', 'Despachado', 'En Tránsito', 'Entregado'],
      default: 'Pendiente',
    },
    estimatedDelivery: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Shipment: Model<IShipmentDocument> =
  mongoose.models.Shipment || mongoose.model<IShipmentDocument>('Shipment', ShipmentSchema);

export default Shipment;
