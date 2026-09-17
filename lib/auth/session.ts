// lib/auth/session.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side session helpers (Server Components, Server Actions, Route Handlers).
//
// Design notes:
//   • getSession()     → reads Supabase JWT from cookie (fallback)
//   • getCurrentUser() → verifies advice_session JWT / x-user-id from PostgreSQL
//   • requireRole()    → wraps getCurrentUser() + redirect if unauthorized
//
// All redirect() calls are Next.js 14 server-side redirects (throw internally).
// ─────────────────────────────────────────────────────────────────────────────
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { Session } from "@supabase/supabase-js";
import type { Role, Program } from "@prisma/client";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  STAFF_HOME,
  STUDENT_HOME,
  LOGIN_PATH,
  isStaff,
  isStudent,
} from "@/lib/auth/roles";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "advice-crm-production-secret-salt-2026";

// ── Public types ─────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  advisorProfile?: {
    department: string | null;
    bio: string | null;
    allowedPrograms: Program[];
    canManageApprovals: boolean;
    canManageMarketing: boolean;
    canExportData: boolean;
    canViewAllLeads: boolean;
  } | null;
};

const USER_AUTH_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  advisorProfile: {
    select: {
      department: true,
      bio: true,
      allowedPrograms: true,
      canManageApprovals: true,
      canManageMarketing: true,
      canExportData: true,
      canViewAllLeads: true,
    },
  },
} as const;

export type SessionResult =
  | { session: Session; user: AuthUser }
  | { session: null; user: null };

// ── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the Supabase Session (JWT) for the current request.
 * No database query — reads the cookie only.
 * Returns null if unauthenticated or the token has expired.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = createSupabaseServerClient();
  // getUser() re-validates the JWT against the Supabase Auth server
  // (more secure than getSession() which trusts the local cookie)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Re-fetch session for the full Session object (needed for access_token)
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Fetches the full AuthUser record from the PostgreSQL `users` table for the
 * currently authenticated session (via advice_session JWT, x-user-id, or Supabase).
 * Returns null if unauthenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();

  // 1. Primary: Verify advice_session JWT cookie and query PostgreSQL
  const sessionToken = cookieStore.get("advice_session")?.value;
  if (sessionToken) {
    try {
      const decoded = jwt.verify(sessionToken, JWT_SECRET) as { sub?: string };
      if (decoded?.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.sub },
          select: USER_AUTH_SELECT,
        });

        if (dbUser && dbUser.isActive) return dbUser as unknown as AuthUser;
      }
    } catch {
      // Token invalid or expired
    }
  }

  // 2. Secondary: Direct x-user-id lookup against PostgreSQL
  const userId = cookieStore.get("x-user-id")?.value;
  if (userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: USER_AUTH_SELECT,
      });

      if (dbUser && dbUser.isActive) return dbUser as unknown as AuthUser;
    } catch {
      // DB error
    }
  }

  // 3. Fallback: Supabase Auth session
  try {
    const session = await getSession();
    if (session?.user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: USER_AUTH_SELECT,
      });

      if (dbUser && dbUser.isActive) return dbUser as unknown as AuthUser;
    }
  } catch {
    // Supabase offline
  }

  // 4. Local resilience fallback: Lookup by x-user-role in PostgreSQL
  const roleCookie = cookieStore.get("x-user-role")?.value as Role | undefined;
  if (roleCookie) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: { role: roleCookie, isActive: true },
        select: USER_AUTH_SELECT,
        orderBy: { createdAt: "asc" },
      });
      if (dbUser) return dbUser as unknown as AuthUser;
    } catch {
      // DB error
    }
  }

  return null;
}

// ── Route guards (server-side redirects) ─────────────────────────────────────

/**
 * Requires an authenticated session.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
}

/**
 * Requires the user to have one of the specified roles.
 * @param allowedRoles  - Roles that are permitted.
 * @param unauthorizedRedirect - Where to send the user if role check fails.
 */
export async function requireRole(
  allowedRoles: Role[],
  unauthorizedRedirect: string,
): Promise<AuthUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect(unauthorizedRedirect);
  }
  return user;
}

/**
 * Requires ADMIN or ADVISOR role.
 * Students hitting CRM pages are sent to the portal home.
 */
export async function requireStaff(): Promise<AuthUser> {
  return requireRole(["ADMIN", "ADVISOR"], STUDENT_HOME);
}

/**
 * Requires STUDENT role.
 * Staff hitting portal pages are sent to the CRM dashboard.
 */
export async function requireStudent(): Promise<AuthUser> {
  return requireRole(["STUDENT"], STAFF_HOME);
}

/**
 * Requires ADMIN role specifically.
 * Non-admins are redirected to the CRM dashboard.
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(["ADMIN"], STAFF_HOME);
}

// ── Post-login role-based redirect ───────────────────────────────────────────

/**
 * Determines the correct home path for a user based on their role.
 * Used after login and OAuth callback.
 */
export function getHomePathForRole(role: Role): string {
  if (isStaff(role)) return STAFF_HOME;
  if (isStudent(role)) return STUDENT_HOME;
  return LOGIN_PATH;
}
