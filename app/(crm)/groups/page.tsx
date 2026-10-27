// app/(crm)/groups/page.tsx
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import GroupsClient, { type GroupStudentRow } from "./GroupsClient";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  await requireStaff();

  const rawStudents = await prisma.student.findMany({
    include: {
      user: true,
      profile: true,
      watDetail: true,
      summerCampDetail: true,
      visaDetail: true,
      documents: true,
      lead: true,
    },
    orderBy: [{ groupName: "asc" }, { createdAt: "desc" }],
  });

  const rows: GroupStudentRow[] = rawStudents.map((s) => {
    const appointmentDate =
      s.summerCampDetail?.visaAppointmentDate ||
      s.visaDetail?.appointmentDate ||
      s.watDetail?.visaInterviewDate ||
      null;

    const ukviLink =
      s.summerCampDetail?.ukviLink || s.visaDetail?.ukviLink || null;

    const visaStatus =
      s.summerCampDetail?.visaStatus ||
      s.visaDetail?.decisionStatus ||
      (s.watDetail?.visaApproved ? "APPROVED" : "PENDING");

    const approvedDocs = s.documents.filter(
      (d) => d.verificationStatus === "APPROVED",
    ).length;

    return {
      id: s.id,
      fullName: s.user.fullName,
      program: s.program,
      groupName: s.groupName || "Bireysel / Genel Grup",
      guardianName:
        s.summerCampDetail?.guardianName ||
        s.profile?.emergencyContactName ||
        s.profile?.fatherName ||
        "—",
      sponsor:
        s.watDetail?.sponsorName ||
        s.summerCampDetail?.campProvider ||
        s.lead?.sponsor ||
        "BackPax",
      dateOfBirth: s.profile?.dateOfBirth
        ? s.profile.dateOfBirth.toISOString()
        : null,
      passportNumber: s.profile?.passportNumber || null,
      ukviLink,
      appointmentDate: appointmentDate ? appointmentDate.toISOString() : null,
      notes:
        s.summerCampDetail?.notes ||
        s.visaDetail?.notes ||
        s.watDetail?.notes ||
        null,
      city: s.profile?.city || s.lead?.city || "İstanbul",
      visaStatus,
      totalDocs: s.documents.length,
      approvedDocs,
      guardianPhone:
        s.summerCampDetail?.guardianPhone ||
        s.profile?.emergencyContactPhone ||
        s.user.phone ||
        "—",
    };
  });

  return <GroupsClient rows={rows} />;
}
