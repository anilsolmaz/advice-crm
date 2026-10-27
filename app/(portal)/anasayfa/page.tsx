// app/(portal)/anasayfa/page.tsx
import Link from "next/link";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  ProgramStepperWizard,
  type ProgramStepItem,
} from "@/components/portal/dashboard/ProgramStepperWizard";
import { AdvisorCard } from "@/components/portal/dashboard/AdvisorCard";
import { ActionBanners } from "@/components/portal/dashboard/ActionBanners";
import { Ds160FormSection } from "@/components/portal/dashboard/Ds160FormSection";
import { Plane, CheckCircle2, XCircle, Link2 } from "lucide-react";
import type { DocumentType } from "@prisma/client";

export const dynamic = "force-dynamic";

// 8-Stage WAT Progress Bar (§3)
function calculateWat8Steps(watDetail: any, hasPaid: boolean): ProgramStepItem[] {
  const stageOrder = [
    "PRE_REGISTRATION",
    "JOB_SELECTION",
    "JOB_PLACEMENT",
    "PAYMENT_COMPLETED",
    "VISA_APPOINTMENT",
    "VISA_APPROVED",
    "ORIENTATION",
    "DEPARTURE",
  ];
  const currentStage = watDetail?.currentStage || "JOB_PLACEMENT";
  const currentIdx = Math.max(0, stageOrder.indexOf(currentStage));

  const labels = [
    { label: "Ön Kayıt", desc: "Sözleşme ve ön kayıt tamamlandı" },
    { label: "İş Seçimi", desc: "İş havuzu ve mülakat tercihi" },
    { label: "İş Yerleşimi", desc: "Job Offer ve DS-2019 süreci" },
    { label: "Ücret Tamamlandı", desc: "Program ödemesi kapandı" },
    { label: "Vize Randevusu", desc: "DS-160 ve konsolosluk randevusu" },
    { label: "Vize Onayı", desc: "J-1 vizesi basıldı" },
    { label: "Oryantasyon", desc: "Uçuş öncesi eğitim semineri" },
    { label: "Amerika'ya Gidiş", desc: "Uçuş ve programa başlangıç" },
  ];

  return labels.map((item, idx) => ({
    id: idx + 1,
    label: item.label,
    description: item.desc,
    isCompleted: idx < currentIdx || (idx === 3 && hasPaid),
    isCurrent: idx === currentIdx,
  }));
}

// 10-Box Green/Red Document Checklist (§3)
const REQUIRED_10_DOCS: { type: DocumentType; label: string }[] = [
  { type: "DS_2019", label: "DS-2019 Formu" },
  { type: "CV", label: "İngilizce CV" },
  { type: "CRIMINAL_RECORD", label: "Adli Sicil Kaydı" },
  { type: "CONTRACT", label: "Sözleşme" },
  { type: "SEVIS_RECEIPT", label: "SEVIS Makbuzu" },
  { type: "HEALTH_INSURANCE", label: "Sağlık Sigortası" },
  { type: "PASSPORT", label: "Pasaport" },
  { type: "JOB_OFFER", label: "Job Offer" },
  { type: "TRANSCRIPT", label: "Transkript" },
  { type: "STUDENT_CERTIFICATE", label: "Öğrenci Belgesi" },
];

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
      documents: true,
      watJobAssignments: {
        include: { job: true },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: {
          installments: {
            where: { isPaid: false },
            orderBy: { dueDate: "asc" },
            take: 1,
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
        Öğrenci kaydınız bulunamadı. Lütfen kurum yetkilinizle iletişime geçiniz.
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

  const hasPaidAll = student.payments.every((p) => p.status === "PAID");
  const steps = calculateWat8Steps(student.watDetail, hasPaidAll);

  const uploadedTypes = new Set(student.documents.map((d) => d.type));
  const missingDocsCount = REQUIRED_10_DOCS.filter(
    (d) => !uploadedTypes.has(d.type),
  ).length;

  const firstUnpaidInstallment = student.payments[0]?.installments[0];
  const upcomingPayment = firstUnpaidInstallment
    ? {
        amount: firstUnpaidInstallment.amount.toString(),
        currency: firstUnpaidInstallment.currency,
        dueDate: firstUnpaidInstallment.dueDate,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* ── ADVICE BOARDING PASS HERO HEADER (§3) ───────────────────────── */}
      <div className="overflow-hidden rounded-3xl bg-[#0f172a] text-white shadow-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-3.5 bg-slate-900/90">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-sky-400 font-bold">
            <Plane className="h-4 w-4" />
            <span>ADVICE BOARDING PASS · PASSENGER PORTAL</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
            <span>PNR: BPX-{student.id.slice(0, 6).toUpperCase()}</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">STATUS: ACTIVE</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              YOLCU / ÖĞRENCİ ADI
            </p>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {user.fullName}
            </h1>
            <p className="text-xs text-sky-300 mt-1">
              Hedef İşveren:{" "}
              <strong>
                {student.watDetail?.employerName || "Wilderness Resort (WI)"}
              </strong>{" "}
              · Sponsor: {student.watDetail?.sponsorName || "AWA"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800/90 p-3.5 border border-slate-700">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              ROTA &amp; VARIŞ
            </span>
            <span className="text-base font-black text-white">
              IST ✈ {student.watDetail?.employerState || "JFK / USA"}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-800/90 p-3.5 border border-slate-700">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              EVRAK TAMAMLANMA
            </span>
            <span className="text-base font-black text-emerald-400">
              {10 - missingDocsCount} / 10 Belge Hazır
            </span>
          </div>
        </div>
      </div>

      {/* Action alerts */}
      <ActionBanners
        missingDocsCount={missingDocsCount}
        upcomingPayment={upcomingPayment}
        revisionRequestCount={student.pendingApprovals.length}
      />

      {/* Assigned Job Offers Banner */}
      {student.watJobAssignments.length > 0 && (
        <div className="rounded-2xl border-2 border-[#1e3a8a]/20 bg-blue-50/60 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e3a8a] block">
              SİZE ÖZEL İŞ TEKLİFİ ATANDI
            </span>
            <h3 className="text-base font-black text-[#0f172a]">
              {student.watJobAssignments[0].job.jobTitle} (
              {student.watJobAssignments[0].job.location}) — $
              {String(student.watJobAssignments[0].job.hourlyWage)}/saat
            </h3>
            <p className="text-xs text-slate-600">
              Durum: <strong>{student.watJobAssignments[0].status}</strong>
            </p>
          </div>
          <Link
            href={`/job-offer/${student.watJobAssignments[0].shareToken}`}
            className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1e3a8a]"
          >
            <Link2 className="h-4 w-4 text-sky-400" />
            İş Teklifini Aç &amp; Onayla / Reddet →
          </Link>
        </div>
      )}

      {/* 8-Stage WAT Stepper */}
      <ProgramStepperWizard program={student.program} steps={steps} />

      {/* ── 10-BOX GREEN / RED DOCUMENT STATUS GRID (§3) ─────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">
              Evrak Durum Tablosu (Yeşil = Yüklendi / Kırmızı = Eksik)
            </h3>
            <p className="text-xs text-slate-500">
              Work and Travel dosyanız için zorunlu 10 temel belgenin anlık durumu
            </p>
          </div>
          <Link
            href="/belgelerim"
            className="rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a]"
          >
            Eksik Belge Yükle →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {REQUIRED_10_DOCS.map((item) => {
            const exists = uploadedTypes.has(item.type);
            return (
              <div
                key={item.type}
                className={`rounded-xl border p-3.5 flex items-center justify-between transition-all ${
                  exists
                    ? "border-emerald-300 bg-emerald-50/80 text-emerald-950"
                    : "border-red-300 bg-red-50/80 text-red-950"
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      exists ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {exists ? "Tamamlandı" : "Eksik Evrak"}
                  </span>
                </div>
                {exists ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DS-160 STUDENT WORKSHEET FORM (§3) ───────────────────────────── */}
      {student.program === "WORK_AND_TRAVEL" && (
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
