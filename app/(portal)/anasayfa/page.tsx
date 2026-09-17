// app/(portal)/anasayfa/page.tsx
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ProgramStepperWizard, type ProgramStepItem } from "@/components/portal/dashboard/ProgramStepperWizard";
import { AdvisorCard } from "@/components/portal/dashboard/AdvisorCard";
import { ActionBanners } from "@/components/portal/dashboard/ActionBanners";
import { formatCurrency } from "@/lib/utils/currency";
import type { Program } from "@prisma/client";

export const dynamic = "force-dynamic";

function calculateWatSteps(watDetail: any): ProgramStepItem[] {
  const currentStepNum = !watDetail
    ? 1
    : watDetail.visaApproved
    ? 6
    : watDetail.visaInterviewDate
    ? 5
    : watDetail.usArrivalDate
    ? 4
    : watDetail.sponsorDsNumber
    ? 3
    : watDetail.jobStartDate
    ? 2
    : 1;

  return [
    {
      id: 1,
      label: "Kayıt Alındı",
      description: "Ön kayıt ve profil oluşturuldu",
      isCompleted: currentStepNum > 1,
      isCurrent: currentStepNum === 1,
    },
    {
      id: 2,
      label: "İş Seçimi",
      description: "İş fuarı ve işveren mülakatları",
      isCompleted: currentStepNum > 2,
      isCurrent: currentStepNum === 2,
    },
    {
      id: 3,
      label: "DS-2019 Bekleniyor",
      description: "Sponsor onay ve evrak süreci",
      isCompleted: currentStepNum > 3,
      isCurrent: currentStepNum === 3,
    },
    {
      id: 4,
      label: "DS-2019 Geldi",
      description: "Çalışma belgesi teslim alındı",
      isCompleted: currentStepNum > 4,
      isCurrent: currentStepNum === 4,
    },
    {
      id: 5,
      label: "Vize Randevusu",
      description: "ABD Konsolosluğu mülakatı",
      isCompleted: currentStepNum > 5,
      isCurrent: currentStepNum === 5,
    },
    {
      id: 6,
      label: "Vizesini Aldı",
      description: "J-1 vizesi onaylandı",
      isCompleted: watDetail?.visaApproved ?? false,
      isCurrent: currentStepNum === 6,
    },
  ];
}

function calculateGenericSteps(program: Program, isRegistered: boolean): ProgramStepItem[] {
  return [
    {
      id: 1,
      label: "Başvuru Alındı",
      description: "Ön inceleme tamamlandı",
      isCompleted: true,
      isCurrent: false,
    },
    {
      id: 2,
      label: "Evrak Toplama",
      description: "Gerekli belgeler yükleniyor",
      isCompleted: false,
      isCurrent: true,
    },
    {
      id: 3,
      label: "Okul / Program Onayı",
      description: "Kabul mektubu bekleniyor",
      isCompleted: false,
      isCurrent: false,
    },
    {
      id: 4,
      label: "Vize & Hazırlık",
      description: "Vize randevusu ve oryantasyon",
      isCompleted: false,
      isCurrent: false,
    },
  ];
}

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

  // Get Advisor details
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

  // Calculate Stepper steps
  const steps =
    student.program === "WORK_AND_TRAVEL"
      ? calculateWatSteps(student.watDetail)
      : calculateGenericSteps(student.program, student.isActive);

  // Missing documents count (checklist of 4 basic docs)
  const uploadedDocTypes = new Set(student.documents.map((d) => d.type));
  const requiredDocTypes = ["PASSPORT", "TRANSCRIPT", "NATIONAL_ID", "PHOTO"] as const;
  const missingDocsCount = requiredDocTypes.filter((t) => !uploadedDocTypes.has(t)).length;

  // Upcoming installment
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
      {/* Action alerts */}
      <ActionBanners
        missingDocsCount={missingDocsCount}
        upcomingPayment={upcomingPayment}
        revisionRequestCount={student.pendingApprovals.length}
      />

      {/* Program Stepper */}
      <ProgramStepperWizard program={student.program} steps={steps} />

      {/* Grid: Advisor & Program Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Advice Yurtdışı Eğitim&apos;e Hoş Geldiniz!
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Öğrenci portalınız üzerinden başvuru durumunuzu anlık olarak takip edebilir, gerekli evrakları sisteme yükleyebilir, taksit ödemelerinizi görüntüleyebilir ve kişisel bilgilerinizi güncelleyebilirsiniz.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-xs text-gray-500">
              <div>
                <span className="font-semibold text-gray-700">Kayıt Numarası:</span> {student.id.slice(0, 8).toUpperCase()}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Kayıt Tarihi:</span>{" "}
                {new Date(student.createdAt).toLocaleDateString("tr-TR")}
              </div>
            </div>
          </div>
        </div>

        <div>
          <AdvisorCard
            advisor={advisor}
            officeNote={student.advisorNotes[0]?.note ?? null}
          />
        </div>
      </div>
    </div>
  );
}
