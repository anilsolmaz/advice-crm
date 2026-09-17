// components/crm/students/modal/tabs/EmergencyContactTab.tsx
"use client";

import { useTransition } from "react";
import { Save } from "lucide-react";
import type { CRMStudentProfile } from "@/types/crm";
import { updateStudentProfile } from "@/actions/crm/students";

interface Props {
  profile: CRMStudentProfile | null;
  studentId: string;
}

export function EmergencyContactTab({ profile, studentId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => {
      updateStudentProfile(studentId, {
        emergencyContactName: fd.get("emergencyContactName") as string,
        emergencyContactRelationship: fd.get("emergencyContactRelationship") as string,
        emergencyContactPhone: fd.get("emergencyContactPhone") as string,
        passportNumber: fd.get("passportNumber") as string,
        passportCountry: fd.get("passportCountry") as string,
      });
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Acil İletişim Kişisi">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ad Soyad" name="emergencyContactName" defaultValue={profile?.emergencyContactName ?? ""} />
          <FormField label="Yakınlık Derecesi" name="emergencyContactRelationship" defaultValue={profile?.emergencyContactRelationship ?? ""} />
          <FormField label="Telefon" name="emergencyContactPhone" defaultValue={profile?.emergencyContactPhone ?? ""} type="tel" />
        </div>
      </Section>

      <Section title="Pasaport Bilgileri">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Pasaport No" name="passportNumber" defaultValue={profile?.passportNumber ?? ""} />
          <FormField label="Düzenleme Ülkesi" name="passportCountry" defaultValue={profile?.passportCountry ?? ""} />
          <FormField label="Düzenleme Tarihi" name="passportIssueDate" defaultValue={profile?.passportIssueDate ? new Date(profile.passportIssueDate).toISOString().split("T")[0] : ""} type="date" />
          <FormField label="Geçerlilik Tarihi" name="passportExpiry" defaultValue={profile?.passportExpiry ? new Date(profile.passportExpiry).toISOString().split("T")[0] : ""} type="date" />
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormField({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue?: string; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200" />
    </div>
  );
}
