// components/crm/students/modal/StudentModalHeader.tsx
"use client";

import { useState, useTransition } from "react";
import { Printer, Camera, MessageCircle, Mail, Phone, User } from "lucide-react";
import type { CRMStudentDetail, CRMWatDetail } from "@/types/crm";
import { PROGRAM_LABELS } from "@/types/crm";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { EmailComposeModal } from "@/components/crm/common/EmailComposeModal";
import { GenderAvatar } from "@/components/crm/common/GenderAvatar";
import { advanceWatStep } from "@/actions/crm/students";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/date";

// ── WAT 6-step progress stepper ───────────────────────────────────────────────

const WAT_STEPS = [
  { step: 1, label: "Kayıt Alındı" },
  { step: 2, label: "İş Seçimi" },
  { step: 3, label: "DS Bekleniyor" },
  { step: 4, label: "DS Geldi" },
  { step: 5, label: "Vize Randevusu" },
  { step: 6, label: "Vizesini Aldı" },
];

function getWatCurrentStep(watDetail: CRMWatDetail | null): number {
  if (!watDetail) return 1;
  if (watDetail.visaApproved) return 6;
  if (watDetail.visaInterviewDate) return 5;
  if (watDetail.usArrivalDate) return 4;
  if (watDetail.sponsorDsNumber) return 3;
  if (watDetail.jobStartDate) return 2;
  return 1;
}

interface Props {
  student: CRMStudentDetail;
  watDetail: CRMWatDetail | null;
}

export function StudentModalHeader({ student, watDetail }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const currentStep = getWatCurrentStep(watDetail);
  const isWat = student.program === "WORK_AND_TRAVEL";
  const cleanWaPhone = (student.user.phone || "").replace(/\D/g, "").replace(/^0/, "");

  function handleStepClick(step: number) {
    if (!isWat || step <= currentStep) return;
    startTransition(() => {
      advanceWatStep(student.id, step);
    });
  }

  const cleanAdvisor = (student.user as any)?.advisor?.fullName || (student as any).advisorName;
  const cleanAdvisorText = cleanAdvisor
    ? cleanAdvisor.replace(/\s*\(\s*Danışman\s*\)/gi, "").trim()
    : "Atanmamış";

  return (
    <div className="p-6">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <GenderAvatar
            avatarUrl={student.user.avatarUrl}
            gender={student.profile?.gender}
            name={student.user.fullName}
            size="xl"
            className="ring-2 ring-slate-100"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {student.user.fullName}
                </h2>
                <ProgramBadge program={student.program} showIcon size="sm" />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs">
                {student.user.phone && (
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {student.user.phone}
                  </span>
                )}
                {student.user.email && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {student.user.email}
                    </span>
                  </>
                )}
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  Danışman:{" "}
                  <strong className="text-[#1e3a8a]">{cleanAdvisorText}</strong>
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Kayıt Tarihi: {formatDate(student.createdAt)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 mr-8">
              {student.user.phone && (
                <a
                  href={`https://wa.me/90${cleanWaPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#1e3a8a] px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-800 transition-colors shadow-xs"
              >
                <Mail className="h-4 w-4 text-sky-300" />
                Mail Gönder
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Printer className="h-4 w-4" />
                Yazdır
              </button>
            </div>
          </div>

          {showEmailModal && (
            <EmailComposeModal
              recipientName={student.user.fullName}
              recipientEmail={student.user.email}
              programLabel={PROGRAM_LABELS[student.program]}
              studentId={student.id}
              onClose={() => setShowEmailModal(false)}
            />
          )}

          {/* WAT progress stepper */}
          {isWat && (
            <div className="mt-4">
              <div className="flex items-center gap-1">
                {WAT_STEPS.map((s, i) => {
                  const isDone = s.step <= currentStep;
                  const isNext = s.step === currentStep + 1;
                  const isClickable = isNext && !isPending;
                  return (
                    <div key={s.step} className="flex items-center">
                      {i > 0 && (
                        <div
                          className={cn(
                            "h-px w-8 flex-shrink-0",
                            isDone ? "bg-blue-500" : "bg-gray-200",
                          )}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleStepClick(s.step)}
                        disabled={!isClickable}
                        title={
                          isClickable
                            ? `"${s.label}" adımına geç`
                            : s.label
                        }
                        className={cn(
                          "flex flex-col items-center gap-1 group",
                          isClickable && "cursor-pointer",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                            isDone
                              ? "border-blue-600 bg-blue-600 text-white"
                              : isNext
                                ? "border-blue-300 bg-white text-blue-400 group-hover:border-blue-500"
                                : "border-gray-200 bg-white text-gray-300",
                          )}
                        >
                          {isDone ? "✓" : s.step}
                        </div>
                        <span
                          className={cn(
                            "text-[9px] font-medium leading-tight text-center max-w-[56px]",
                            isDone
                              ? "text-blue-700"
                              : isNext
                                ? "text-blue-400"
                                : "text-gray-300",
                          )}
                        >
                          {s.label}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
