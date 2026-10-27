// components/portal/program/ProgramAccordionList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Briefcase,
  GraduationCap,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  History,
  UserCheck,
  MapPin,
} from "lucide-react";
import { ProgramStepperWizard, type ProgramStepItem } from "@/components/portal/dashboard/ProgramStepperWizard";
import { InteractiveDocumentGrid } from "@/components/portal/documents/InteractiveDocumentGrid";
import { Ds160FormSection } from "@/components/portal/dashboard/Ds160FormSection";
import type { RequiredDocConfig } from "@/lib/portal/programConfig";
import { formatAcademicAppStatus } from "@/types/crm";

export interface SerializedEnrollmentItem {
  id: string;
  program: string;
  programLabel: string;
  termYear: number;
  enrollmentLabel: string;
  isActive: boolean;
  advisor: {
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
  steps: ProgramStepItem[];
  currentStepLabel: string;
  requiredDocs: RequiredDocConfig[];
  documents: {
    id: string;
    type: any;
    fileName: string;
    fileUrl: string;
    verificationStatus: "APPROVED" | "PENDING" | "REVISION_REQUESTED";
    rejectionReason?: string | null;
  }[];
  watDetail: {
    sponsorName: string | null;
    sponsorDsNumber: string | null;
    employerName: string | null;
    employerState: string | null;
    jobTitle: string | null;
    sevisId: string | null;
    visaInterviewDate: string | null;
    visaApproved: boolean;
    ds160Status: string;
    ds160ConfirmationNo: string | null;
    ds160Data: Record<string, any> | null;
  } | null;
  watJobAssignments: {
    id: string;
    shareToken: string;
    status: string;
    studentNote: string | null;
    createdAt: string;
    respondedAt: string | null;
    assignedByName: string;
    job: {
      jobTitle: string;
      sponsor: string;
      location: string;
      position: string | null;
      hourlyWage: string;
    };
  }[];
  academicApplications: {
    id: string;
    appCode: string;
    institutionName: string;
    country: string;
    courseName: string;
    degree: string;
    intake: string;
    priority: number;
    status: string;
  }[];
  languageDetail: {
    targetCountry: string | null;
    targetCity: string | null;
    schoolName: string | null;
    courseType: string | null;
    weeksDuration: number | null;
    accommodationType: string | null;
    agreementsDone: boolean;
    agreementsSignedDone: boolean;
    grossInvoiceDone: boolean;
    netInvoiceDone: boolean;
    letterOfAcceptanceDone: boolean;
  } | null;
  summerCampDetail: {
    targetCountry: string | null;
    campName: string | null;
    programType: string | null;
    ageGroup: string | null;
    visaStatus: string | null;
  } | null;
  visaDetail: {
    destinationCountry: string;
    visaType: string;
    targetConsulate: string | null;
    appointmentDate: string | null;
    decisionStatus: string | null;
  } | null;
  activityLogs: {
    id: string;
    actionType: string;
    title: string;
    description: string | null;
    actorName: string | null;
    createdAt: string;
  }[];
}

interface Props {
  enrollments: SerializedEnrollmentItem[];
}

export function ProgramAccordionList({ enrollments }: Props) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (enrollments.length > 0) {
      initial[enrollments[0].id] = true;
    }
    return initial;
  });

  function toggleExpand(id: string) {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <div className="space-y-5">
      {enrollments.map((enrollment) => {
        const isExpanded = Boolean(expandedIds[enrollment.id]);
        const approvedCount = enrollment.documents.filter(
          (d) => d.verificationStatus === "APPROVED",
        ).length;
        const pendingCount = enrollment.documents.filter(
          (d) => d.verificationStatus === "PENDING",
        ).length;
        const totalRequired = enrollment.requiredDocs.length;

        return (
          <div
            key={enrollment.id}
            className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all"
          >
            {/* Expandable Header */}
            <button
              type="button"
              onClick={() => toggleExpand(enrollment.id)}
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f172a] text-white font-bold text-sm shadow-xs">
                  {enrollment.termYear}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {enrollment.enrollmentLabel}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        enrollment.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {enrollment.isActive ? "Aktif Dönem" : "Tamamlandı / Arşiv"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Güncel Aşama:{" "}
                    <span className="font-semibold text-blue-700">
                      {enrollment.currentStepLabel}
                    </span>
                    {enrollment.advisor && (
                      <>
                        {" "}
                        · Danışman:{" "}
                        <span className="font-medium text-slate-700">
                          {enrollment.advisor.fullName}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <p className="text-[11px] font-medium text-slate-400">
                    Zorunlu Belge Durumu
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    <span className="text-emerald-600">{approvedCount} Onaylı</span>
                    {pendingCount > 0 && (
                      <span className="text-amber-600"> · {pendingCount} Bekleyen</span>
                    )}
                    <span className="text-slate-400"> / {totalRequired} Belge</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                  <span>{isExpanded ? "Daralt" : "Detayları Gör"}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Body */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/40 p-6 space-y-6">
                {/* 1. Program Stepper Wizard */}
                <ProgramStepperWizard
                  program={enrollment.program as any}
                  steps={enrollment.steps}
                />

                {/* 2. Interactive Document Grid (Specific to this program enrollment) */}
                <InteractiveDocumentGrid
                  studentId={enrollment.id}
                  programLabel={`${enrollment.programLabel} ${enrollment.termYear}`}
                  requiredDocs={enrollment.requiredDocs}
                  uploadedDocs={enrollment.documents}
                />

                {/* 3. Program-Specific Details & History */}
                {enrollment.program === "WORK_AND_TRAVEL" && (
                  <div className="space-y-6">
                    {/* WAT Placement & Visa Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 text-slate-900">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                          <h3 className="text-sm font-bold">
                            Aktif İş Yerleştirme & Sponsor Bilgileri
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-slate-400">Sponsor Kurum</p>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {enrollment.watDetail?.sponsorName || "Henüz atanmadı"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-slate-400">DS-2019 Numarası</p>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {enrollment.watDetail?.sponsorDsNumber || "Bekleniyor"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-slate-400">Onaylı İşveren / Eyalet</p>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {enrollment.watDetail?.employerName
                                ? `${enrollment.watDetail.employerName}${
                                    enrollment.watDetail.employerState
                                      ? ` (${enrollment.watDetail.employerState})`
                                      : ""
                                  }`
                                : "İş seçimi bekleniyor"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-slate-400">Pozisyon</p>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {enrollment.watDetail?.jobTitle || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 text-slate-900">
                          <Calendar className="h-4 w-4 text-indigo-600" />
                          <h3 className="text-sm font-bold">
                            SEVIS & J-1 Vize Randevu Takibi
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-slate-400">SEVIS ID</p>
                            <p className="font-mono font-bold text-slate-900 mt-0.5">
                              {enrollment.watDetail?.sevisId || "Henüz girilmedi"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-slate-400">DS-160 Form Durumu</p>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {enrollment.watDetail?.ds160Status === "COMPLETED" ||
                              enrollment.watDetail?.ds160Status === "SUBMITTED" ||
                              enrollment.watDetail?.ds160Status === "APPROVED"
                                ? "Danışmana İletildi"
                                : enrollment.watDetail?.ds160Status === "DRAFT"
                                ? "Taslak"
                                : "Giriş Bekleniyor"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-slate-400">Vize Mülakat Tarihi</p>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {enrollment.watDetail?.visaInterviewDate || "Planlanıyor"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-slate-400">Vize Sonucu</p>
                            <p
                              className={`font-bold mt-0.5 ${
                                enrollment.watDetail?.visaApproved
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {enrollment.watDetail?.visaApproved
                                ? "Onaylandı"
                                : "Süreç Devam Ediyor"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* WAT Job Offer History (Active & Past/Declined Offers) */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <History className="h-5 w-5 text-blue-600" />
                          <h3 className="text-sm font-bold text-slate-900">
                            İş Tekliflerim &amp; Teklif Geçmişi
                          </h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Toplam {enrollment.watJobAssignments.length} Teklif Kaydı
                        </span>
                      </div>

                      {enrollment.watJobAssignments.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                          Henüz tarafınıza atanmış bir iş teklifi bulunmamaktadır. Danışmanınız iş havuzundan atama yaptığında burada listelenecektir.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {enrollment.watJobAssignments.map((assignment) => {
                            const isAccepted = assignment.status === "ACCEPTED";
                            const isDeclined = assignment.status === "DECLINED";
                            const isPending = !isAccepted && !isDeclined;

                            return (
                              <div
                                key={assignment.id}
                                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                                  isPending
                                    ? "border-blue-200 bg-blue-50/40"
                                    : isAccepted
                                      ? "border-emerald-200 bg-emerald-50/30"
                                      : "border-slate-200 bg-slate-50/70"
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                        isAccepted
                                          ? "bg-emerald-100 text-emerald-800"
                                          : isDeclined
                                            ? "bg-rose-100 text-rose-800"
                                            : "bg-blue-600 text-white"
                                      }`}
                                    >
                                      {isAccepted ? (
                                        <>
                                          <CheckCircle2 className="h-3 w-3" /> Kabul Edildi
                                        </>
                                      ) : isDeclined ? (
                                        <>
                                          <XCircle className="h-3 w-3" /> Reddedildi
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="h-3 w-3" /> Yanıtınızı Bekliyor
                                        </>
                                      )}
                                    </span>
                                    <p className="text-sm font-bold text-slate-900">
                                      {assignment.job.jobTitle} ({assignment.job.location})
                                    </p>
                                    <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                      ${assignment.job.hourlyWage}/saat
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-600">
                                    Sponsor: <strong>{assignment.job.sponsor}</strong> · Pozisyon:{" "}
                                    <strong>{assignment.job.position || "Genel"}</strong> · Atayan Danışman:{" "}
                                    <strong>{assignment.assignedByName}</strong> ({assignment.createdAt})
                                  </p>

                                  {assignment.respondedAt && (
                                    <p className="text-[11px] text-slate-500">
                                      Yanıt Tarihi: {assignment.respondedAt}
                                      {assignment.studentNote && (
                                        <span className="ml-2 font-medium text-slate-700">
                                          · Notunuz: &ldquo;{assignment.studentNote}&rdquo;
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Link
                                    href={`/job-offer/${assignment.shareToken}`}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                                      isPending
                                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    <span>
                                      {isPending
                                        ? "Teklifi İncele & Yanıtla"
                                        : "Teklif Detayını Gör"}
                                    </span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* DS-160 Worksheet */}
                    {enrollment.watDetail && (
                      <Ds160FormSection
                        studentId={enrollment.id}
                        initialStatus={enrollment.watDetail.ds160Status}
                        initialConfirmationNo={enrollment.watDetail.ds160ConfirmationNo}
                        initialData={enrollment.watDetail.ds160Data}
                      />
                    )}
                  </div>
                )}

                {/* ACADEMY Applications */}
                {enrollment.program === "ACADEMY" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Üniversite Başvurularım
                      </h3>
                    </div>
                    {enrollment.academicApplications.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        Henüz oluşturulmuş üniversite başvurusu bulunmuyor.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {enrollment.academicApplications.map((app) => (
                          <div
                            key={app.id}
                            className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-900">
                                {app.priority}. Tercih: {app.institutionName} ({app.country})
                              </p>
                              <p className="text-slate-500 mt-0.5">
                                {app.courseName} · {app.degree} · Dönem: {app.intake}
                              </p>
                            </div>
                            {(() => {
                              const st = formatAcademicAppStatus(app.status);
                              return (
                                <span
                                  className={`rounded-full border px-3 py-1 font-bold ${st.badgeClass}`}
                                >
                                  {st.label}
                                </span>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* LANGUAGE SCHOOL Details */}
                {enrollment.program === "LANGUAGE_SCHOOL" && enrollment.languageDetail && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Dil Okulu & Konaklama Bilgileri
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-400">Ülke / Şehir</p>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {enrollment.languageDetail.targetCountry || "—"}{" "}
                          {enrollment.languageDetail.targetCity
                            ? `/ ${enrollment.languageDetail.targetCity}`
                            : ""}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-400">Dil Okulu</p>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {enrollment.languageDetail.schoolName || "Seçiliyor"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-400">Program & Süre</p>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {enrollment.languageDetail.courseType || "Genel"} (
                          {enrollment.languageDetail.weeksDuration || "—"} Hafta)
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-400">Kabul Mektubu (LOA)</p>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {enrollment.languageDetail.letterOfAcceptanceDone
                            ? "Onaylandı / Hazır"
                            : "Bekleniyor"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUMMER CAMP Details */}
                {enrollment.program === "SUMMER_CAMP" && enrollment.summerCampDetail && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Yaz Kampı Detayları
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-400">Ülke</p>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {enrollment.summerCampDetail.targetCountry || "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-400">Kamp Merkezi</p>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {enrollment.summerCampDetail.campName || "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-400">Yaş Grubu</p>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {enrollment.summerCampDetail.ageGroup || "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-400">Vize Durumu</p>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {enrollment.summerCampDetail.visaStatus || "Süreçte"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Log for this Program Enrollment */}
                {enrollment.activityLogs.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-slate-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Bu Programa Ait Son İşlem Kayıtları (Loglar)
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {enrollment.activityLogs.slice(0, 6).map((log) => (
                        <div
                          key={log.id}
                          className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">
                              {log.title}
                            </span>
                            {log.description && (
                              <span className="text-slate-500 ml-2">
                                — {log.description}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {log.actorName ? `${log.actorName} · ` : ""}
                            {log.createdAt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
