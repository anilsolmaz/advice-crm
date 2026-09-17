// app/(portal)/profilim/page.tsx
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ProfilePageClient } from "./ProfilePageClient";
import type { CRMStudentProfile, CRMUser } from "@/types/crm";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage() {
  const authUser = await requireStudent();

  const student = await prisma.student.findUnique({
    where: { userId: authUser.id },
    include: {
      profile: true,
      user: true,
    },
  });

  if (!student) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Öğrenci kaydınız bulunamadı.
      </div>
    );
  }

  // Format student profile
  const profileData: CRMStudentProfile | null = student.profile
    ? {
        id: student.profile.id,
        studentId: student.id,
        nationalId: student.profile.nationalId,
        dateOfBirth: student.profile.dateOfBirth,
        placeOfBirth: student.profile.placeOfBirth,
        nationality: student.profile.nationality,
        gender: student.profile.gender,
        maritalStatus: student.profile.maritalStatus,
        motherName: student.profile.motherName,
        fatherName: student.profile.fatherName,
        addressLine1: student.profile.addressLine1,
        addressLine2: student.profile.addressLine2,
        city: student.profile.city,
        district: student.profile.district,
        postalCode: student.profile.postalCode,
        country: student.profile.country,
        emergencyContactName: student.profile.emergencyContactName,
        emergencyContactRelationship: student.profile.emergencyContactRelationship,
        emergencyContactPhone: student.profile.emergencyContactPhone,
        passportNumber: student.profile.passportNumber,
        passportIssueDate: student.profile.passportIssueDate,
        passportExpiry: student.profile.passportExpiry,
        passportCountry: student.profile.passportCountry,
        highSchoolName: student.profile.highSchoolName,
        highSchoolGpa: student.profile.highSchoolGpa ? student.profile.highSchoolGpa.toString() : null,
        universityName: student.profile.universityName,
        universityGpa: student.profile.universityGpa ? student.profile.universityGpa.toString() : null,
        academicLevel: student.profile.academicLevel,
        fieldOfStudy: student.profile.fieldOfStudy,
        updatedAt: student.profile.updatedAt,
      }
    : null;

  const userData: CRMUser = {
    id: student.user.id,
    email: student.user.email,
    fullName: student.user.fullName,
    phone: student.user.phone,
    avatarUrl: student.user.avatarUrl,
    role: student.user.role,
    isActive: student.user.isActive,
    createdAt: student.user.createdAt,
  };

  return (
    <ProfilePageClient
      studentId={student.id}
      user={userData}
      profile={profileData}
    />
  );
}
