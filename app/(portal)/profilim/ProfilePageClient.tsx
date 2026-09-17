// app/(portal)/profilim/ProfilePageClient.tsx
"use client";

import { useState } from "react";
import { ProfileOverview } from "@/components/portal/profile/ProfileOverview";
import { ProfileEditModal } from "@/components/portal/profile/ProfileEditModal";
import type { CRMStudentProfile, CRMUser } from "@/types/crm";

interface Props {
  studentId: string;
  user: CRMUser;
  profile: CRMStudentProfile | null;
}

export function ProfilePageClient({ studentId, user, profile }: Props) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <ProfileOverview
        user={user}
        profile={profile}
        onEditClick={() => setIsEditModalOpen(true)}
      />

      {isEditModalOpen && (
        <ProfileEditModal
          studentId={studentId}
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}
