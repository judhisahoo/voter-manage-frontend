import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const user = request.cookies.get("user");
   const pathname = request.nextUrl.pathname;

   // Unprotected routes
  if (pathname === '/voter-data-manage-login') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/data-list') ||
    pathname.startsWith('/profile')
  ) {
    if (!token) {
      return NextResponse.redirect(new URL('/voter-data-manage-login', request.url));
    }
  }

  if (pathname.startsWith('/users')) {
    if (!token) {
      return NextResponse.redirect(new URL('/voter-data-manage-login', request.url));
    }

    if (user) {
      try {
        const userData = JSON.parse(user.value);
        if (userData.role !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (error) {
        return NextResponse.redirect(new URL('/voter-data-manage-login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
