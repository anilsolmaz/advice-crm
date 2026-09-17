// components/crm/students/modal/StudentModalHeader.tsx
"use client";

import { useTransition } from "react";
import { Printer, FileDown, Camera } from "lucide-react";
import type { CRMStudentDetail, CRMWatDetail } from "@/types/crm";
import { PROGRAM_LABELS } from "@/types/crm";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
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
  const currentStep = getWatCurrentStep(watDetail);
  const isWat = student.program === "WORK_AND_TRAVEL";

  function handleStepClick(step: number) {
    if (!isWat || step <= currentStep) return;
    startTransition(() => {
      advanceWatStep(student.id, step);
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-md">
            {student.user.fullName.charAt(0).toUpperCase()}
          </div>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors"
            title="Fotoğraf yükle"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {student.user.fullName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <ProgramBadge program={student.program} showIcon />
                <span className="text-gray-300">·</span>
                <span>{student.user.email}</span>
                {student.user.phone && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>{student.user.phone}</span>
                  </>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                Kayıt: {formatDate(student.createdAt)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Yazdır
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FileDown className="h-3.5 w-3.5" />
                CV İndir (PDF)
              </button>
            </div>
          </div>

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
