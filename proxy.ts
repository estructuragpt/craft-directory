import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, getLocaleFromPathname, getPreferredLocale } from "./src/lib/i18n";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || /\.[^/]+$/.test(pathname)) return NextResponse.next();
  if (getLocaleFromPathname(pathname)) {
    const headers = new Headers(request.headers);
    headers.set("x-locale", getLocaleFromPathname(pathname) ?? "en");
    return NextResponse.next({ request: { headers } });
  }
  const locale = pathname === "/" ? (request.cookies.get("locale")?.value ?? getPreferredLocale(request.headers.get("accept-language"))) : defaultLocale;
  const target = request.nextUrl.clone();
  const localizedSegment = pathname === "/auth" ? (locale === "es" ? "/iniciar-sesion" : "/sign-in") : pathname === "/admin" ? (locale === "es" ? "/administracion" : "/admin") : pathname;
  target.pathname = `/${locale}${pathname === "/" ? "" : localizedSegment}`;
  return NextResponse.redirect(target);
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
