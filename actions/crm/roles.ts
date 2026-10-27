// actions/crm/roles.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import type { Role } from "@prisma/client";

export type RoleActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

export interface CustomRoleInput {
  name: string;
  description?: string;
  baseRole: Role;
  permissions: {
    allowedPrograms?: string[];
    canManageApprovals?: boolean;
    canManageMarketing?: boolean;
    canExportData?: boolean;
    canViewAllLeads?: boolean;
    canManageAccounting?: boolean;
    canManageJobPool?: boolean;
    canManagePartnerPool?: boolean;
  };
}

export async function createCustomRole(
  input: CustomRoleInput,
): Promise<RoleActionResult> {
  await requireAdmin();

  if (!input.name?.trim()) {
    return { success: false, error: "Rol adı zorunludur." };
  }

  const slug = input.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]/g, "-")
    .replace(/-+/g, "-");

  const role = await prisma.customRole.create({
    data: {
      name: input.name.trim(),
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      description: input.description || null,
      baseRole: input.baseRole || "ADVISOR",
      permissions: input.permissions || {},
      isSystem: false,
    },
  });

  revalidatePath("/settings");
  return { success: true, id: role.id };
}

export async function deleteCustomRole(roleId: string): Promise<RoleActionResult> {
  await requireAdmin();
  await prisma.customRole.delete({ where: { id: roleId } });
  revalidatePath("/settings");
  return { success: true };
}
