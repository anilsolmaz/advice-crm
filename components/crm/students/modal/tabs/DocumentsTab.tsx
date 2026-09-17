// components/crm/students/modal/tabs/DocumentsTab.tsx
"use client";

import { useTransition } from "react";
import { Upload, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import type { CRMDocument, VerificationStatus } from "@/types/crm";
import { DOCUMENT_TYPE_LABELS } from "@/types/crm";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const STATUS_CONFIG: Record<
  VerificationStatus,
  { icon: React.ElementType; label: string; color: string; bg: string }
> = {
  APPROVED: {
    icon: CheckCircle,
    label: "Onaylandı",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  PENDING: {
    icon: Clock,
    label: "Bekliyor",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  REVISION_REQUESTED: {
    icon: XCircle,
    label: "Eksik / Revize",
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

interface Props {
  documents: CRMDocument[];
  studentId: string;
}

export function DocumentsTab({ documents, studentId }: Props) {
  const stats = {
    approved: documents.filter((d) => d.verificationStatus === "APPROVED").length,
    pending: documents.filter((d) => d.verificationStatus === "PENDING").length,
    revision: documents.filter((d) => d.verificationStatus === "REVISION_REQUESTED").length,
  };

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <StatusCard label="Onaylı Belge" count={stats.approved} color="emerald" />
        <StatusCard label="İnceleniyor" count={stats.pending} color="amber" />
        <StatusCard label="Eksik / Revize" count={stats.revision} color="red" />
      </div>

      {/* Upload button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
          <Upload className="h-4 w-4" />
          Belge Yükle
        </button>
      </div>

      {/* Document list */}
      {documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Upload className="h-12 w-12 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Henüz belge yüklenmemiş.</p>
        </div>
      )}

      <div className="space-y-2">
        {documents.map((doc) => {
          const config = STATUS_CONFIG[doc.verificationStatus];
          const Icon = config.icon;
          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:bg-gray-50 transition-colors"
            >
              {/* Status icon */}
              <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg", config.bg)}>
                <Icon className={cn("h-4.5 w-4.5", config.color)} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {DOCUMENT_TYPE_LABELS[doc.type]}
                </p>
                <p className="text-xs text-gray-400 truncate">{doc.fileName}</p>
                {doc.expiryDate && (
                  <p className="text-xs text-gray-400">
                    Son geçerlilik: {formatDate(doc.expiryDate)}
                  </p>
                )}
                {doc.rejectionReason && (
                  <p className="mt-0.5 text-xs text-red-500">{doc.rejectionReason}</p>
                )}
              </div>

              {/* Status badge */}
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  config.bg,
                  config.color,
                )}
              >
                {config.label}
              </span>

              {/* View link */}
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "emerald" | "amber" | "red";
}) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className={cn("rounded-xl p-4 text-center", styles[color])}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
    </div>
  );
}
