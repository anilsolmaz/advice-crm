// app/(crm)/[program]/notifications/page.tsx
import { requireStaff } from "@/lib/auth/session";
import { BulkMarketingPanel } from "@/components/crm/marketing/BulkMarketingPanel";
import { getProgramFromSlug, PROGRAM_TITLES } from "@/lib/utils/programs";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { PROGRAM_LABELS } from "@/types/crm";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    program: string;
  };
}

export default async function ProgramNotificationsPage({ params }: Props) {
  await requireStaff();
  const program = getProgramFromSlug(params.program) ?? undefined;
  const title = PROGRAM_TITLES[params.program] || (program ? PROGRAM_LABELS[program] : "");

  return (
    <div className="space-y-6">
      <div>
        {program && (
          <div className="flex items-center gap-2 mb-2">
            <ProgramBadge program={program} showIcon size="md" />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {title ? `${title} — ` : ""}Toplu Bildirim & Pazarlama
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Bu programın leadlerine ve kayıtlı öğrencilerine hedeflenmiş SMS veya E-posta duyuruları iletin.
        </p>
      </div>

      <BulkMarketingPanel initialProgram={program} />
    </div>
  );
}
