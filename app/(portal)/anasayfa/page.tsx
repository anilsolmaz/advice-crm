// app/(portal)/anasayfa/page.tsx
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PROGRAM_LABELS } from "@/types/crm";
import { formatDateShort } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { PROGRAM_REQUIRED_DOCS, buildProgramSteps } from "@/lib/portal/programConfig";
import { InteractiveDocumentGrid } from "@/components/portal/documents/InteractiveDocumentGrid";
import Link from "next/link";
import {
  FileText,
  CreditCard,
  Briefcase,
  ArrowRight,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  History,
  MessageSquare,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await requireStudent();

  const enrollments = await prisma.student.findMany({
    where: { userId: user.id },
    orderBy: [{ isActive: "desc" }, { termYear: "desc" }, { createdAt: "desc" }],
    include: {
      advisor: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      watDetail: true,
      academyDetail: true,
      languageDetail: true,
      summerCampDetail: true,
      visaDetail: true,
      documents: {
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: {
          installments: {
            orderBy: { sequence: "asc" },
          },
        },
      },
      watJobAssignments: {
        orderBy: { createdAt: "desc" },
        include: { job: true },
      },
      academicApplications: {
        orderBy: { priority: "asc" },
      },
      advisorNotes: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Öğrenci kaydınız bulunamadı. Lütfen danışmanınızla iletişime geçin.
      </div>
    );
  }

  const primaryStudent = enrollments[0];
  const requiredDocs =
    PROGRAM_REQUIRED_DOCS[primaryStudent.program] ||
    PROGRAM_REQUIRED_DOCS.WORK_AND_TRAVEL;

  // Document summary across primary program
  const docByType = new Map<string, (typeof primaryStudent.documents)[0]>();
  for (const d of primaryStudent.documents) {
    if (!docByType.has(d.type)) docByType.set(d.type, d);
  }
  let approvedDocCount = 0;
  let pendingDocCount = 0;
  let missingDocCount = 0;
  for (const req of requiredDocs) {
    const found = docByType.get(req.type);
    if (!found || found.verificationStatus === "REVISION_REQUESTED") {
      missingDocCount++;
    } else if (found.verificationStatus === "PENDING") {
      pendingDocCount++;
    } else if (found.verificationStatus === "APPROVED") {
      approvedDocCount++;
    }
  }

  // Unified payment summary across all enrollments
  const allInstallments = enrollments.flatMap((e) =>
    e.payments.flatMap((p) =>
      p.installments.map((inst) => ({
        ...inst,
        programLabel:
          e.enrollmentLabel || `${PROGRAM_LABELS[e.program]} (${e.termYear})`,
      })),
    ),
  );
  const unpaidInstallments = allInstallments
    .filter((i) => !i.isPaid)
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  const nextInstallment = unpaidInstallments[0] || null;

  // Pending job offers waiting for student decision
  const pendingJobOffers = enrollments.flatMap((e) =>
    e.watJobAssignments.filter(
      (a) => a.status !== "ACCEPTED" && a.status !== "DECLINED",
    ),
  );

  // Latest activity logs across all enrollments
  const recentLogs = enrollments
    .flatMap((e) => e.activityLogs)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 1. Executive KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Enrolled Programs */}
        <Link
          href="/programim"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Kayıtlı Programlarım
            </span>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">
            {enrollments.length === 1
              ? primaryStudent.enrollmentLabel ||
                `${PROGRAM_LABELS[primaryStudent.program]} ${primaryStudent.termYear}`
              : `${enrollments.length} Program Kaydı`}
          </p>
          <p className="text-xs text-blue-600 font-semibold mt-1 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Süreç & Aşamaları Gör</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        {/* Card 2: Document Status Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Evrak Durumu ({PROGRAM_LABELS[primaryStudent.program]})
            </span>
            <FileText className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-bold">
            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
              {approvedDocCount} Onaylı
            </span>
            {pendingDocCount > 0 && (
              <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-700">
                {pendingDocCount} Bekleyen
              </span>
            )}
            <span className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700">
              {missingDocCount} Eksik
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Aşağıdaki listeden eksik evraklara tıklayıp yükleyebilirsiniz.
          </p>
        </div>

        {/* Card 3: Next Installment / Payment Summary */}
        <Link
          href="/odemelerim"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Ödeme & Taksit Durumu
            </span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          {nextInstallment ? (
            <>
              <p className="text-lg font-bold text-slate-900 mt-2">
                {formatCurrency(
                  nextInstallment.amount.toString(),
                  nextInstallment.currency as any,
                )}
              </p>
              <p className="text-xs text-amber-700 font-medium mt-1">
                Sonraki Vade: {formatDateShort(nextInstallment.dueDate)}
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-emerald-700 mt-2">
                Bekleyen Vade Yok
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Ödeme planı ve dekontlar →
              </p>
            </>
          )}
        </Link>

        {/* Card 4: Assigned Advisor */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Atanmış Danışmanınız
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          {primaryStudent.advisor ? (
            <>
              <p className="text-sm font-bold text-slate-900 mt-2 truncate">
                {primaryStudent.advisor.fullName}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <a
                  href={`mailto:${primaryStudent.advisor.email}`}
                  className="hover:text-blue-600 inline-flex items-center gap-1"
                >
                  <Mail className="h-3 w-3 text-slate-400" />
                  <span>E-posta</span>
                </a>
                {primaryStudent.advisor.phone && (
                  <a
                    href={`tel:${primaryStudent.advisor.phone}`}
                    className="hover:text-blue-600 inline-flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{primaryStudent.advisor.phone}</span>
                  </a>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 mt-2">
              Danışman ataması yapılıyor...
            </p>
          )}
        </div>
      </div>

      {/* 2. Pending Action Alert (Only shown when there is an active unresponded job offer) */}
      {pendingJobOffers.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Yanıtınızı Bekleyen Yeni İş Teklifi Var!
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {pendingJobOffers[0].job.jobTitle} (
                {pendingJobOffers[0].job.location}) — $
                {pendingJobOffers[0].job.hourlyWage.toString()}/saat
              </p>
            </div>
          </div>
          <Link
            href={`/job-offer/${pendingJobOffers[0].shareToken}`}
            className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
          >
            Teklifi İncele & Yanıtla →
          </Link>
        </div>
      )}

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Interactive Required Document Grid */}
        <div className="lg:col-span-2 space-y-6">
          <InteractiveDocumentGrid
            studentId={primaryStudent.id}
            programLabel={`${PROGRAM_LABELS[primaryStudent.program]} ${primaryStudent.termYear}`}
            requiredDocs={requiredDocs}
            uploadedDocs={primaryStudent.documents.map((d) => ({
              id: d.id,
              type: d.type,
              fileName: d.fileName,
              fileUrl: d.fileUrl,
              verificationStatus: d.verificationStatus as any,
              rejectionReason: d.rejectionReason,
            }))}
          />
        </div>

        {/* Right 1 Column: Compact Program Overview, Advisor Note & Activity Log */}
        <div className="space-y-6">
          {/* Enrolled Programs Compact Progress List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Program Aşama Özeti
              </h3>
              <Link
                href="/programim"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Tüm Detaylar →
              </Link>
            </div>

            <div className="space-y-3">
              {enrollments.map((enrollment) => {
                const steps = buildProgramSteps(enrollment);
                const completedCount = steps.filter((s) => s.isCompleted).length;
                const progressPct = Math.round(
                  (completedCount / Math.max(1, steps.length)) * 100,
                );
                const currentStep =
                  steps.find((s) => s.isCurrent) || steps[steps.length - 1];

                // Only show employer name if student actually has an ACCEPTED job or active employer
                const hasDeclinedAll =
                  enrollment.watJobAssignments.length > 0 &&
                  enrollment.watJobAssignments.every(
                    (a) => a.status === "DECLINED",
                  );
                const activeEmployer = hasDeclinedAll
                  ? null
                  : enrollment.watDetail?.employerName;

                return (
                  <Link
                    key={enrollment.id}
                    href="/programim"
                    className="block rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {enrollment.enrollmentLabel ||
                          `${PROGRAM_LABELS[enrollment.program]} (${enrollment.termYear})`}
                      </span>
                      <span className="text-[11px] font-bold text-blue-700">
                        %{progressPct}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Güncel Aşama:{" "}
                      <strong className="text-slate-800">
                        {currentStep?.label}
                      </strong>
                    </p>
                    {activeEmployer && (
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        İşveren: {activeEmployer}
                      </p>
                    )}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Latest Advisor Note */}
          {primaryStudent.advisorNotes[0] && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-900">
                <MessageSquare className="h-4 w-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Danışman Notu
                </h3>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                {primaryStudent.advisorNotes[0].note}
              </p>
              <p className="text-[10px] text-amber-700/70">
                {formatDateShort(primaryStudent.advisorNotes[0].createdAt)}
              </p>
            </div>
          )}

          {/* Recent Activity Log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Son İşlem Geçmişi
              </h3>
            </div>
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400">
                Henüz kayıtlı işlem hareketi bulunmuyor.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentLogs.map((log) => (
                  <div key={log.id} className="py-2.5 space-y-0.5">
                    <p className="font-semibold text-slate-800">{log.title}</p>
                    {log.description && (
                      <p className="text-[11px] text-slate-500">
                        {log.description}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      {formatDateShort(log.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
