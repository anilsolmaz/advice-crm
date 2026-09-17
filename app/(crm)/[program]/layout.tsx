// app/(crm)/[program]/layout.tsx
// Program-level Route Guard — protects against unauthorized direct URL access
import { notFound, redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { getProgramFromSlug } from "@/lib/utils/programs";
import { hasProgramAccess } from "@/lib/auth/permissions";

interface Props {
  children: React.ReactNode;
  params: {
    program: string;
  };
}

export default async function ProgramSectionLayout({ children, params }: Props) {
  const user = await requireStaff();
  const programEnum = getProgramFromSlug(params.program);

  // If the URL slug is not a valid program, 404
  if (!programEnum) {
    notFound();
  }

  // If staff is not an ADMIN and does not have access to this program, redirect
  if (user.role !== "ADMIN" && !hasProgramAccess(user, programEnum)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
