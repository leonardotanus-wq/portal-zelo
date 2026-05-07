import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/admin/login"];
const PUBLIC_PREFIXES = ["/api/cron/", "/api/integracoes/"];
const ADMIN_PREFIX = "/admin";
const STATIC_PREFIXES = ["/_next", "/api/auth", "/favicon.ico"];

function isStatic(pathname: string) {
  return (
    STATIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    /\.(svg|png|jpg|jpeg|webp|ico|css|js|woff2?)$/.test(pathname)
  );
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isStatic(pathname)) return supabaseResponse;

  const isAdminRoute =
    pathname.startsWith(ADMIN_PREFIX) && pathname !== "/admin/login";
  const isPublicRoute =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (!admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("erro", "sem-permissao");
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  if (!isPublicRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
