import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: 'cliente' | 'cocinero';
  address?: string;
  phone?: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    role: {
      type: String,
      enum: ['cliente', 'cocinero'],
      default: 'cliente',
    },
    address: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash de la contraseña antes de guardar
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
