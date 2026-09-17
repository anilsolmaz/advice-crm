// app/(crm)/[program]/marketing/page.tsx
import { requireStaff } from "@/lib/auth/session";
import { BulkMarketingPanel } from "@/components/crm/marketing/BulkMarketingPanel";
import type { Program } from "@prisma/client";

interface Props {
  params: {
    program: string;
  };
}

function resolveProgramFromParam(slug: string): Program | undefined {
  switch (slug) {
    case "wat":
      return "WORK_AND_TRAVEL";
    case "academy":
      return "ACADEMY";
    case "language":
      return "LANGUAGE_SCHOOL";
    case "summer-camp":
      return "SUMMER_CAMP";
    case "visa":
      return "VISA_CONSULTING";
    default:
      return undefined;
  }
}

export default async function MarketingPage({ params }: Props) {
  await requireStaff();
  const program = resolveProgramFromParam(params.program);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Toplu Bildirim & Pazarlama</h1>
        <p className="text-xs text-gray-500 mt-1">
          Leadlerinize ve kayıtlı öğrencilerinize hedeflenmiş SMS veya E-posta kampanyaları gönderin.
        </p>
      </div>

      <BulkMarketingPanel initialProgram={program} />
    </div>
  );
}
