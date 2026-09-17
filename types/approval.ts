// types/approval.ts
// ─────────────────────────────────────────────────────────────────────────────
// Generic types for the student-portal approval workflow.
//
// Design:
//   • ApprovalDiff<T>    — the core generic. Represents a staged change where
//     oldData is the live record snapshot (null for new records) and
//     newData is what the student submitted.
//
//   • FieldChange<V>     — a single field's before/after values with metadata.
//
//   • ApprovalPayload<T> — what a student INSERT into pending_approvals looks like.
//
//   • ApprovedChange<T>  — what an advisor writes back to the live table on approval.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  ApprovalStatus,
  ApprovalEntityType,
  PendingApproval,
} from "@prisma/client";

// ── Field-level diff ──────────────────────────────────────────────────────────

/**
 * Represents the before/after value of a single field.
 * Used to render the diff view in the CRM advisor approval panel.
 */
export type FieldChange<V = unknown> = {
  /** Snapshot value from the live record. Null for newly created records. */
  oldValue: V | null;
  /** Value submitted by the student. */
  newValue: V;
  /** Whether this field's value changed (oldValue !== newValue). */
  changed: boolean;
};

// ── Core generic diff type ────────────────────────────────────────────────────

/**
 * ApprovalDiff<T> captures a full before/after snapshot of an entity of type T.
 *
 * Generic parameter T should be a Prisma model type or a subset of one.
 *
 * @example
 *   type ProfileDiff = ApprovalDiff<StudentProfile>
 *
 *   const diff: ProfileDiff = {
 *     entityType: 'STUDENT_PROFILE',
 *     oldData: { nationalId: '12345678901', ... }, // live record
 *     newData: { nationalId: '12345678901', passportNumber: 'A123456', ... }, // student edit
 *     changedFields: ['passportNumber'],
 *   }
 */
export type ApprovalDiff<T extends Record<string, unknown>> = {
  entityType: ApprovalEntityType;
  /**
   * Full snapshot of the live entity before the change.
   * Null when the student is creating a new record (e.g., first profile submission).
   */
  oldData: Partial<T> | null;
  /** Full object submitted by the student (may include unchanged fields). */
  newData: Partial<T>;
  /** Array of field keys whose values differ between oldData and newData. */
  changedFields: Array<keyof T & string>;
};

// ── Computed field-map helper ─────────────────────────────────────────────────

/**
 * A map from each field key of T to its FieldChange record.
 * Produced by the diffJson() utility in lib/utils/diff.ts.
 */
export type DiffMap<T extends Record<string, unknown>> = {
  [K in keyof T]: FieldChange<T[K]>;
};

// ── Portal INSERT payload ─────────────────────────────────────────────────────

/**
 * The data structure a student portal form submits when requesting a change.
 * Maps directly to the pending_approvals table columns.
 */
export type ApprovalPayload<T extends Record<string, unknown>> = {
  studentId: string;
  entityType: ApprovalEntityType;
  /** PK of the live record being edited. Omit for new record creation. */
  entityId?: string;
  /** Snapshot captured by the server at submission time. */
  oldData: Partial<T> | null;
  /** The full form data the student submitted. */
  newData: Partial<T>;
};

// ── Advisor review result ─────────────────────────────────────────────────────

/**
 * Result object produced when an advisor approves or rejects a pending approval.
 */
export type ReviewResult =
  | {
      action: "APPROVED";
      approvalId: string;
      reviewedById: string;
      reviewedAt: Date;
    }
  | {
      action: "REVISION_REQUESTED";
      approvalId: string;
      reviewedById: string;
      reviewedAt: Date;
      rejectionReason: string;
    };

// ── Enriched approval record (for CRM approval panel) ────────────────────────

/**
 * PendingApproval row enriched with typed, parsed JSON data and the
 * computed DiffMap for rendering the before/after diff viewer.
 */
export type EnrichedApproval<T extends Record<string, unknown>> = Omit<
  PendingApproval,
  "oldData" | "newData"
> & {
  oldData: Partial<T> | null;
  newData: Partial<T>;
  diff: DiffMap<T>;
};

// ── Per-entity approval diff types ───────────────────────────────────────────
// Import from @prisma/client and instantiate ApprovalDiff<T> for each entity.
// These are convenience aliases; add more as new entities become approvable.

import type {
  StudentProfile,
  WatDetail,
  AcademyDetail,
  LanguageDetail,
  SummerCampDetail,
  VisaDetail,
} from "@prisma/client";

export type StudentProfileDiff  = ApprovalDiff<StudentProfile>;
export type WatDetailDiff       = ApprovalDiff<WatDetail>;
export type AcademyDetailDiff   = ApprovalDiff<AcademyDetail>;
export type LanguageDetailDiff  = ApprovalDiff<LanguageDetail>;
export type SummerCampDetailDiff = ApprovalDiff<SummerCampDetail>;
export type VisaDetailDiff      = ApprovalDiff<VisaDetail>;

// ── Status display helpers (Turkish labels) ───────────────────────────────────

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: "İnceleme Bekliyor",
  APPROVED: "Onaylandı",
  REVISION_REQUESTED: "Revize İstendi",
} as const;

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  PENDING: "text-amber-600 bg-amber-50 border-amber-200",
  APPROVED: "text-emerald-600 bg-emerald-50 border-emerald-200",
  REVISION_REQUESTED: "text-red-600 bg-red-50 border-red-200",
} as const;
