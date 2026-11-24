import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { AuthUser } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_bookhub_key_2026_jwt_auth_token';

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address || '',
      city: user.city || '',
      phone: user.phone || '',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest): AuthUser | null {
  // 1. Check HttpOnly cookie
  const cookieToken = req.cookies.get('token')?.value;
  if (cookieToken) {
    const user = verifyToken(cookieToken);
    if (user) return user;
  }

  // 2. Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7);
    const user = verifyToken(bearerToken);
    if (user) return user;
  }

  return null;
}
