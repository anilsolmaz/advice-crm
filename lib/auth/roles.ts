// lib/auth/roles.ts
// ─────────────────────────────────────────────────────────────────────────────
// Role constants, type guards, and Turkish display labels.
// Imported by both server and client code — no side effects, no imports.
// ─────────────────────────────────────────────────────────────────────────────
import type { Role } from "@prisma/client";

// ── Display labels (Turkish UI) ──────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Yönetici",
  ADVISOR: "Danışman",
  STUDENT: "Öğrenci",
} as const;

// ── Route constants ──────────────────────────────────────────────────────────

/** Default redirect for staff (ADMIN | ADVISOR) after login */
export const STAFF_HOME = "/dashboard" as const;

/** Default redirect for students after login */
export const STUDENT_HOME = "/anasayfa" as const;

/** Auth redirect for unauthenticated users */
export const LOGIN_PATH = "/login" as const;

// ── CRM route prefixes (ADMIN | ADVISOR only) ────────────────────────────────

export const CRM_PATHS = [
  "/dashboard",
  "/leads",
  "/students",
  "/approvals",
  "/programs",
  "/settings",
  "/profile",
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

export function isStudent(role: Role | null | undefined): role is "STUDENT" {
  return role === "STUDENT";
}

export function isStaff(
  role: Role | null | undefined,
): role is "ADMIN" | "ADVISOR" {
  return role === "ADMIN" || role === "ADVISOR";
}

// ── Narrow types ─────────────────────────────────────────────────────────────

export type StaffRole = Extract<Role, "ADMIN" | "ADVISOR">;
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
