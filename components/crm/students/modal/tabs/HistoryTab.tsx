// components/crm/students/modal/tabs/HistoryTab.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Pin, PinOff, Send, MessageSquarePlus } from "lucide-react";
import type { CRMAdvisorNote } from "@/types/crm";
import { createAdvisorNote, toggleNotePin } from "@/actions/crm/notes";
import { formatDateTime } from "@/lib/utils/date";
import { useTransition } from "react";
import { cn } from "@/lib/utils/cn";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      <Send className="h-3.5 w-3.5" />
      {pending ? "Kaydediliyor…" : "Not Ekle"}
    </button>
  );
}

interface Props {
  notes: CRMAdvisorNote[];
  studentId: string;
}

export function HistoryTab({ notes, studentId }: Props) {
  const [noteState, noteAction] = useFormState(
    createAdvisorNote.bind(null, studentId),
    { success: false, error: "" },
  );
  const [isPending, startTransition] = useTransition();

  // Pinned notes first, then chronological descending
  const sorted = [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <MessageSquarePlus className="h-4 w-4 text-blue-500" />
          Yeni Not Ekle
        </h3>
        <form action={noteAction} className="space-y-3">
          <textarea
            name="note"
            rows={3}
            placeholder="Öğrenciyle ilgili notunuzu buraya yazın…"
            className="w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-200"
          />
          {!noteState.success && noteState.error && (
            <p className="text-xs text-red-600">{noteState.error}</p>
          )}
          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </div>

      {/* Note timeline */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquarePlus className="h-10 w-10 text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">Henüz not girilmemiş.</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((note) => (
          <div
            key={note.id}
            className={cn(
              "group relative rounded-xl border p-4 transition-colors",
              note.isPinned
                ? "border-amber-200 bg-amber-50"
                : "border-gray-100 bg-white hover:bg-gray-50",
            )}
          >
            {/* Pin badge */}
            {note.isPinned && (
              <span className="absolute right-3 top-3 text-xs font-medium text-amber-600">
                📌 Sabitlenmiş
              </span>
            )}

            {/* Author + time */}
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {note.authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">{note.authorName}</p>
                <p className="text-[10px] text-gray-400">{formatDateTime(note.createdAt)}</p>
              </div>
            </div>

            {/* Note text */}
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {note.note}
            </p>

            {/* Pin toggle — visible on hover, admin only via server action */}
            <button
              type="button"
              onClick={() =>
                startTransition(() => {
                  void toggleNotePin(note.id, !note.isPinned);
                })
              }
              disabled={isPending}
              className="absolute bottom-3 right-3 hidden items-center gap-1 rounded-md px-2 py-1 text-[10px] text-gray-400 hover:text-amber-600 group-hover:flex disabled:opacity-50"
            >
              {note.isPinned ? (
                <PinOff className="h-3 w-3" />
              ) : (
                <Pin className="h-3 w-3" />
              )}
              {note.isPinned ? "Sabitlemeyi Kaldır" : "Sabitle"}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-gray-300">
        Notlar değiştirilemez. Tüm kayıtlar kalıcı olarak saklanır.
      </p>
    </div>
  );
}
