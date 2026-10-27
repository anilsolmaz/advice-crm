// app/(portal)/programim/page.tsx
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PROGRAM_LABELS } from "@/types/crm";
import { formatDateShort } from "@/lib/utils/date";
import { PROGRAM_REQUIRED_DOCS, buildProgramSteps } from "@/lib/portal/programConfig";
import {
  ProgramAccordionList,
  type SerializedEnrollmentItem,
} from "@/components/portal/program/ProgramAccordionList";

export const dynamic = "force-dynamic";

export default async function StudentProgramPage() {
  const user = await requireStudent();

  const enrollments = await prisma.student.findMany({
    where: { userId: user.id },
    orderBy: [{ isActive: "desc" }, { termYear: "desc" }, { createdAt: "desc" }],
    include: {
      advisor: {
        select: { fullName: true, email: true, phone: true },
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
        include: { installments: true },
      },
      watJobAssignments: {
        orderBy: { createdAt: "desc" },
        include: {
          job: true,
          assignedBy: { select: { fullName: true } },
        },
      },
      academicApplications: {
        orderBy: { priority: "asc" },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 15,
      },
    },
  });

  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Öğrenci program kaydınız bulunamadı.
      </div>
    );
  }

  const serializedEnrollments: SerializedEnrollmentItem[] = enrollments.map(
    (enrollment) => {
      const steps = buildProgramSteps(enrollment);
      const currentStep =
        steps.find((s) => s.isCurrent) || steps[steps.length - 1];
      const requiredDocs =
        PROGRAM_REQUIRED_DOCS[enrollment.program] ||
        PROGRAM_REQUIRED_DOCS.WORK_AND_TRAVEL;
      const programLabel =
        PROGRAM_LABELS[enrollment.program] || enrollment.program;

      return {
        id: enrollment.id,
        program: enrollment.program,
        programLabel,
        termYear: enrollment.termYear,
        enrollmentLabel:
          enrollment.enrollmentLabel ||
          `${programLabel} — ${enrollment.termYear} Dönemi`,
        isActive: enrollment.isActive,
        advisor: enrollment.advisor
          ? {
              fullName: enrollment.advisor.fullName,
              email: enrollment.advisor.email,
              phone: enrollment.advisor.phone,
            }
          : null,
        steps,
        currentStepLabel: currentStep
          ? `${currentStep.id}. ${currentStep.label}`
          : "Başlangıç",
        requiredDocs,
        documents: enrollment.documents.map((d) => ({
          id: d.id,
          type: d.type,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          verificationStatus: d.verificationStatus as any,
          rejectionReason: d.rejectionReason,
        })),
        watDetail: enrollment.watDetail
          ? {
              sponsorName: enrollment.watDetail.sponsorName,
              sponsorDsNumber: enrollment.watDetail.sponsorDsNumber,
              employerName: enrollment.watDetail.employerName,
              employerState: enrollment.watDetail.employerState,
              jobTitle: enrollment.watDetail.jobTitle,
              sevisId: enrollment.watDetail.sevisId,
              visaInterviewDate: enrollment.watDetail.visaInterviewDate
                ? formatDateShort(enrollment.watDetail.visaInterviewDate)
                : null,
              visaApproved: enrollment.watDetail.visaApproved,
              ds160Status: enrollment.watDetail.ds160Status,
              ds160ConfirmationNo: enrollment.watDetail.ds160ConfirmationNo,
              ds160Data: enrollment.watDetail.ds160Data as Record<
                string,
                any
              > | null,
            }
          : null,
        watJobAssignments: enrollment.watJobAssignments.map((a) => ({
          id: a.id,
          shareToken: a.shareToken,
          status: a.status,
          studentNote: a.studentNote,
          createdAt: formatDateShort(a.createdAt),
          respondedAt: a.respondedAt ? formatDateShort(a.respondedAt) : null,
          assignedByName: a.assignedBy?.fullName || "Danışman",
          job: {
            jobTitle: a.job.jobTitle,
            sponsor: a.job.sponsor,
            location: a.job.location,
            position: a.job.position,
            hourlyWage: a.job.hourlyWage.toString(),
          },
        })),
        academicApplications: enrollment.academicApplications.map((app) => ({
          id: app.id,
          appCode: app.appCode,
          institutionName: app.institutionName,
          country: app.country,
          courseName: app.courseName,
          degree: app.degree,
          intake: app.intake,
          priority: app.priority,
          status: app.status,
        })),
        languageDetail: enrollment.languageDetail
          ? {
              targetCountry: enrollment.languageDetail.targetCountry,
              targetCity: enrollment.languageDetail.targetCity,
              schoolName: enrollment.languageDetail.schoolName,
              courseType: enrollment.languageDetail.courseType,
              weeksDuration: enrollment.languageDetail.weeksDuration,
              accommodationType: enrollment.languageDetail.accommodationType,
              agreementsDone: enrollment.languageDetail.agreementsDone,
              agreementsSignedDone:
                enrollment.languageDetail.agreementsSignedDone,
              grossInvoiceDone: enrollment.languageDetail.grossInvoiceDone,
              netInvoiceDone: enrollment.languageDetail.netInvoiceDone,
              letterOfAcceptanceDone:
                enrollment.languageDetail.letterOfAcceptanceDone,
            }
          : null,
        summerCampDetail: enrollment.summerCampDetail
          ? {
              targetCountry: enrollment.summerCampDetail.targetCountry,
              campName: enrollment.summerCampDetail.campName,
              programType: enrollment.summerCampDetail.programType,
              ageGroup: enrollment.summerCampDetail.ageGroup,
              visaStatus: enrollment.summerCampDetail.visaStatus,
            }
          : null,
        visaDetail: enrollment.visaDetail
          ? {
              destinationCountry: enrollment.visaDetail.destinationCountry,
              visaType: enrollment.visaDetail.visaType,
              targetConsulate: enrollment.visaDetail.targetConsulate,
              appointmentDate: enrollment.visaDetail.appointmentDate
                ? formatDateShort(enrollment.visaDetail.appointmentDate)
                : null,
              decisionStatus: enrollment.visaDetail.decisionStatus,
            }
          : null,
        activityLogs: enrollment.activityLogs.map((l) => ({
          id: l.id,
          actionType: l.actionType,
          title: l.title,
          description: l.description,
          actorName: l.actorName,
          createdAt: formatDateShort(l.createdAt),
        })),
      };
    },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Programlarım & Süreç Takibi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kayıtlı olduğunuz tüm yurtdışı eğitim programlarını, aşama
            durumlarını, zorunlu evraklarınızı ve iş/okul teklif geçmişinizi
            aşağıdaki kartları genişleterek yönetebilirsiniz.
          </p>
        </div>
        {serializedEnrollments.length > 1 && (
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1.5 text-xs font-bold text-blue-700">
            Toplam {serializedEnrollments.length} Program Kaydınız Bulunuyor
          </span>
        )}
      </div>

      <ProgramAccordionList enrollments={serializedEnrollments} />
    </div>
  );
}
