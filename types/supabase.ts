// types/supabase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Minimal Database type scaffold.
//
// ⚠️  IMPORTANT: Replace this file with the auto-generated version by running:
//       npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
//
// Until then this placeholder satisfies the generic constraints used in
// lib/supabase/*.ts so the project compiles without a live Supabase project.
// ─────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: "ADMIN" | "ADVISOR" | "STUDENT";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      students: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string | null;
          advisor_id: string | null;
          program:
            | "WORK_AND_TRAVEL"
            | "ACADEMY"
            | "LANGUAGE_SCHOOL"
            | "SUMMER_CAMP"
            | "VISA_CONSULTING";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["students"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      pending_approvals: {
        Row: {
          id: string;
          student_id: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json;
          status: "PENDING" | "APPROVED" | "REVISION_REQUESTED";
          rejection_reason: string | null;
          reviewed_by_id: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["pending_approvals"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["pending_approvals"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          student_id: string;
          type: string;
          file_name: string;
          file_url: string;
          file_size_bytes: number | null;
          mime_type: string | null;
          verification_status: "PENDING" | "APPROVED" | "REVISION_REQUESTED";
          rejection_reason: string | null;
          uploaded_by_student: boolean;
          expiry_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_role: { Args: Record<string, never>; Returns: string };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_advisor: { Args: Record<string, never>; Returns: boolean };
      is_student: { Args: Record<string, never>; Returns: boolean };
      my_student_id: { Args: Record<string, never>; Returns: string };
      advisor_owns_student: { Args: { p_student_id: string }; Returns: boolean };
    };
    Enums: {
      Role: "ADMIN" | "ADVISOR" | "STUDENT";
      Program:
        | "WORK_AND_TRAVEL"
        | "ACADEMY"
        | "LANGUAGE_SCHOOL"
        | "SUMMER_CAMP"
        | "VISA_CONSULTING";
      ApprovalStatus: "PENDING" | "APPROVED" | "REVISION_REQUESTED";
      VerificationStatus: "PENDING" | "APPROVED" | "REVISION_REQUESTED";
      Currency: "USD" | "EUR" | "TRY" | "GBP";
    };
  };
}
