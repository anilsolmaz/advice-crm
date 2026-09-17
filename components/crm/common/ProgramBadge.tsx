// components/crm/common/ProgramBadge.tsx
import React from "react";
import type { Program } from "@prisma/client";
import { Plane, GraduationCap, Languages, Sun, Stamp } from "lucide-react";
import { PROGRAM_LABELS, PROGRAM_STYLES } from "@/types/crm";
import { cn } from "@/lib/utils/cn";

export const PROGRAM_ICONS: Record<Program, React.ElementType> = {
  WORK_AND_TRAVEL: Plane,
  ACADEMY: GraduationCap,
  LANGUAGE_SCHOOL: Languages,
  SUMMER_CAMP: Sun,
  VISA_CONSULTING: Stamp,
};

interface Props {
  program: Program | string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgramBadge({
  program,
  showIcon = false,
  size = "sm",
  className,
}: Props) {
  const pEnum = program as Program;
  const style = PROGRAM_STYLES[pEnum] ?? {
    badge: "bg-gray-50 text-gray-700 border-gray-200",
    text: "text-gray-600",
    dot: "bg-gray-400",
  };
  const label = PROGRAM_LABELS[pEnum] || String(program);
  const Icon = PROGRAM_ICONS[pEnum];

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs font-semibold rounded-lg",
    md: "px-3 py-1 text-xs font-semibold rounded-lg",
    lg: "px-3.5 py-1.5 text-sm font-bold rounded-xl",
  }[size];

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-4.5 w-4.5",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border shadow-2xs font-sans transition-colors",
        sizeClasses,
        style.badge,
        className
      )}
    >
      {showIcon && Icon && <Icon className={cn("shrink-0", iconSizes, style.text)} />}
      <span>{label}</span>
    </span>
  );
}
