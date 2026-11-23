import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDishDocument extends Document {
  name: string;
  description: string;
  price: number;
  category: 'Hamburguesas' | 'Pizzas' | 'Salchipapas' | 'Bebidas' | 'Postres';
  image: string;
  available: boolean;
  createdAt: Date;
}

const DishSchema = new Schema<IDishDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del plato es requerido'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'El precio es requerido'],
      min: [0, 'El precio debe ser mayor o igual a 0'],
    },
    category: {
      type: String,
      enum: ['Hamburguesas', 'Pizzas', 'Salchipapas', 'Bebidas', 'Postres'],
      required: [true, 'La categoría es requerida'],
    },
    image: {
      type: String,
      required: [true, 'La URL de la imagen es requerida'],
      default: '/images/default-dish.jpg',
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Dish: Model<IDishDocument> =
  mongoose.models.Dish || mongoose.model<IDishDocument>('Dish', DishSchema);

export default Dish;
