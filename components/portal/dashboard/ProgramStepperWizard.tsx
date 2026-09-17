// components/portal/dashboard/ProgramStepperWizard.tsx
"use client";

import { Check, Clock, Circle } from "lucide-react";
import type { Program } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

export interface ProgramStepItem {
  id: number;
  label: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface Props {
  program: Program;
  steps: ProgramStepItem[];
}

export function ProgramStepperWizard({ program, steps }: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Program İlerleme Durumu</h2>
          <p className="text-xs text-gray-500">
            Aşama durumunuz danışmanınız tarafından güncellenmektedir.
          </p>
        </div>
        <span className="inline-flex items-center self-start sm:self-auto rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {program === "WORK_AND_TRAVEL"
            ? "Work & Travel 2026"
            : program === "ACADEMY"
            ? "Akademi / Üniversite"
            : program === "LANGUAGE_SCHOOL"
            ? "Dil Okulu"
            : program === "SUMMER_CAMP"
            ? "Yaz Okulu"
            : "Vize Danışmanlığı"}
        </span>
      </div>

      {/* Stepper container */}
      <div className="relative">
        <div className="hidden lg:flex items-center justify-between relative">
          {/* Background progress line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 -z-0" />

          {steps.map((step, idx) => {
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center max-w-[140px] text-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all shadow-sm",
                    step.isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : step.isCurrent
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-100"
                      : "border-gray-200 bg-white text-gray-400"
                  )}
                >
                  {step.isCompleted ? (
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  ) : step.isCurrent ? (
                    <Clock className="h-5 w-5 animate-spin-slow text-blue-600" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-3 text-xs font-semibold",
                    step.isCompleted
                      ? "text-gray-900"
                      : step.isCurrent
                      ? "text-blue-600"
                      : "text-gray-400"
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-[11px] text-gray-400 leading-tight">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Vertical Stepper for Mobile / Tablet */}
        <div className="lg:hidden space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3 relative">
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-4 top-8 -bottom-4 w-0.5",
                    step.isCompleted ? "bg-emerald-500" : "bg-gray-200"
                  )}
                />
              )}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold z-10",
                  step.isCompleted
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : step.isCurrent
                    ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                    : "border-gray-200 bg-white text-gray-400"
                )}
              >
                {step.isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              <div className="pt-0.5">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    step.isCompleted
                      ? "text-gray-900"
                      : step.isCurrent
                      ? "text-blue-600"
                      : "text-gray-400"
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
