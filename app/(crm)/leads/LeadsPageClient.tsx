// app/(crm)/leads/LeadsPageClient.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { LeadTable } from "@/components/crm/leads/LeadTable";
import type { CRMLeadRow } from "@/types/crm";

export default function LeadsPageClient({
  initialLeads,
}: {
  initialLeads: CRMLeadRow[];
}) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leadler</h1>
          <p className="text-sm text-gray-500">
            {initialLeads.length} aday kaydı
          </p>
        </div>
        <a
          href="/leads/new"
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Lead Ekle
        </a>
      </div>

      <LeadTable
        leads={initialLeads}
        onOpenLead={(id) => setSelectedLeadId(id)}
      />
    </div>
  );
}
