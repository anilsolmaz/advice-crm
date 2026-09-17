// components/portal/documents/DocumentChecklist.tsx
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  FileText,
  HelpCircle,
} from "lucide-react";
import type { CRMDocument } from "@/types/crm";
import { DOCUMENT_TYPE_LABELS } from "@/types/crm";
import { formatDate } from "@/lib/utils/date";

interface Props {
  documents: CRMDocument[];
}

export function DocumentChecklist({ documents }: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Yüklenen Belgelerim</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Belgelerinizin onay durumunu buradan takip edebilirsiniz.
          </p>
        </div>
        <span className="text-xs text-gray-400 font-medium">{documents.length} Evrak</span>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileText className="h-10 w-10 text-gray-200 mb-2" />
          <p className="text-xs text-gray-400">Henüz bir belge yüklemediniz.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {documents.map((doc) => {
            const isApproved = doc.verificationStatus === "APPROVED";
            const isPending = doc.verificationStatus === "PENDING";
            const isRevision = doc.verificationStatus === "REVISION_REQUESTED";

            return (
              <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-gray-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">
                        {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
                      </p>
                      <span className="text-[11px] text-gray-400 truncate max-w-xs">
                        ({doc.fileName})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                      <span>Yükleme: {formatDate(doc.createdAt)}</span>
                      {doc.expiryDate && (
                        <>
                          <span>·</span>
                          <span>Geçerlilik: {formatDate(doc.expiryDate)}</span>
                        </>
                      )}
                    </div>

                    {isRevision && doc.rejectionReason && (
                      <div className="mt-2 rounded-lg bg-red-50 border border-red-100 p-2 text-xs text-red-700">
                        <strong>Danışman Notu:</strong> {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {isApproved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Onaylandı
                    </span>
                  )}

                  {isPending && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <Clock className="h-3.5 w-3.5" />
                      Danışman Onayında
                    </span>
                  )}

                  {isRevision && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Revize İstendi
                    </span>
                  )}

                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    title="Belgeyi İncele"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
