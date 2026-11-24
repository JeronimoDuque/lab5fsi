import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Redirigir la antigua ruta /cocinero a /logistica
  if (pathname.startsWith('/cocinero')) {
    return NextResponse.redirect(new URL('/logistica', request.url));
  }
  // Redirigir la antigua ruta /menu a /catalogo
  if (pathname === '/menu') {
    return NextResponse.redirect(new URL('/catalogo', request.url));
  }

  // Rutas que requieren autenticación
  const isAuthRoute =
    pathname.startsWith('/pedidos') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/biblioteca') ||
    pathname.startsWith('/logistica') ||
    pathname.startsWith('/admin');

  if (isAuthRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(payloadBase64));

        // Proteger ruta de Logística (solo logistica o admin)
        if (pathname.startsWith('/logistica')) {
          if (decoded.role !== 'logistica' && decoded.role !== 'admin') {
            return NextResponse.redirect(new URL('/catalogo', request.url));
          }
        }

        // Proteger ruta de Admin (solo admin)
        if (pathname.startsWith('/admin')) {
          if (decoded.role !== 'admin') {
            return NextResponse.redirect(new URL('/catalogo', request.url));
          }
        }
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/cocinero/:path*',
    '/menu',
    '/logistica/:path*',
    '/admin/:path*',
    '/pedidos/:path*',
    '/checkout/:path*',
    '/biblioteca/:path*',
  ],
};
