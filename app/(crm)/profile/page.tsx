// app/(crm)/profile/page.tsx
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ProfileView } from "@/components/crm/profile/ProfileView";

export const dynamic = "force-dynamic";

export default async function StaffProfilePage() {
  const user = await requireStaff();

  const [dbUser, studentsCount, leadsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: {
        advisorProfile: true,
      },
    }),
    prisma.student.count({
      where: { advisorId: user.id },
    }),
    prisma.lead.count({
      where: { advisorId: user.id },
    }),
  ]);

  if (!dbUser) {
    return null;
  }

  const userData = {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    phone: dbUser.phone,
    role: dbUser.role,
    createdAt: dbUser.createdAt,
    department: dbUser.advisorProfile?.department || null,
    studentsCount,
    leadsCount,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profilim & Hesap Güvenliği</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kişisel bilgilerinizi inceleyin, güncelleyin ve hesap şifrenizi yönetin.
        </p>
      </div>

      <ProfileView user={userData} />
    </div>
  );
}
