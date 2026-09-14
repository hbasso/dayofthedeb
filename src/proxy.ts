import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_LOGIN_PATH, isAdminLoginPath, isAdminPath, isPublicPath } from '@/lib/routes';
import { ADMIN_SESSION_COOKIE, isAdminSealValid, isSiteSealValid, SITE_SESSION_COOKIE } from '@/lib/session';

function redirectWithNext(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin area: the admin password alone grants access (no invitation password needed).
  if (isAdminPath(pathname)) {
    if (isAdminLoginPath(pathname)) return NextResponse.next();
    if (await isAdminSealValid(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return NextResponse.next();
    if (pathname.startsWith('/api/')) return new NextResponse(null, { status: 401 });
    return redirectWithNext(request, ADMIN_LOGIN_PATH);
  }

  if (isPublicPath(pathname)) return NextResponse.next();
  if (await isSiteSealValid(request.cookies.get(SITE_SESSION_COOKIE)?.value)) return NextResponse.next();
  return redirectWithNext(request, '/unlock');
}

export const config = {
  matcher: ['/((?!_next/static/|_next/image|favicon\\.ico$).*)'],
};
