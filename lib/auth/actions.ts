// lib/auth/actions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server Actions for authentication flows.
// "use server" at the top makes ALL exports in this file server actions.
//
// These are called from <form action={loginAction}> or useFormState() hooks.
// ─────────────────────────────────────────────────────────────────────────────
"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getHomePathForRole } from "@/lib/auth/session";
import { LOGIN_PATH } from "@/lib/auth/roles";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "advice-crm-production-secret-salt-2026";

// ── Shared result type ────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ── loginAction ───────────────────────────────────────────────────────────────

/**
 * Authenticates a user with email + password via PostgreSQL (bcrypt) or Supabase Auth,
 * sets a session JWT cookie, and redirects based on their role:
 *   STUDENT  → /anasayfa
 *   ADMIN / ADVISOR → /dashboard
 *
 * Returns an ActionResult<void> with a Turkish error message on failure.
 * On success, Next.js redirect() is called (throws internally — no return value).
 */
export async function loginAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = (formData.get("email") as string | null)?.trim()?.toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  // ── Basic client-side-equivalent validation ────────────────────────────────
  if (!email || !password) {
    return { success: false, error: "E-posta ve şifre alanları zorunludur." };
  }

  // ── 1. Production PostgreSQL Authentication with bcrypt ────────────────────
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    if (dbUser && dbUser.passwordHash) {
      const isMatch = await bcrypt.compare(password, dbUser.passwordHash);
      if (!isMatch) {
        return { success: false, error: "Hatalı e-posta veya şifre." };
      }

      if (!dbUser.isActive) {
        return {
          success: false,
          error: "Hesabınız devre dışı bırakılmıştır. Lütfen yöneticinizle iletişime geçin.",
        };
      }

      const token = jwt.sign(
        {
          sub: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          name: dbUser.fullName,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      const cookieStore = cookies();
      cookieStore.set("advice_session", token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      cookieStore.set("x-user-role", dbUser.role, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookieStore.set("x-user-id", dbUser.id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      redirect(getHomePathForRole(dbUser.role));
    }
  } catch (err: any) {
    if (err?.message?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("PostgreSQL auth verification error:", err);
  }

  // ── 2. Supabase Auth fallback (if configured) ─────────────────────────────
  try {
    const supabase = createSupabaseServerClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      return { success: false, error: "Hatalı e-posta veya şifre." };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authData.user.id },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });

    if (!dbUser) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Kullanıcı profili bulunamadı. Lütfen yöneticinizle iletişime geçin.",
      };
    }

    if (!dbUser.isActive) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Hesabınız devre dışı bırakılmıştır. Lütfen yöneticinizle iletişime geçin.",
      };
    }

    const token = jwt.sign(
      {
        sub: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name: dbUser.fullName,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const cookieStore = cookies();
    cookieStore.set("advice_session", token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set("x-user-role", dbUser.role, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set("x-user-id", dbUser.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect(getHomePathForRole(dbUser.role));
  } catch (err: any) {
    if (err?.message?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return { success: false, error: "Hatalı e-posta veya şifre." };
  }
}

// ── logoutAction ─────────────────────────────────────────────────────────────

/**
 * Signs the user out, clears session cookies, and redirects to the login page.
 */
export async function logoutAction(): Promise<never> {
  const cookieStore = cookies();
  cookieStore.delete("advice_session");
  cookieStore.delete("x-user-role");
  cookieStore.delete("x-user-id");

  try {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore if Supabase is offline
  }

  redirect(LOGIN_PATH);
}

// ── passwordResetAction ───────────────────────────────────────────────────────

/**
 * Sends a password reset email via Supabase Auth.
 * Returns a Turkish-language success or error message.
 */
export async function passwordResetAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  if (!email) {
    return { success: false, error: "Lütfen e-posta adresinizi girin." };
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/sifre-guncelle`,
  });

  if (error) {
    return {
      success: false,
      error: "Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.",
    };
  }

  return { success: true };
}
