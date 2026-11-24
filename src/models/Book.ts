import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBookDocument extends Document {
  title: string;
  author: string;
  isbn: string;
  description: string;
  price: number;
  format: 'fisico' | 'ebook' | 'ambos';
  category: 'Ficción' | 'No Ficción' | 'Tecnología' | 'Negocios' | 'Ciencia' | 'Autoayuda' | 'Literatura' | 'Educación';
  stock: number;
  coverImage: string;
  downloadUrl?: string;
  pages?: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBookDocument>(
  {
    title: {
      type: String,
      required: [true, 'El título del libro es requerido'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'El autor es requerido'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'El código ISBN es requerido'],
      unique: true,
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
    format: {
      type: String,
      enum: ['fisico', 'ebook', 'ambos'],
      default: 'ambos',
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Ficción',
        'No Ficción',
        'Tecnología',
        'Negocios',
        'Ciencia',
        'Autoayuda',
        'Literatura',
        'Educación',
      ],
      required: [true, 'La categoría es requerida'],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
    },
    coverImage: {
      type: String,
      required: [true, 'La imagen de portada es requerida'],
      default: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
    },
    downloadUrl: {
      type: String,
      default: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    pages: {
      type: Number,
      default: 200,
      min: 1,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice de texto para búsquedas eficientes
BookSchema.index({ title: 'text', author: 'text', isbn: 'text', category: 'text' });

export const Book: Model<IBookDocument> =
  mongoose.models.Book || mongoose.model<IBookDocument>('Book', BookSchema);

export default Book;
