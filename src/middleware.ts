import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Proteger la ruta del dashboard del cocinero
  if (pathname.startsWith('/cocinero')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(payloadBase64));
        if (decoded.role !== 'cocinero') {
          return NextResponse.redirect(new URL('/menu', request.url));
        }
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Proteger rutas de pedidos y checkout
  if (pathname.startsWith('/pedidos') || pathname.startsWith('/checkout')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export { middleware as proxy };

export const config = {
  matcher: ['/cocinero/:path*', '/pedidos/:path*', '/checkout/:path*'],
};
