// app/(portal)/anasayfa/page.tsx
import Link from "next/link";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ProgramStepperWizard } from "@/components/portal/dashboard/ProgramStepperWizard";
import { AdvisorCard } from "@/components/portal/dashboard/AdvisorCard";
import { ActionBanners } from "@/components/portal/dashboard/ActionBanners";
import { Ds160FormSection } from "@/components/portal/dashboard/Ds160FormSection";
import { InteractiveDocumentGrid } from "@/components/portal/documents/InteractiveDocumentGrid";
import {
  PROGRAM_REQUIRED_DOCS,
  buildProgramSteps,
} from "@/lib/portal/programConfig";
import { PROGRAM_LABELS } from "@/types/crm";
import { Briefcase, GraduationCap, Link2, CheckCircle2, Clock } from "lucide-react";
import type { Program } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
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
      documents: {
        orderBy: { createdAt: "desc" },
      },
      watJobAssignments: {
        include: { job: true },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: {
          installments: {
            orderBy: { dueDate: "asc" },
          },
        },
      },
      pendingApprovals: {
        where: { status: "REVISION_REQUESTED" },
      },
      advisorNotes: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!student) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Öğrenci kaydınız bulunamadı. Lütfen danışmanınızla iletişime geçiniz.
      </div>
    );
  }

  const advisor = student.advisorId
    ? await prisma.user.findUnique({
        where: { id: student.advisorId },
        select: {
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      })
    : null;

  const program = student.program as Program;
  const requiredDocs = PROGRAM_REQUIRED_DOCS[program] || [];
  const steps = buildProgramSteps(student);
  const currentStepObj = steps.find((s) => s.isCurrent) || steps[0];

  const docByType = new Map<string, any>();
  for (const d of student.documents) {
    if (!docByType.has(d.type)) {
      docByType.set(d.type, d);
    }
  }

  const approvedCount = requiredDocs.filter(
    (r) => docByType.get(r.type)?.verificationStatus === "APPROVED",
  ).length;
  const pendingCount = requiredDocs.filter(
    (r) => docByType.get(r.type)?.verificationStatus === "PENDING",
  ).length;
  const missingDocsCount = requiredDocs.filter(
    (r) => !docByType.has(r.type),
  ).length;

  const unpaidInstallments = student.payments
    .flatMap((p) => p.installments)
    .filter((i) => !i.isPaid);
  const firstUnpaidInstallment = unpaidInstallments[0];
  const upcomingPayment = firstUnpaidInstallment
    ? {
        amount: firstUnpaidInstallment.amount.toString(),
        currency: firstUnpaidInstallment.currency,
        dueDate: firstUnpaidInstallment.dueDate,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Clean Student Portal Overview Header (No Boarding Pass Theme) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-2 space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-[#1e3a8a]">
              <GraduationCap className="h-3.5 w-3.5" />
              {PROGRAM_LABELS[program] || program}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
              {user.fullName}
            </h1>
            <p className="text-xs text-slate-500">
              Danışmanınız:{" "}
              <strong className="text-slate-800">
                {advisor?.fullName || "Atanıyor"}
              </strong>
              {student.watDetail?.employerName
                ? ` · İşveren: ${student.watDetail.employerName}`
                : ""}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Güncel Aşamanız
            </span>
            <span className="text-sm font-bold text-[#1e3a8a] block mt-0.5">
              {currentStepObj?.id}. {currentStepObj?.label}
            </span>
            <span className="text-[11px] text-slate-500">
              {currentStepObj?.description}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Belge Durumu Özeti
            </span>
            <div className="flex items-center gap-3 mt-1 text-xs font-bold">
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {approvedCount} Onaylı
              </span>
              {pendingCount > 0 && (
                <span className="text-amber-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {pendingCount} Bekleyen
                </span>
              )}
              <span className="text-rose-600">{missingDocsCount} Eksik</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action alerts */}
      <ActionBanners
        missingDocsCount={missingDocsCount}
        upcomingPayment={upcomingPayment}
        revisionRequestCount={student.pendingApprovals.length}
      />

      {/* Assigned WAT Job Offers */}
      {student.watJobAssignments.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1e3a8a]">
            <Briefcase className="h-4 w-4" />
            <span>Size Atanan İş Teklifleri (Job Offer)</span>
          </div>
          <div className="space-y-2.5">
            {student.watJobAssignments.map((asg) => (
              <div
                key={asg.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 border border-blue-100 shadow-2xs"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">
                    {asg.job.jobTitle} ({asg.job.location}) — $
                    {String(asg.job.hourlyWage)}/saat
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sponsor: <strong>{asg.job.sponsor}</strong> · Pozisyon:{" "}
                    {asg.job.position || asg.job.jobTitle} · Durum:{" "}
                    <strong
                      className={
                        asg.status === "ACCEPTED"
                          ? "text-emerald-700"
                          : asg.status === "DECLINED"
                          ? "text-rose-600"
                          : "text-amber-700"
                      }
                    >
                      {asg.status === "ACCEPTED"
                        ? "Onayladınız (Yerleşim Yapıldı)"
                        : asg.status === "DECLINED"
                        ? "Reddettiniz"
                        : "Onayınızı Bekliyor"}
                    </strong>
                  </p>
                </div>
                <Link
                  href={`/job-offer/${asg.shareToken}`}
                  className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a]"
                >
                  <Link2 className="h-3.5 w-3.5 text-sky-400" />
                  {asg.status === "SENT"
                    ? "İş Teklifini İncele & Onayla"
                    : "İş Detaylarını Gör"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Program-Specific Progress Stepper */}
      <ProgramStepperWizard program={program} steps={steps} />

      {/* Interactive Program-Specific Document Grid (Click to upload + 3-state legend) */}
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

      {/* DS-160 Student Worksheet Form (for WAT) */}
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

      {/* Advisor Card */}
      <AdvisorCard
        advisor={advisor}
        officeNote={student.advisorNotes[0]?.note ?? null}
      />
    </div>
  );
}
