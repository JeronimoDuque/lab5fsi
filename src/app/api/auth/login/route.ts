import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Correo electrónico y contraseña requeridos.' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Usuario no encontrado.' },
        { status: 401 }
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Contraseña incorrecta.' },
        { status: 401 }
      );
    }

    const authUser = {
      id: (user._id as unknown as string).toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = signToken(authUser);

    const response = NextResponse.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: authUser,
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (error: any) {
    console.error('[Login API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al iniciar sesión.' },
      { status: 500 }
    );
  }
}
