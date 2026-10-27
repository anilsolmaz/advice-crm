// lib/auth/roles.ts
// ─────────────────────────────────────────────────────────────────────────────
// Role constants, type guards, and Turkish display labels for BackPax CRM.
// Imported by both server and client code — no side effects, no imports.
// ─────────────────────────────────────────────────────────────────────────────
import type { Role } from "@prisma/client";

// ── Display labels (Turkish UI) ──────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Yönetici (Admin)",
  ADVISOR: "Eğitim Danışmanı",
  ACCOUNTING: "Muhasebe & Finans",
  STUDENT: "Öğrenci",
} as const;

// ── Route constants ──────────────────────────────────────────────────────────

/** Default redirect for staff (ADMIN | ADVISOR) after login */
export const STAFF_HOME = "/dashboard" as const;

/** Default redirect for accounting role after login */
export const ACCOUNTING_HOME = "/accounting" as const;

/** Default redirect for students after login */
export const STUDENT_HOME = "/anasayfa" as const;

/** Auth redirect for unauthenticated users */
export const LOGIN_PATH = "/login" as const;

// ── CRM route prefixes (ADMIN | ADVISOR | ACCOUNTING) ────────────────────────

export const CRM_PATHS = [
  "/dashboard",
  "/leads",
  "/students",
  "/approvals",
  "/programs",
  "/accounting",
  "/groups",
  "/schools",
  "/calendar",
  "/settings",
  "/profile",
  "/wat",
  "/academy",
  "/language",
  "/summer-camp",
  "/visa",
] as const;

// ── Portal route prefixes (STUDENT only) ─────────────────────────────────────

export const PORTAL_PATHS = [
  "/anasayfa",
  "/profilim",
  "/belgelerim",
  "/odemelerim",
  "/programim",
  "/bildirimler",
] as const;

// ── Type guards ──────────────────────────────────────────────────────────────

export function isAdmin(role: Role | null | undefined): role is "ADMIN" {
  return role === "ADMIN";
}

export function isAdvisor(
  role: Role | null | undefined,
): role is "ADMIN" | "ADVISOR" {
  return role === "ADMIN" || role === "ADVISOR";
}

export function isAccounting(
  role: Role | null | undefined,
): role is "ADMIN" | "ACCOUNTING" {
  return role === "ADMIN" || role === "ACCOUNTING";
}

export function isStudent(role: Role | null | undefined): role is "STUDENT" {
  return role === "STUDENT";
}

export function isStaff(
  role: Role | null | undefined,
): role is "ADMIN" | "ADVISOR" | "ACCOUNTING" {
  return role === "ADMIN" || role === "ADVISOR" || role === "ACCOUNTING";
}

// ── Narrow types ─────────────────────────────────────────────────────────────

export type StaffRole = Extract<Role, "ADMIN" | "ADVISOR" | "ACCOUNTING">;
export type StudentRole = Extract<Role, "STUDENT">;

// ── Path classification helpers ───────────────────────────────────────────────

export function isCrmPath(pathname: string): boolean {
  return CRM_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function isPortalPath(pathname: string): boolean {
  return PORTAL_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}
