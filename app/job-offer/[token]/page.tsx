// app/job-offer/[token]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JobOfferClient from "./JobOfferClient";

export const dynamic = "force-dynamic";

export default async function JobOfferPage({
  params,
}: {
  params: { token: string };
}) {
  const assignment = await prisma.watJobAssignment.findUnique({
    where: { shareToken: params.token },
    include: {
      job: true,
      student: {
        include: {
          user: true,
        },
      },
      assignedBy: true,
    },
  });

  if (!assignment) {
    notFound();
  }

  const job = assignment.job;

  return (
    <JobOfferClient
      shareToken={assignment.shareToken}
      status={assignment.status}
      studentName={assignment.student.user.fullName}
      advisorName={assignment.assignedBy.fullName}
      studentNote={assignment.studentNote}
      respondedAt={
        assignment.respondedAt ? assignment.respondedAt.toISOString() : null
      }
      job={{
        id: job.id,
        sponsor: job.sponsor,
        program: job.program,
        jobCategory: job.jobCategory,
        jobTitle: job.jobTitle,
        placementType: job.placementType,
        location: job.location,
        state: job.state,
        arrivalAirport: job.arrivalAirport,
        hourlyWage: String(job.hourlyWage),
        avgWorkingHours: job.avgWorkingHours,
        accommodationCost: job.accommodationCost
          ? String(job.accommodationCost)
          : null,
        accommodationDeposit: job.accommodationDeposit
          ? String(job.accommodationDeposit)
          : null,
        food: job.food,
        transportation: job.transportation,
        workApparel: job.workApparel,
        position: job.position,
        genderPreference: job.genderPreference,
        jobStartDate: job.jobStartDate.toISOString(),
        jobEndDate: job.jobEndDate.toISOString(),
        earlyLeaveInfo: job.earlyLeaveInfo,
        numPlacements: job.numPlacements,
        bonus: job.bonus,
        additionalInfo: job.additionalInfo,
      }}
    />
  );
}
