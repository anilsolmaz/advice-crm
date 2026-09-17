// app/auth/callback/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Supabase Auth callback route handler.
// Handles:
//   • Magic link sign-ins
//   • OAuth provider callbacks (Google, etc.)
//   • Password reset redirects (?next=/sifre-guncelle)
//
// Flow:
//   1. Exchange the `code` param for a Supabase session
//   2. Look up the user's role from the DB
//   3. Redirect to role-appropriate home (or ?next= override)
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getHomePathForRole } from "@/lib/auth/session";
import { LOGIN_PATH, ROLE_COOKIE } from "@/middleware";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? null;

  if (!code) {
    // No auth code — redirect to login with error flag
    return NextResponse.redirect(
      new URL(`${LOGIN_PATH}?error=missing_code`, origin),
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`${LOGIN_PATH}?error=auth_failed`, origin),
    );
  }

  // Look up role from DB (Supabase JWT may not have custom claims yet)
  const dbUser = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: { role: true, isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(`${LOGIN_PATH}?error=account_inactive`, origin),
    );
  }

  const homePath = next ?? getHomePathForRole(dbUser.role);
  const redirectResponse = NextResponse.redirect(new URL(homePath, origin));

  // Persist role in the lightweight routing cookie
  redirectResponse.cookies.set(ROLE_COOKIE, dbUser.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days — matches Supabase session TTL
    path: "/",
  });

  return redirectResponse;
}
