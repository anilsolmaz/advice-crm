// actions/crm/notes.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";

export type NoteActionState =
  | { success: true }
  | { success: false; error: string };

/**
 * Appends an immutable advisor note / team conversation entry to a student's history.
 * Supports @mention detection and notifies tagged team members.
 */
export async function createAdvisorNote(
  studentId: string,
  _prev: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const advisor = await requireStaff();

  const rawNote = (formData.get("note") as string | null)?.trim();
  const noteTitle = (formData.get("noteTitle") as string | null)?.trim();
  if (!rawNote) {
    return { success: false, error: "Not boş olamaz." };
  }

  const note =
    noteTitle && !rawNote.startsWith("[")
      ? `[${noteTitle}] ${rawNote}`
      : rawNote;

  if (note.length > 2000) {
    return { success: false, error: "Not en fazla 2000 karakter olabilir." };
  }

  // Detect @mentions from staff users
  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "ADVISOR", "ACCOUNTING"] }, isActive: true },
    select: { id: true, fullName: true, email: true },
  });

  const noteLower = note.toLowerCase();
  const mentionedUsers = staffUsers.filter((u) => {
    const firstName = u.fullName.split(" ")[0]?.toLowerCase();
    return (
      (firstName && noteLower.includes(`@${firstName}`)) ||
      noteLower.includes(`@${u.email.split("@")[0].toLowerCase()}`)
    );
  });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { fullName: true } } },
  });

  await prisma.$transaction(async (tx) => {
    await tx.advisorNote.create({
      data: {
        studentId,
        authorId: advisor.id,
        note,
        mentionedUserIds: mentionedUsers.map((u) => u.id),
      },
    });

    if (mentionedUsers.length > 0) {
      await tx.notification.createMany({
        data: mentionedUsers.map((u) => ({
          userId: u.id,
          type: "MENTION",
          title: `💬 ${advisor.fullName} sizi bir öğrenci notunda etiketledi`,
          message: `${student?.user.fullName || "Öğrenci"} kaydında: "${note.slice(0, 120)}"`,
          linkUrl: `/students/${studentId}`,
        })),
      });
    }
  });

  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

export async function toggleNotePin(
  noteId: string,
  isPinned: boolean,
): Promise<NoteActionState> {
  const user = await requireStaff();
  if (user.role !== "ADMIN") {
    return { success: false, error: "Notu sabitleme yetkiniz yok." };
  }

  await prisma.advisorNote.update({
    where: { id: noteId },
    data: { isPinned },
  });

  return { success: true };
}
