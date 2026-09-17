// lib/utils/diff.ts
// ─────────────────────────────────────────────────────────────────────────────
// JSON diff utility for the pending_approvals workflow.
//
// diffJson(oldData, newData) → { diff: DiffMap<T>, changedFields: (keyof T)[] }
//
// Used by:
//   • Server Action that creates PendingApproval rows (captures oldData snapshot)
//   • CRM ApprovalDiffViewer component (renders before/after for advisor)
// ─────────────────────────────────────────────────────────────────────────────
import type { FieldChange, DiffMap, ApprovalDiff } from "@/types/approval";
import type { ApprovalEntityType } from "@prisma/client";

/**
 * Produces a field-by-field diff between two partial objects of type T.
 *
 * @param oldData  Snapshot of the live record (null for new records).
 * @param newData  Data submitted by the student.
 * @returns        DiffMap<T> and list of changed field keys.
 */
export function diffJson<T extends Record<string, unknown>>(
  oldData: Partial<T> | null,
  newData: Partial<T>,
): { diffMap: DiffMap<T>; changedFields: Array<keyof T & string> } {
  const allKeys = new Set<string>([
    ...(oldData ? Object.keys(oldData) : []),
    ...Object.keys(newData),
  ]);

  const diffMap = {} as DiffMap<T>;
  const changedFields: Array<keyof T & string> = [];
  const keyList = Array.from(allKeys);
  for (let i = 0; i < keyList.length; i++) {
    const key = keyList[i];
    const oldValue = (oldData?.[key as keyof T] ?? null) as T[keyof T] | null;
    const newValue = newData[key as keyof T] as T[keyof T];
    const changed = !isDeepEqual(oldValue, newValue);

    diffMap[key as keyof T] = {
      oldValue,
      newValue,
      changed,
    } as FieldChange<T[keyof T]>;

    if (changed) {
      changedFields.push(key as keyof T & string);
    }
  }

  return { diffMap, changedFields };
}

/**
 * Builds a full ApprovalDiff<T> ready to be stored in pending_approvals.newData.
 */
export function buildApprovalDiff<T extends Record<string, unknown>>(
  entityType: ApprovalEntityType,
  oldData: Partial<T> | null,
  newData: Partial<T>,
): ApprovalDiff<T> {
  const { changedFields } = diffJson(oldData, newData);
  return { entityType, oldData, newData, changedFields };
}

// ── Deep equality helper (no lodash dependency) ───────────────────────────────

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => isDeepEqual(item, b[i]));
  }

  // Object comparison
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      isDeepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }

  return false;
}
