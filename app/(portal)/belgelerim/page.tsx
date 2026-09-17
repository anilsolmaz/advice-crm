// app/(portal)/belgelerim/page.tsx
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { DocumentUploadBox } from "@/components/portal/documents/DocumentUploadBox";
import { DocumentChecklist } from "@/components/portal/documents/DocumentChecklist";
import type { CRMDocument } from "@/types/crm";

export const dynamic = "force-dynamic";

export default async function StudentDocumentsPage() {
  const authUser = await requireStudent();

  const student = await prisma.student.findUnique({
    where: { userId: authUser.id },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Öğrenci kaydınız bulunamadı.
      </div>
    );
  }

  const documents: CRMDocument[] = student.documents.map((d) => ({
    id: d.id,
    studentId: d.studentId,
    type: d.type,
    fileName: d.fileName,
    fileUrl: d.fileUrl,
    fileSizeBytes: d.fileSizeBytes,
    mimeType: d.mimeType,
    verificationStatus: d.verificationStatus,
    rejectionReason: d.rejectionReason,
    uploadedByStudent: d.uploadedByStudent,
    expiryDate: d.expiryDate,
    notes: d.notes,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Belgelerim</h1>
        <p className="text-xs text-gray-500 mt-1">
          Programınız için gerekli evrakları buradan yükleyebilir ve onay durumlarını anlık izleyebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DocumentUploadBox studentId={student.id} />
        </div>
        <div className="lg:col-span-2">
          <DocumentChecklist documents={documents} />
        </div>
      </div>
    </div>
  );
}
