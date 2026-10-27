// components/crm/students/modal/StudentModal.tsx
// Root modal shell — renders header, vertical tab list, and active tab panel.
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { StudentModalHeader } from "./StudentModalHeader";
import { PersonalTab } from "./tabs/PersonalTab";
import { EmergencyContactTab } from "./tabs/EmergencyContactTab";
import { EducationWorkTab } from "./tabs/EducationWorkTab";
import { JobPlacementTab } from "./tabs/JobPlacementTab";
import { PaymentsTab } from "./tabs/PaymentsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { HistoryTab } from "./tabs/HistoryTab";
import type {
  CRMStudentDetail,
  CRMWatDetail,
  CRMAcademyDetail,
  CRMDocument,
  CRMPayment,
  CRMAdvisorNote,
} from "@/types/crm";
import { cn } from "@/lib/utils/cn";

type TabKey =
  | "personal"
  | "emergency"
  | "education"
  | "job"
  | "payments"
  | "documents"
  | "history";

const TABS: { key: TabKey; label: string }[] = [
  { key: "personal", label: "Kişisel Bilgiler" },
  { key: "emergency", label: "Acil Kişi" },
  { key: "education", label: "Eğitim & İş" },
  { key: "job", label: "İş Yerleştirme" },
  { key: "payments", label: "Ödemeler" },
  { key: "documents", label: "Belgeler" },
  { key: "history", label: "Geçmiş" },
];

export interface StudentModalProps {
  student: CRMStudentDetail;
  watDetail: CRMWatDetail | null;
  academyDetail: CRMAcademyDetail | null;
  languageDetail?: any;
  summerCampDetail?: any;
  visaDetail?: any;
  documents: CRMDocument[];
  payments: CRMPayment[];
  notes: CRMAdvisorNote[];
  onClose: () => void;
}

export function StudentModal({
  student,
  watDetail,
  academyDetail,
  languageDetail,
  summerCampDetail,
  visaDetail,
  documents,
  payments,
  notes,
  onClose,
}: StudentModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("history");

  const programTabLabel: Record<string, string> = {
    WORK_AND_TRAVEL: "İş Yerleştirme",
    ACADEMY: "Okul & Başvuru",
    LANGUAGE_SCHOOL: "Okul & Konaklama",
    SUMMER_CAMP: "Kamp & Operasyon",
    VISA_CONSULTING: "Vize & Randevu",
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "history", label: `İletişim & Notlar (${notes.length})` },
    { key: "job", label: programTabLabel[student.program] || "Program Operasyonu" },
    { key: "documents", label: `Belgeler (${documents.length})` },
    { key: "payments", label: "Ödemeler & Taksit" },
    { key: "personal", label: "Kişisel Bilgiler" },
    { key: "education", label: "Eğitim & İş" },
    { key: "emergency", label: "Acil Durum Kişisi" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex h-full max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="relative border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
          <StudentModalHeader
            student={student}
            watDetail={watDetail}
          />
        </div>

        {/* ── 2. ALT SEKME BARI (Horizontal Tabs Below Profile Card) ── */}
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/80 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "border-b-2 px-4 py-3 text-xs font-bold transition-colors",
                activeTab === tab.key
                  ? "border-[#0f172a] bg-white text-[#0f172a]"
                  : "border-transparent text-slate-500 hover:text-slate-900",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 3. SEKME İÇERİĞİ ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "personal" && (
            <PersonalTab student={student} />
          )}
          {activeTab === "emergency" && (
            <EmergencyContactTab profile={student.profile} studentId={student.id} />
          )}
          {activeTab === "education" && (
            <EducationWorkTab
              profile={student.profile}
              academyDetail={academyDetail}
              studentId={student.id}
            />
          )}
          {activeTab === "job" && (
            <JobPlacementTab
              watDetail={watDetail}
              academyDetail={academyDetail}
              languageDetail={languageDetail}
              summerCampDetail={summerCampDetail}
              visaDetail={visaDetail}
              studentId={student.id}
              program={student.program}
            />
          )}
          {activeTab === "payments" && (
            <PaymentsTab payments={payments} studentId={student.id} />
          )}
          {activeTab === "documents" && (
            <DocumentsTab documents={documents} studentId={student.id} />
          )}
          {activeTab === "history" && (
            <HistoryTab notes={notes} studentId={student.id} student={student} />
          )}
        </div>
      </div>
    </div>
  );
}
