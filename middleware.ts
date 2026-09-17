// middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
// Next.js Edge Middleware — runs before every matched request.
//
// Responsibilities:
//   1. Refresh Supabase session cookies (keep JWT alive across page navigations)
//   2. Enforce route protection:
//        • CRM paths   (/dashboard, /leads, /students, …) → ADMIN | ADVISOR only
//        • Portal paths (/anasayfa, /profilim, …)          → STUDENT only
//        • /login                                           → redirect to home if already logged in
//
// Role resolution strategy:
//   The middleware reads the role from a lightweight custom cookie `x-user-role`
//   that is set by the login Server Action and cleared on logout.
//   This avoids a Prisma/DB call on every request (Edge runtime cannot use Prisma).
//   Actual data access is still protected by Supabase RLS regardless of this cookie.
//
// ─────────────────────────────────────────────────────────────────────────────
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import {
  isCrmPath,
  isPortalPath,
  STAFF_HOME,
  STUDENT_HOME,
  LOGIN_PATH,
  isStaff,
  isStudent,
} from "@/lib/auth/roles";

export { LOGIN_PATH };

// ── Role cookie ───────────────────────────────────────────────────────────────
// Name of the plain-text cookie that stores the user role after login.
// Value is one of: "ADMIN" | "ADVISOR" | "STUDENT"
// Security: this cookie is used only for routing (redirects). All data access
// remains enforced by Supabase RLS policies, which use the JWT — not this cookie.
export const ROLE_COOKIE = "x-user-role" as const;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Build mutable response so we can set cookies ───────────────────────────
  let response = NextResponse.next({ request });
  const hasAdviceSession = !!request.cookies.get("advice_session")?.value;
  const hasUserId = !!request.cookies.get("x-user-id")?.value;
  const roleCookie = request.cookies.get(ROLE_COOKIE)?.value as Role | undefined;

  let hasSupabaseUser = false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isMockSupabase = !supabaseUrl || supabaseUrl.includes("example.supabase.co");

  // Only call remote supabase if we don't have local advice_session and not mock
  if (!hasAdviceSession && !isMockSupabase) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value),
              );
              response = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options),
              );
            },
          },
        },
      );
      const {
        data: { user },
      } = await supabase.auth.getUser();
      hasSupabaseUser = !!user;
    } catch {
      hasSupabaseUser = false;
    }
  }

  // Fully authenticated if session token or user ID or Supabase user is present
  const hasSession = hasSupabaseUser || hasAdviceSession || hasUserId;
  const isAuthenticated = hasSession && !!roleCookie;

  // ── 2. /login or root / — redirect only if genuinely authenticated with a valid session ──
  if (pathname === LOGIN_PATH) {
    // Only redirect away from /login if user has an active session
    if (hasSession && roleCookie) {
      const home = isStaff(roleCookie) ? STAFF_HOME : STUDENT_HOME;
      return NextResponse.redirect(new URL(home, request.url));
    }
    return response;
  }

  if (pathname === "/") {
    if (isAuthenticated && roleCookie) {
      const home = isStaff(roleCookie) ? STAFF_HOME : STUDENT_HOME;
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  // ── 3. CRM paths — require ADMIN | ADVISOR ────────────────────────────────
  if (isCrmPath(pathname)) {
    if (!isAuthenticated) {
      const redirectUrl = new URL(LOGIN_PATH, request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (roleCookie && isStudent(roleCookie)) {
      // Authenticated student trying to access staff-only area
      return NextResponse.redirect(new URL(STUDENT_HOME, request.url));
    }

    return response;
  }

  // ── 4. Portal paths — require STUDENT ─────────────────────────────────────
  if (isPortalPath(pathname)) {
    if (!isAuthenticated) {
      const redirectUrl = new URL(LOGIN_PATH, request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (roleCookie && isStaff(roleCookie)) {
      // Authenticated staff trying to access student-only area
      return NextResponse.redirect(new URL(STAFF_HOME, request.url));
    }

    return response;
  }

  // ── 5. Public paths (/auth/callback, /api/webhooks, etc.) — pass through ───
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (Next.js static assets)
     *   - _next/image   (Next.js image optimizer)
     *   - favicon.ico, sitemap.xml, robots.txt
     *   - Files with an extension (e.g. .png, .svg, .woff2)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js|json)$).*)",
  ],
};
