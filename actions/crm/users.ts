// actions/crm/users.ts
"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";
import type { Role, Program } from "@prisma/client";

export type UserActionState =
  | { success: true; message?: string }
  | { success: false; error: string };

export interface StaffPermissionsPayload {
  role: Role;
  department?: string | null;
  allowedPrograms: Program[];
  canManageApprovals: boolean;
  canManageMarketing: boolean;
  canExportData: boolean;
  canViewAllLeads: boolean;
}

/**
 * Creates a new Advisor or Admin user (Admin only).
 */
export async function createStaffUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const currentStaff = await requireStaff();
  if (currentStaff.role !== "ADMIN") {
    return { success: false, error: "Bu işlem için sadece Sistem Yöneticisi (Admin) yetkilidir." };
  }

  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const password = (formData.get("password") as string)?.trim();
  const role = (formData.get("role") as Role) || "ADVISOR";
  const department = (formData.get("department") as string)?.trim() || null;

  // Selected programs from form (e.g. multiple checkboxes with name "allowedPrograms")
  const rawPrograms = formData.getAll("allowedPrograms") as Program[];
  const allowedPrograms: Program[] = rawPrograms.length > 0 ? rawPrograms : [
    "WORK_AND_TRAVEL",
    "ACADEMY",
    "LANGUAGE_SCHOOL",
    "SUMMER_CAMP",
    "VISA_CONSULTING",
  ];

  if (!fullName || !email || !password) {
    return { success: false, error: "Ad Soyad, E-Posta ve Şifre alanları zorunludur." };
  }

  if (password.length < 6) {
    return { success: false, error: "Şifre en az 6 karakter olmalıdır." };
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        id: userId,
        fullName,
        email,
        phone,
        passwordHash,
        role,
        isActive: true,
      },
    });

    if (role === "ADVISOR" || role === "ADMIN") {
      await tx.advisorProfile.create({
        data: {
          userId: newUser.id,
          department: department || (role === "ADMIN" ? "Yönetim" : "Yurtdışı Eğitim Danışmanlığı"),
          allowedPrograms,
          canManageApprovals: true,
          canManageMarketing: true,
          canExportData: role === "ADMIN",
          canViewAllLeads: true,
        },
      });
    }
  });

  revalidatePath("/settings");
  return { success: true, message: `Kullanıcı "${fullName}" (${role}) başarıyla oluşturuldu.` };
}

/**
 * Updates a staff member's role and granular program/module permissions (Admin only).
 */
export async function updateStaffPermissions(
  userId: string,
  payload: StaffPermissionsPayload
): Promise<UserActionState> {
  const currentStaff = await requireStaff();
  if (currentStaff.role !== "ADMIN") {
    return { success: false, error: "Bu işlem için sadece Sistem Yöneticisi (Admin) yetkilidir." };
  }

  // Safety check 1: Cannot demote yourself from ADMIN
  if (userId === currentStaff.id && payload.role !== "ADMIN") {
    return { success: false, error: "Güvenlik gereği kendi yönetici yetkinizi kaldıramazsınız." };
  }

  // Safety check 2: Advisors must have at least one allowed program
  if (payload.role === "ADVISOR" && payload.allowedPrograms.length === 0) {
    return { success: false, error: "Danışman için en az bir program modülü seçmelisiniz." };
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update user role
    await tx.user.update({
      where: { id: userId },
      data: { role: payload.role },
    });

    // 2. Upsert advisor profile permissions
    await tx.advisorProfile.upsert({
      where: { userId },
      update: {
        department: payload.department,
        allowedPrograms: payload.allowedPrograms,
        canManageApprovals: payload.canManageApprovals,
        canManageMarketing: payload.canManageMarketing,
        canExportData: payload.canExportData,
        canViewAllLeads: payload.canViewAllLeads,
      },
      create: {
        userId,
        department: payload.department || "Yurtdışı Eğitim Danışmanlığı",
        allowedPrograms: payload.allowedPrograms,
        canManageApprovals: payload.canManageApprovals,
        canManageMarketing: payload.canManageMarketing,
        canExportData: payload.canExportData,
        canViewAllLeads: payload.canViewAllLeads,
      },
    });
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, message: "Kullanıcı yetki ve modül erişimleri başarıyla güncellendi." };
}

/**
 * Toggles a user's active status.
 */
export async function toggleUserStatus(
  userId: string,
  isActive: boolean
): Promise<UserActionState> {
  const currentStaff = await requireStaff();
  if (currentStaff.role !== "ADMIN") {
    return { success: false, error: "Yetkisiz işlem." };
  }

  if (userId === currentStaff.id) {
    return { success: false, error: "Kendi hesabınızı devre dışı bırakamazsınız." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  revalidatePath("/settings");
  return { success: true };
}
