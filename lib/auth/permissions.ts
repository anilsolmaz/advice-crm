// lib/auth/permissions.ts
// Granular permission and program access control helpers
import type { Program } from "@prisma/client";
import type { AuthUser } from "@/lib/auth/session";

export const ALL_PROGRAMS: Program[] = [
  "WORK_AND_TRAVEL",
  "ACADEMY",
  "LANGUAGE_SCHOOL",
  "SUMMER_CAMP",
  "VISA_CONSULTING",
];

/**
 * Checks if a user has access to a specific program.
 * ADMIN has access to all programs unconditionally.
 */
export function hasProgramAccess(user: AuthUser | null | undefined, program: Program): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;

  const allowed = user.advisorProfile?.allowedPrograms;
  if (!allowed || !Array.isArray(allowed)) return false;

  return allowed.includes(program);
}

/**
 * Returns the list of programs accessible by the user.
 */
export function getAccessiblePrograms(user: AuthUser | null | undefined): Program[] {
  if (!user) return [];
  if (user.role === "ADMIN") return ALL_PROGRAMS;

  return user.advisorProfile?.allowedPrograms ?? [];
}

/**
 * Checks if the user can approve student documents & profiles.
 */
export function canManageApprovals(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.advisorProfile?.canManageApprovals ?? true;
}

/**
 * Checks if the user can send bulk SMS/Email notifications.
 */
export function canManageMarketing(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.advisorProfile?.canManageMarketing ?? true;
}

/**
 * Checks if the user can export data (Excel / CSV).
 */
export function canExportData(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.advisorProfile?.canExportData ?? false;
}

/**
 * Checks if the user can view all leads or only assigned leads within allowed programs.
 */
export function canViewAllLeads(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.advisorProfile?.canViewAllLeads ?? true;
}
