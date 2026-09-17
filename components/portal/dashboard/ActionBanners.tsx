// components/portal/dashboard/ActionBanners.tsx
import Link from "next/link";
import { AlertCircle, Clock, FileWarning, ArrowRight } from "lucide-react";

interface ActionBannersProps {
  missingDocsCount: number;
  upcomingPayment?: {
    amount: string;
    currency: string;
    dueDate: Date;
  } | null;
  revisionRequestCount: number;
}

export function ActionBanners({
  missingDocsCount,
  upcomingPayment,
  revisionRequestCount,
}: ActionBannersProps) {
  if (missingDocsCount === 0 && !upcomingPayment && revisionRequestCount === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Revision requested alert */}
      {revisionRequestCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/80 p-4 text-red-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Düzeltme / Revize Talebi Mevcut</p>
              <p className="text-xs text-red-700 mt-0.5">
                Danışmanınız {revisionRequestCount} belgeniz veya bilginiz için revizyon talep etti. Lütfen detayları inceleyip tekrar iletiniz.
              </p>
            </div>
          </div>
          <Link
            href="/bildirimler"
            className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors shrink-0 ml-3"
          >
            <span>İncele</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Missing documents alert */}
      {missingDocsCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <FileWarning className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Yüklenmesi Gereken {missingDocsCount} Belge Var</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Başvurunuzun gecikmemesi için istenen evrakları lütfen sisteme yükleyiniz.
              </p>
            </div>
          </div>
          <Link
            href="/belgelerim"
            className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shrink-0 ml-3"
          >
            <span>Evrak Yükle</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Upcoming installment payment alert */}
      {upcomingPayment && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-blue-900 shadow-sm">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Yaklaşan Taksit Ödemesi</p>
              <p className="text-xs text-blue-700 mt-0.5">
                {new Date(upcomingPayment.dueDate).toLocaleDateString("tr-TR")} tarihli {upcomingPayment.amount} {upcomingPayment.currency} tutarındaki taksit vadeniz yaklaşıyor.
              </p>
            </div>
          </div>
          <Link
            href="/odemelerim"
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shrink-0 ml-3"
          >
            <span>Ödemeler</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
