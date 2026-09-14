import { NextResponse, type NextRequest } from 'next/server';
import { isPublicPath } from '@/lib/routes';
import { isSiteSealValid, SITE_SESSION_COOKIE } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  if (await isSiteSealValid(request.cookies.get(SITE_SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = '/unlock';
  unlockUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
