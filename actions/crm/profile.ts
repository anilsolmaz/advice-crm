// actions/crm/profile.ts
"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";

export type ProfileActionState =
  | { success: true; message?: string }
  | { success: false; error: string };

/**
 * Updates the staff member's personal information (fullName, phone).
 */
export async function updateProfileDetails(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await requireStaff();

  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!fullName) {
    return { success: false, error: "Ad Soyad alanı boş bırakılamaz." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName,
      phone,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/settings/profile");
  return { success: true, message: "Profil bilgileriniz başarıyla güncellendi." };
}

/**
 * Changes the staff member's password after verifying the current password.
 */
export async function changePassword(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await requireStaff();

  const currentPassword = (formData.get("currentPassword") as string)?.trim();
  const newPassword = (formData.get("newPassword") as string)?.trim();
  const confirmPassword = (formData.get("confirmPassword") as string)?.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Lütfen tüm şifre alanlarını doldurunuz." };
  }

  if (newPassword.length < 6) {
    return { success: false, error: "Yeni şifre en az 6 karakter olmalıdır." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Yeni şifreler birbiriyle uyuşmuyor." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!dbUser || !dbUser.passwordHash) {
    return { success: false, error: "Kullanıcı güvenlik kaydı bulunamadı." };
  }

  const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!isValid) {
    return { success: false, error: "Mevcut şifreniz hatalı. Lütfen kontrol ediniz." };
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  revalidatePath("/profile");
  revalidatePath("/settings/profile");
  return { success: true, message: "Şifreniz başarıyla değiştirildi." };
}
