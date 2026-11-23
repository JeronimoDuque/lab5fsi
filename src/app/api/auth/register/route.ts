import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role = 'cliente', address = '', phone = '' } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser proporcionados.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este correo electrónico.' },
        { status: 409 }
      );
    }

    const assignedRole = role === 'cocinero' ? 'cocinero' : 'cliente';

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      address,
      phone,
    });

    const authUser = {
      id: (newUser._id as unknown as string).toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    const token = signToken(authUser);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Usuario registrado exitosamente',
        user: authUser,
      },
      { status: 201 }
    );

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
    console.error('[Register API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor al registrar.' },
      { status: 500 }
    );
  }
}
