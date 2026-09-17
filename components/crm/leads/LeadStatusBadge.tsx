// components/crm/leads/LeadStatusBadge.tsx
import type { LeadStatus } from "@/types/crm";
import { LEAD_STATUS_LABELS } from "@/types/crm";
import { cn } from "@/lib/utils/cn";

const STATUS_STYLES: Record<LeadStatus, string> = {
  INTERESTED:            "bg-blue-100 text-blue-700 border-blue-200",
  CONSIDERING_NEXT_YEAR: "bg-amber-100 text-amber-700 border-amber-200",
  UNINTERESTED:          "bg-gray-100 text-gray-500 border-gray-200",
  NOT_CONSIDERING:       "bg-red-100 text-red-600 border-red-200",
  REGISTERED:            "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
