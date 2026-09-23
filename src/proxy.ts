import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_LOGIN_PATH,
  isAdminLoginPath,
  isAdminPath,
  isPublicPath,
  normalizeForGate,
  REJECTED_GATE_PATH,
} from '@/lib/routes';
import { ADMIN_SESSION_COOKIE, isAdminSealValid, isSiteSealValid, SITE_SESSION_COOKIE } from '@/lib/session';

function redirectWithNext(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const gatePath = normalizeForGate(pathname);

  // A decoded path carrying . or .. segments doesn't say where the router would actually land, so
  // refuse it outright. 404 denies as hard as a redirect would while revealing nothing: sending an
  // ordinary guest who fat-fingered a URL to the admin sign-in is a dead end that also advertises
  // the admin area. The sentinel stays an admin path so the gates below still deny it by default.
  if (gatePath === REJECTED_GATE_PATH) return new NextResponse(null, { status: 404 });

  // Admin area: the admin password alone grants access (no invitation password needed).
  if (isAdminPath(gatePath)) {
    if (isAdminLoginPath(gatePath)) return NextResponse.next();
    if (await isAdminSealValid(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return NextResponse.next();
    if (gatePath.startsWith('/api/')) return new NextResponse(null, { status: 401 });
    return redirectWithNext(request, ADMIN_LOGIN_PATH);
  }

  if (isPublicPath(gatePath)) return NextResponse.next();
  if (await isSiteSealValid(request.cookies.get(SITE_SESSION_COOKIE)?.value)) return NextResponse.next();
  return redirectWithNext(request, '/unlock');
}

export const config = {
  matcher: ['/((?!_next/static/|_next/image|favicon\\.ico$).*)'],
};
