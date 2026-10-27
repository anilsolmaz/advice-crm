// app/(crm)/leads/new/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NewLeadModal } from "@/components/crm/leads/NewLeadModal";

export default function NewLeadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProgram = searchParams.get("program") || "WORK_AND_TRAVEL";

  return (
    <NewLeadModal
      preselectedProgram={preselectedProgram}
      onClose={() => router.push("/leads")}
      onSuccess={() => router.push("/leads")}
    />
  );
}
