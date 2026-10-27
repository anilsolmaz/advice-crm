// app/(portal)/programim/page.tsx
import Link from "next/link";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ProgramStepperWizard } from "@/components/portal/dashboard/ProgramStepperWizard";
import { Ds160FormSection } from "@/components/portal/dashboard/Ds160FormSection";
import { InteractiveDocumentGrid } from "@/components/portal/documents/InteractiveDocumentGrid";
import {
  PROGRAM_REQUIRED_DOCS,
  buildProgramSteps,
} from "@/lib/portal/programConfig";
import {
  Clock,
  AlertTriangle,
  Briefcase,
  CreditCard,
  Link2,
  GraduationCap,
} from "lucide-react";
import type { Program } from "@prisma/client";

export const dynamic = "force-dynamic";

const PROGRAM_META: Record<
  Program,
  { label: string; color: string; bg: string; border: string }
> = {
  WORK_AND_TRAVEL: {
    label: "Work and Travel USA",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  ACADEMY: {
    label: "Akademi (Üniversite & Yüksek Lisans)",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  LANGUAGE_SCHOOL: {
    label: "Dil Okulu",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  SUMMER_CAMP: {
    label: "Yaz Okulu",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  VISA_CONSULTING: {
    label: "Vize Danışmanlığı",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-900 text-right max-w-[60%]">
        {value || "Danışman tarafından atanacak"}
      </span>
    </div>
  );
}

export default async function ProgramimPage() {
  const user = await requireStudent();

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      watDetail: true,
      academyDetail: true,
      languageDetail: true,
      summerCampDetail: true,
      visaDetail: true,
      academicApplications: {
        orderBy: { priority: "asc" },
      },
      watJobAssignments: {
        include: { job: true },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: { installments: { orderBy: { dueDate: "asc" } } },
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-red-400" />
        <p className="font-semibold">Öğrenci kaydınız bulunamadı.</p>
      </div>
    );
  }

  const program = student.program as Program;
  const meta = PROGRAM_META[program];
  const requiredDocs = PROGRAM_REQUIRED_DOCS[program] || [];
  const steps = buildProgramSteps(student);

  const allInstallments = student.payments.flatMap((p) => p.installments);
  const totalAmount = allInstallments.reduce(
    (sum, i) => sum + Number(i.amount),
    0,
  );
  const paidAmount = allInstallments
    .filter((i) => i.isPaid)
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const remainingAmount = totalAmount - paidAmount;
  const nextUnpaid = allInstallments.find((i) => !i.isPaid);

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-6`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
          Aktif Programınız
        </p>
        <h1 className="text-2xl font-bold text-[#0f172a]">{meta.label}</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kayıt No:{" "}
          <span className="font-mono font-semibold">
            {student.id.slice(0, 8).toUpperCase()}
          </span>
        </p>
      </div>

      {/* Program-Specific Stepper */}
      <ProgramStepperWizard program={program} steps={steps} />

      {/* Interactive Document Grid */}
      <InteractiveDocumentGrid
        studentId={student.id}
        requiredDocs={requiredDocs}
        uploadedDocs={student.documents.map((d) => ({
          id: d.id,
          type: d.type,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          verificationStatus: d.verificationStatus,
          rejectionReason: d.rejectionReason,
        }))}
      />

      {/* DS-160 Form for WAT */}
      {program === "WORK_AND_TRAVEL" && (
        <Ds160FormSection
          studentId={student.id}
          initialStatus={student.watDetail?.ds160Status}
          initialConfirmationNo={student.watDetail?.ds160ConfirmationNo}
          initialData={
            (student.watDetail?.ds160Data as Record<string, any> | null) || null
          }
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WAT Placement & Assigned Job Offers */}
        {program === "WORK_AND_TRAVEL" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                İş Yerleştirme &amp; Vize Bilgileri
              </h2>
            </div>

            {student.watJobAssignments.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2">
                <p className="text-xs font-bold text-[#1e3a8a]">
                  Danışmanınız Tarafından Size Atanan İş Teklifi:
                </p>
                {student.watJobAssignments.map((asg) => (
                  <div
                    key={asg.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-2.5 border border-blue-100 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {asg.job.jobTitle} ({asg.job.location})
                      </span>
                      <span className="text-slate-500">
                        ${String(asg.job.hourlyWage)}/saat · Durum:{" "}
                        <strong>
                          {asg.status === "ACCEPTED"
                            ? "Onaylandı"
                            : asg.status === "DECLINED"
                            ? "Reddedildi"
                            : "Yanıtınızı Bekliyor"}
                        </strong>
                      </span>
                    </div>
                    <Link
                      href={`/job-offer/${asg.shareToken}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0f172a] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1e3a8a]"
                    >
                      <Link2 className="h-3 w-3 text-sky-400" />
                      <span>
                        {asg.status === "SENT" ? "İncele & Onayla" : "Teklifi Gör"}
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div>
              <InfoRow
                label="Sponsor Kuruluş"
                value={student.watDetail?.sponsorName}
              />
              <InfoRow
                label="İşveren (Employer)"
                value={student.watDetail?.employerName}
              />
              <InfoRow
                label="İş Pozisyonu"
                value={student.watDetail?.jobTitle}
              />
              <InfoRow
                label="ABD Eyaleti / Şehir"
                value={student.watDetail?.employerState}
              />
              <InfoRow
                label="DS-2019 Numarası"
                value={student.watDetail?.sponsorDsNumber}
              />
              <InfoRow label="SEVIS ID" value={student.watDetail?.sevisId} />
              <InfoRow
                label="Vize Durumu"
                value={
                  student.watDetail?.visaApproved
                    ? "Onaylandı"
                    : "Süreç Devam Ediyor"
                }
              />
            </div>
          </div>
        )}

        {/* Academy University Applications */}
        {program === "ACADEMY" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              Üniversite &amp; Program Başvurularınız
            </h2>
            {student.academicApplications.length === 0 ? (
              <p className="text-xs text-slate-500">
                Danışmanınız tarafından üniversite başvuru tercihleriniz sisteme eklenmektedir.
              </p>
            ) : (
              <div className="space-y-2.5">
                {student.academicApplications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-xl border border-slate-200 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {app.institutionName} ({app.country})
                      </span>
                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {app.courseName} · {app.degree} · Dönem: {app.intake}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Ödeme &amp; Taksit Özeti
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">
                    Toplam
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {totalAmount.toLocaleString("tr-TR")}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase">
                    Ödenen
                  </p>
                  <p className="text-base font-bold text-emerald-700">
                    {paidAmount.toLocaleString("tr-TR")}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-center">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase">
                    Kalan
                  </p>
                  <p className="text-base font-bold text-amber-700">
                    {remainingAmount.toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
              {nextUnpaid && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-amber-800">
                      Sıradaki taksit:{" "}
                      <strong>
                        {Number(nextUnpaid.amount).toLocaleString("tr-TR")}{" "}
                        {nextUnpaid.currency}
                      </strong>
                    </span>
                  </div>
                  <Link
                    href="/odemelerim"
                    className="font-bold text-[#1e3a8a] hover:underline"
                  >
                    Dekont Yükle →
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Link
              href="/odemelerim"
              className="rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a]"
            >
              Tüm Taksitler &amp; Dekont Yükleme →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
