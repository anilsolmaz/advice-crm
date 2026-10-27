// lib/activity/activityLogger.ts
import { prisma } from "@/lib/prisma";

export interface LogActivityParams {
  studentId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  actionType:
    | "JOB_OFFER_SENT"
    | "JOB_OFFER_ACCEPTED"
    | "JOB_OFFER_DECLINED"
    | "DOCUMENT_UPLOADED"
    | "DOCUMENT_APPROVED"
    | "DOCUMENT_REVISION"
    | "PAYMENT_PROOF_UPLOADED"
    | "INSTALLMENT_PAID"
    | "PAYMENT_PLAN_CREATED"
    | "PROGRAM_ENROLLED"
    | "STAGE_UPDATED"
    | "LEAD_CONVERTED"
    | "DS160_SUBMITTED"
    | "PROFILE_UPDATED";
  title: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
}

export async function logStudentActivity(params: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        studentId: params.studentId || null,
        actorId: params.actorId || null,
        actorName: params.actorName || null,
        actorRole: params.actorRole || null,
        actionType: params.actionType,
        title: params.title,
        description: params.description || null,
        metadata: params.metadata ? (params.metadata as any) : undefined,
      },
    });
  } catch (err) {
    console.error("[ActivityLog Error]:", err);
  }
}
