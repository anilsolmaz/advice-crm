// app/(portal)/programim/page.tsx
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  ProgramStepperWizard,
  type ProgramStepItem,
} from "@/components/portal/dashboard/ProgramStepperWizard";
import { Ds160FormSection } from "@/components/portal/dashboard/Ds160FormSection";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Briefcase,
  CreditCard,
} from "lucide-react";
import type { DocumentType, Program } from "@prisma/client";

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
    label: "Akademi (Üniversite)",
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-900 text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

export default async function ProgramimPage() {
  const user = await requireStudent();

  const student = (await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      watDetail: true,
      academyDetail: true,
      languageDetail: true,
      payments: {
        include: { installments: { orderBy: { dueDate: "asc" } } },
      },
      documents: true,
      advisorNotes: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  })) as any;

  if (!student) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-red-400" />
        <p className="font-semibold">Öğrenci kaydınız bulunamadı.</p>
      </div>
    );
  }

  const meta = PROGRAM_META[student.program as Program];
  const allInstallments: any[] = (student.payments as any[]).flatMap(
    (p: any) => p.installments,
  );
  const totalAmount = allInstallments.reduce(
    (sum: number, i: any) => sum + Number(i.amount),
    0,
  );
  const paidAmount = allInstallments
    .filter((i: any) => i.isPaid)
    .reduce((sum: number, i: any) => sum + Number(i.amount), 0);
  const remainingAmount = totalAmount - paidAmount;
  const nextUnpaid = allInstallments.find((i: any) => !i.isPaid);

  const steps = calculateWat8Steps(student.watDetail, remainingAmount <= 0);
  const uploadedTypes = new Set(
    (student.documents as any[]).map((d: any) => d.type),
  );

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-6`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
          BackPax Aktif Programınız
        </p>
        <h1 className="text-2xl font-bold text-[#0f172a]">{meta.label}</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kayıt No:{" "}
          <span className="font-mono font-semibold">
            {student.id.slice(0, 8).toUpperCase()}
          </span>
        </p>
      </div>

      {/* 8-Stage Progress Stepper */}
      <ProgramStepperWizard program={student.program} steps={steps} />

      {/* 10-Box Green/Red Document Checklist */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0f172a]">
          10 Zorunlu Belge Durumu (Yeşil = Tamamlandı / Kırmızı = Eksik)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {REQUIRED_10_DOCS.map((item) => {
            const exists = uploadedTypes.has(item.type);
            return (
              <div
                key={item.type}
                className={`rounded-xl border p-3 flex items-center justify-between ${
                  exists
                    ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                    : "border-red-300 bg-red-50 text-red-950"
                }`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                {exists ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DS-160 Form */}
      {student.program === "WORK_AND_TRAVEL" && (
        <Ds160FormSection
          studentId={student.id}
          initialStatus={student.watDetail?.ds160Status}
          initialConfirmationNo={student.watDetail?.ds160ConfirmationNo}
          initialData={student.watDetail?.ds160Data || null}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WAT details */}
        {student.program === "WORK_AND_TRAVEL" && student.watDetail && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              İş Yerleştirme &amp; Vize Bilgileri
            </h2>
            <InfoRow
              label="Sponsor Kuruluş"
              value={student.watDetail.sponsorName}
            />
            <InfoRow
              label="DS-2019 No"
              value={student.watDetail.sponsorDsNumber}
            />
            <InfoRow label="SEVIS ID" value={student.watDetail.sevisId} />
            <InfoRow label="İş Pozisyonu" value={student.watDetail.jobTitle} />
            <InfoRow label="İşveren" value={student.watDetail.employerName} />
            <InfoRow
              label="ABD Eyaleti"
              value={student.watDetail.employerState}
            />
            <InfoRow
              label="Vize Durumu"
              value={
                student.watDetail.visaApproved ? "✅ Onaylandı" : "⏳ Bekleniyor"
              }
            />
          </div>
        )}

        {/* Payment summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Ödeme Özeti
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
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-amber-800">
                  Sonraki taksit:{" "}
                  <strong>
                    {Number(nextUnpaid.amount).toLocaleString("tr-TR")}{" "}
                    {nextUnpaid.currency}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
