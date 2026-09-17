// actions/crm/notes.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";

export type NoteActionState =
  | { success: true }
  | { success: false; error: string };

/**
 * Appends an immutable advisor note to a student's history.
 * Notes can NEVER be edited or deleted — this function only creates.
 */
export async function createAdvisorNote(
  studentId: string,
  _prev: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const advisor = await requireStaff();

  const note = (formData.get("note") as string | null)?.trim();
  if (!note) {
    return { success: false, error: "Not boş olamaz." };
  }

  if (note.length > 2000) {
    return { success: false, error: "Not en fazla 2000 karakter olabilir." };
  }

  await prisma.advisorNote.create({
    data: {
      studentId,
      authorId: advisor.id,
      note,
    },
  });

  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

/**
 * Toggles the pinned state of an advisor note.
 * Only admins can pin/unpin notes.
 */
export async function toggleNotePin(
  noteId: string,
  isPinned: boolean,
): Promise<NoteActionState> {
  const user = await requireStaff();
  if (user.role !== "ADMIN") {
    return { success: false, error: "Notu sabitleme yetkiniz yok." };
  }

  // NOTE: This is the ONLY permissible mutation on AdvisorNote
  // (isPinned is a display preference, not the note content itself)
  await prisma.advisorNote.update({
    where: { id: noteId },
    data: { isPinned },
  });

  return { success: true };
}
