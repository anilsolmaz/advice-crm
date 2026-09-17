// components/portal/dashboard/AdvisorCard.tsx
import { Mail, Phone, Calendar, UserCheck, MessageSquare } from "lucide-react";

interface AdvisorProps {
  advisor: {
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
  officeNote?: string | null;
}

export function AdvisorCard({ advisor, officeNote }: AdvisorProps) {
  if (!advisor) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center">
        <UserCheck className="h-10 w-10 text-gray-300 mb-2" />
        <h3 className="text-sm font-semibold text-gray-700">Danışman Ataması Bekleniyor</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Kaydınız inceleniyor. En kısa sürede size özel bir yurtdışı eğitim danışmanı atanacaktır.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <UserCheck className="h-4 w-4 text-blue-600" />
        <span>Atanmış Danışmanınız</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 text-xl font-bold shadow-sm">
          {advisor.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-gray-900 truncate">{advisor.fullName}</h3>
          <p className="text-xs text-blue-600 font-medium">Yurtdışı Eğitim Danışmanı</p>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-500">
            <a
              href={`mailto:${advisor.email}`}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{advisor.email}</span>
            </a>
            {advisor.phone && (
              <a
                href={`tel:${advisor.phone}`}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{advisor.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {officeNote && (
        <div className="mt-4 rounded-xl bg-blue-50/70 p-3.5 border border-blue-100/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 mb-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Danışman Notu</span>
          </div>
          <p className="text-xs text-blue-900/80 leading-relaxed">{officeNote}</p>
        </div>
      )}
    </div>
  );
}
