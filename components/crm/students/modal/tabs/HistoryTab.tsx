// components/crm/students/modal/tabs/HistoryTab.tsx
"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Pin, PinOff, Plus, MessageSquarePlus, User, Clock } from "lucide-react";
import type { CRMAdvisorNote } from "@/types/crm";
import { createAdvisorNote, toggleNotePin } from "@/actions/crm/notes";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0f172a] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors"
    >
      <Plus className="h-3.5 w-3.5 text-sky-400" />
      {pending ? "Kaydediliyor…" : "Not Ekle"}
    </button>
  );
}

function extractNoteTitleAndBody(rawNote: string): {
  title: string;
  body: string;
  badgeClass: string;
} {
  const match = rawNote.match(/^\[([^\]]+)\]:?\s*([\s\S]*)$/);
  const title = match ? match[1].trim() : "Danışman Notu";
  const body = match ? match[2].trim() || rawNote : rawNote;

  const t = title.toLowerCase();
  let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
  if (t.includes("e-posta") || t.includes("mail")) {
    badgeClass = "bg-sky-50 text-sky-700 border-sky-200";
  } else if (t.includes("vize") || t.includes("evrak")) {
    badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
  } else if (t.includes("whatsapp") || t.includes("görüşme")) {
    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (t.includes("muhasebe") || t.includes("ödeme") || t.includes("taksit")) {
    badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
  }

  return { title, body, badgeClass };
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
  const [noteTitle, setNoteTitle] = useState("Görüşme Notu");
  const [isPending, startTransition] = useTransition();

  // Pinned notes first, then chronological descending (newest on top)
  const sorted = [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Not Başlığı / Kaynak:
            </span>
            <select
              name="noteTitleSelector"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-[#0f172a] focus:outline-none"
            >
              <option value="Görüşme Notu">Görüşme Notu</option>
              <option value="Vize & Evrak Notu">Vize &amp; Evrak Notu</option>
              <option value="WhatsApp Görüşmesi">WhatsApp Görüşmesi</option>
              <option value="İş / Okul Yerleştirme">İş / Okul Yerleştirme</option>
              <option value="Ödeme & Taksit Notu">Ödeme &amp; Taksit Notu</option>
              <option value="Özel Not">Özel Not</option>
            </select>
          </div>
          <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {sorted.length} Kayıt · Son eklenen üstte
          </span>
        </div>

        <form action={noteAction} className="space-y-2">
          <input type="hidden" name="noteTitle" value={noteTitle} />
          <div className="flex items-start gap-2">
            <textarea
              name="note"
              rows={2}
              placeholder="Öğrenciyle ilgili görüşme, vize, evrak veya ödeme notunuzu buraya yazın…"
              className="flex-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-[#0f172a] focus:outline-none"
            />
            <SubmitButton />
          </div>
          {!noteState.success && noteState.error && (
            <p className="text-xs text-red-600">{noteState.error}</p>
          )}
        </form>
      </div>

      {/* Scrollable Minimal Note Cards (Newest First) */}
      <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <MessageSquarePlus className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-400">
              Henüz kayıtlı görüşme veya danışman notu bulunmuyor.
            </p>
          </div>
        ) : (
          sorted.map((note) => {
            const parsed = extractNoteTitleAndBody(note.note);
            return (
              <div
                key={note.id}
                className={cn(
                  "group relative rounded-xl border px-3.5 py-2.5 shadow-2xs transition-colors",
                  note.isPinned
                    ? "border-amber-200 bg-amber-50/70"
                    : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 mb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${parsed.badgeClass}`}
                    >
                      {parsed.title}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                      <User className="h-3 w-3 text-slate-400" />
                      {note.authorName}
                    </span>
                    {note.isPinned && (
                      <span className="text-[10px] font-bold text-amber-600">
                        📌 Sabitli
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 tabular-nums">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {formatDateTime(note.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(() => {
                          void toggleNotePin(note.id, !note.isPinned);
                        })
                      }
                      disabled={isPending}
                      className="hidden items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-amber-600 group-hover:inline-flex"
                    >
                      {note.isPinned ? (
                        <PinOff className="h-3 w-3" />
                      ) : (
                        <Pin className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                  {parsed.body}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
