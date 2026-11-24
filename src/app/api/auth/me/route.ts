import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectDB();
    const userDoc = await User.findById(authUser.id).select('-password');
    if (!userDoc) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        address: userDoc.address,
        city: userDoc.city,
        phone: userDoc.phone,
      },
    });
  } catch (error: any) {
    console.error('[Auth Me API Error]:', error);
    return NextResponse.json(
      { error: 'Error al consultar el usuario actual.' },
      { status: 500 }
    );
  }
}
