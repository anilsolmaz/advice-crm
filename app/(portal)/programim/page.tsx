// app/(portal)/programim/page.tsx
// Student Portal — Programım: Program detail, progress stepper, and key info
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ProgramStepperWizard, type ProgramStepItem } from "@/components/portal/dashboard/ProgramStepperWizard";
import {
  BookOpen,
  Plane,
  GraduationCap,
  Languages,
  Sun,
  Stamp,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Briefcase,
  CreditCard,
} from "lucide-react";
import type { Program } from "@prisma/client";

export const dynamic = "force-dynamic";

const PROGRAM_META: Record<Program, { label: string; color: string; bg: string; border: string }> = {
  WORK_AND_TRAVEL: { label: "Work and Travel", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  ACADEMY: { label: "Akademi (Üniversite)", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  LANGUAGE_SCHOOL: { label: "Dil Okulu", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  SUMMER_CAMP: { label: "Yaz Okulu", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  VISA_CONSULTING: { label: "Vize Danışmanlığı", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

function calculateWatSteps(watDetail: Record<string, unknown> | null): ProgramStepItem[] {
  const d = watDetail as { visaApproved?: boolean; visaInterviewDate?: unknown; usArrivalDate?: unknown; sponsorDsNumber?: string; jobStartDate?: unknown } | null;
  const currentStepNum = !d ? 1 : d.visaApproved ? 6 : d.visaInterviewDate ? 5 : d.usArrivalDate ? 4 : d.sponsorDsNumber ? 3 : d.jobStartDate ? 2 : 1;
  return [
    { id: 1, label: "Kayıt Alındı", description: "Ön kayıt ve profil oluşturuldu", isCompleted: currentStepNum > 1, isCurrent: currentStepNum === 1 },
    { id: 2, label: "İş Seçimi", description: "İş fuarı ve işveren mülakatları", isCompleted: currentStepNum > 2, isCurrent: currentStepNum === 2 },
    { id: 3, label: "DS-2019 Bekleniyor", description: "Sponsor onay ve evrak süreci", isCompleted: currentStepNum > 3, isCurrent: currentStepNum === 3 },
    { id: 4, label: "DS-2019 Geldi", description: "Çalışma belgesi teslim alındı", isCompleted: currentStepNum > 4, isCurrent: currentStepNum === 4 },
    { id: 5, label: "Vize Randevusu", description: "ABD Konsolosluğu mülakatı", isCompleted: currentStepNum > 5, isCurrent: currentStepNum === 5 },
    { id: 6, label: "Vizesini Aldı", description: "J-1 vizesi onaylandı", isCompleted: d?.visaApproved ?? false, isCurrent: currentStepNum === 6 },
  ];
}

function calculateGenericSteps(): ProgramStepItem[] {
  return [
    { id: 1, label: "Başvuru Alındı", description: "Ön inceleme tamamlandı", isCompleted: true, isCurrent: false },
    { id: 2, label: "Evrak Toplama", description: "Gerekli belgeler yükleniyor", isCompleted: false, isCurrent: true },
    { id: 3, label: "Okul / Program Onayı", description: "Kabul mektubu bekleniyor", isCompleted: false, isCurrent: false },
    { id: 4, label: "Vize & Hazırlık", description: "Vize randevusu ve oryantasyon", isCompleted: false, isCurrent: false },
  ];
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
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
      payments: {
        include: { installments: { orderBy: { dueDate: "asc" } } },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents: true,
      advisorNotes: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  }) as any;

  if (!student) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-red-400" />
        <p className="font-semibold">Öğrenci kaydınız bulunamadı.</p>
        <p className="text-sm mt-1 text-red-500">Lütfen kurum yetkilinizle iletişime geçiniz.</p>
      </div>
    );
  }

  const meta = PROGRAM_META[student.program as Program];
  const steps = student.program === "WORK_AND_TRAVEL"
    ? calculateWatSteps(student.watDetail as Record<string, unknown> | null)
    : calculateGenericSteps();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allInstallments: any[] = (student.payments as any[]).flatMap((p: any) => p.installments);
  const totalAmount = allInstallments.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
  const paidAmount = allInstallments.filter((i: any) => i.isPaid).reduce((sum: number, i: any) => sum + Number(i.amount), 0);
  const remainingAmount = totalAmount - paidAmount;
  const nextUnpaid = allInstallments.find((i: any) => !i.isPaid);

  const totalDocs = (student.documents as any[]).length;
  const approvedDocs = (student.documents as any[]).filter((d: any) => d.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-6`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>Aktif Programınız</p>
          <h1 className="text-2xl font-bold text-gray-900">{meta.label}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Kayıt No: <span className="font-mono font-semibold">{student.id.slice(0, 8).toUpperCase()}</span>
            {" · "}
            Kayıt Tarihi: {new Date(student.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          Süreç Takibi
        </h2>
        <ProgramStepperWizard program={student.program} steps={steps} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WAT details */}
        {student.program === "WORK_AND_TRAVEL" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              İş Yerleştirme & Vize Bilgileri
            </h2>
            {student.watDetail ? (
              <>
                <InfoRow label="Sponsor Kuruluş" value={student.watDetail.sponsorName} />
                <InfoRow label="DS-2019 No" value={student.watDetail.sponsorDsNumber} />
                <InfoRow label="SEVIS ID" value={student.watDetail.sevisId} />
                <InfoRow label="İş Pozisyonu" value={student.watDetail.jobTitle} />
                <InfoRow label="İşveren" value={student.watDetail.employerName} />
                <InfoRow label="ABD Eyaleti" value={student.watDetail.employerState} />
                <InfoRow
                  label="Vize Mülakatı"
                  value={student.watDetail.visaInterviewDate
                    ? new Date(student.watDetail.visaInterviewDate).toLocaleDateString("tr-TR")
                    : undefined}
                />
                <InfoRow
                  label="ABD Varış"
                  value={student.watDetail.usArrivalDate
                    ? new Date(student.watDetail.usArrivalDate).toLocaleDateString("tr-TR")
                    : undefined}
                />
                <InfoRow
                  label="Vize Durumu"
                  value={student.watDetail.visaApproved ? "✅ Onaylandı" : "⏳ Bekleniyor"}
                />
              </>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                İş yerleştirme ve vize bilgileri danışmanınız tarafından güncellenecektir.
              </p>
            )}
          </div>
        )}

        {/* Academy details */}
        {student.program === "ACADEMY" && student.academyDetail && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              Akademi Program Bilgileri
            </h2>
            <InfoRow label="Hedef Ülke" value={student.academyDetail.targetCountry} />
            <InfoRow label="Hedef Program" value={student.academyDetail.targetProgram} />
            <InfoRow label="Başvuru Seviyesi" value={student.academyDetail.applicationLevel} />
            <InfoRow label="Dil Skoru" value={student.academyDetail.languageScore} />
            <InfoRow label="GPA" value={student.academyDetail.gpa?.toString()} />
            <InfoRow label="Danışmanlık Statüsü" value={student.academyDetail.consultingStatus} />
          </div>
        )}

        {/* Language School details */}
        {student.program === "LANGUAGE_SCHOOL" && student.languageDetail && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Languages className="h-5 w-5 text-emerald-600" />
              Dil Okulu Bilgileri
            </h2>
            <InfoRow label="Hedef Ülke" value={student.languageDetail.targetCountry} />
            <InfoRow label="Seçilen Okul" value={student.languageDetail.schoolName} />
            <InfoRow label="Kurs Türü" value={student.languageDetail.courseType} />
            <InfoRow label="Eğitim Süresi" value={student.languageDetail.durationWeeks ? String(student.languageDetail.durationWeeks) + " Hafta" : undefined} />
            <InfoRow label="LOA Durumu" value={student.languageDetail.loaStatus} />
            <InfoRow label="Vize Durumu" value={student.languageDetail.visaResult} />
          </div>
        )}

        {/* Payment summary */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Ödeme Özeti
          </h2>
          {allInstallments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Henüz ödeme planı oluşturulmamış.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase">Toplam</p>
                  <p className="text-base font-bold text-gray-900">{totalAmount.toLocaleString("tr-TR")}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase">Ödenen</p>
                  <p className="text-base font-bold text-emerald-700">{paidAmount.toLocaleString("tr-TR")}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-center">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase">Kalan</p>
                  <p className="text-base font-bold text-amber-700">{remainingAmount.toLocaleString("tr-TR")}</p>
                </div>
              </div>
              {nextUnpaid && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-amber-800">
                    Sonraki taksit: <strong>{Number(nextUnpaid.amount).toLocaleString("tr-TR")} {nextUnpaid.currency}</strong>
                    {nextUnpaid.dueDate && (
                      <> — Son ödeme: <strong>{new Date(nextUnpaid.dueDate).toLocaleDateString("tr-TR")}</strong></>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document progress */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Belge Durumu
          </h2>
          {totalDocs === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Henüz belge yüklenmemiş.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{approvedDocs} / {totalDocs} belge onaylandı</span>
                <span className="text-xs font-bold text-blue-700">{Math.round((approvedDocs / totalDocs) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.round((approvedDocs / totalDocs) * 100)}%` }} />
              </div>
              <div className="space-y-1.5">
                {(student.documents as any[]).slice(0, 6).map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{doc.type.replace(/_/g, " ")}</span>
                    {doc.status === "APPROVED" ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Onaylandı</span>
                    ) : doc.status === "REVISION_REQUESTED" ? (
                      <span className="text-amber-600 font-semibold">Revize Gerekli</span>
                    ) : (
                      <span className="text-gray-400 flex items-center gap-1"><Circle className="h-3 w-3" /> Bekliyor</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent advisor notes */}
      {(student.advisorNotes as any[]).length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Son Danışman Notları</h2>
          <div className="space-y-3">
            {(student.advisorNotes as any[]).map((note: any, i: number) => (
              <div key={note.id} className="flex gap-3 text-sm">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                  {i + 1}
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed">{note.note}</p>
                  <p className="mt-1 text-[10px] text-gray-400">{new Date(note.createdAt).toLocaleString("tr-TR")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
