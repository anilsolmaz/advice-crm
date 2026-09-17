// components/crm/students/modal/tabs/EducationWorkTab.tsx
"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import type { CRMStudentProfile, CRMAcademyDetail } from "@/types/crm";
import { ACADEMIC_LEVEL_LABELS } from "@/types/crm";
import { updateStudentProfile, updateAcademyDetail } from "@/actions/crm/students";

type WorkExperience = { employer: string; role: string; years: string };

interface Props {
  profile: CRMStudentProfile | null;
  academyDetail: CRMAcademyDetail | null;
  studentId: string;
}

export function EducationWorkTab({ profile, academyDetail, studentId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [workHistory, setWorkHistory] = useState<WorkExperience[]>([]);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => {
      updateStudentProfile(studentId, {
        highSchoolName: fd.get("highSchoolName") as string,
        highSchoolGpa: fd.get("highSchoolGpa") as string,
        universityName: fd.get("universityName") as string,
        universityGpa: fd.get("universityGpa") as string,
      });
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Lise Bilgileri">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Lise Adı" name="highSchoolName" defaultValue={profile?.highSchoolName ?? ""} />
          <FormField label="Lise Not Ortalaması" name="highSchoolGpa" defaultValue={profile?.highSchoolGpa ?? ""} type="number" step="0.01" min="0" max="4" />
        </div>
      </Section>

      <Section title="Üniversite Bilgileri">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Üniversite Adı" name="universityName" defaultValue={profile?.universityName ?? ""} />
          <FormField label="Üniversite Not Ortalaması" name="universityGpa" defaultValue={profile?.universityGpa ?? ""} type="number" step="0.01" min="0" max="4" />
          <div>
            <label htmlFor="academicLevel" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Öğrenim Seviyesi</label>
            <select id="academicLevel" name="academicLevel" defaultValue={profile?.academicLevel ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">Seçiniz</option>
              {Object.entries(ACADEMIC_LEVEL_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <FormField label="Bölüm" name="fieldOfStudy" defaultValue={profile?.fieldOfStudy ?? ""} />
        </div>
      </Section>

      {academyDetail && (
        <Section title="Dil Sınavı Skorları">
          <div className="grid grid-cols-3 gap-4">
            <FormField label="IELTS Genel" name="ieltsOverall" defaultValue={academyDetail.ieltsOverall ?? ""} type="number" step="0.5" />
            <FormField label="IELTS Listening" name="ieltsListening" defaultValue={academyDetail.ieltsListening ?? ""} type="number" step="0.5" />
            <FormField label="IELTS Reading" name="ieltsReading" defaultValue={academyDetail.ieltsReading ?? ""} type="number" step="0.5" />
            <FormField label="IELTS Writing" name="ieltsWriting" defaultValue={academyDetail.ieltsWriting ?? ""} type="number" step="0.5" />
            <FormField label="IELTS Speaking" name="ieltsSpeaking" defaultValue={academyDetail.ieltsSpeaking ?? ""} type="number" step="0.5" />
            <FormField label="TOEFL Toplam" name="toeflTotal" defaultValue={academyDetail.toeflTotal?.toString() ?? ""} type="number" />
          </div>
        </Section>
      )}

      <Section
        title="İş Deneyimi"
        action={
          <button type="button" onClick={() => setWorkHistory(p => [...p, { employer: "", role: "", years: "" }])} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
            <Plus className="h-3.5 w-3.5" /> Ekle
          </button>
        }
      >
        {workHistory.length === 0 && <p className="text-xs text-gray-400">İş deneyimi eklenmemiş.</p>}
        {workHistory.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <input placeholder="İşveren" value={w.employer} onChange={(e) => { const n = [...workHistory]; n[i].employer = e.target.value; setWorkHistory(n); }} className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
            <input placeholder="Pozisyon" value={w.role} onChange={(e) => { const n = [...workHistory]; n[i].role = e.target.value; setWorkHistory(n); }} className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
            <input placeholder="Yıl" value={w.years} onChange={(e) => { const n = [...workHistory]; n[i].years = e.target.value; setWorkHistory(n); }} className="w-16 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
            <button type="button" onClick={() => setWorkHistory(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </Section>

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Save className="h-4 w-4" />
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormField({ label, name, defaultValue, type = "text", step, min, max }: { label: string; name: string; defaultValue?: string; type?: string; step?: string; min?: string; max?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} step={step} min={min} max={max} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200" />
    </div>
  );
}
