// app/api/webhooks/google-leads/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Program, LeadSource } from "@prisma/client";

const GOOGLE_WEBHOOK_KEY = process.env.GOOGLE_LEADS_WEBHOOK_KEY || "advice_google_webhook_key_2026";

function resolveProgram(programString?: string): Program {
  if (!programString) return "WORK_AND_TRAVEL";
  const normalized = programString.toLowerCase();

  if (normalized.includes("wat") || normalized.includes("work")) return "WORK_AND_TRAVEL";
  if (normalized.includes("akademi") || normalized.includes("academy") || normalized.includes("universite")) return "ACADEMY";
  if (normalized.includes("dil") || normalized.includes("language")) return "LANGUAGE_SCHOOL";
  if (normalized.includes("yaz") || normalized.includes("summer")) return "SUMMER_CAMP";
  if (normalized.includes("vize") || normalized.includes("visa")) return "VISA_CONSULTING";
  return "WORK_AND_TRAVEL";
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-webhook-key") || request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const queryKey = searchParams.get("key");

    const providedKey = queryKey || authHeader?.replace("Bearer ", "");

    if (providedKey !== GOOGLE_WEBHOOK_KEY) {
      return NextResponse.json({ error: "Yetkisiz istek (Unauthorized token)" }, { status: 401 });
    }

    const payload = await request.json();

    // Google Ads Lead Form / Website Form field mapping
    const fullName = payload.user_column_data?.find((c: any) => c.column_id === "FULL_NAME")?.string_value || payload.fullName || payload.name;
    const email = payload.user_column_data?.find((c: any) => c.column_id === "EMAIL")?.string_value || payload.email;
    const phone = payload.user_column_data?.find((c: any) => c.column_id === "PHONE_NUMBER")?.string_value || payload.phone || payload.phoneNumber;
    const programRaw = payload.program || payload.campaign_name || payload.adgroup_name;
    const program = resolveProgram(programRaw);

    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: "Eksik bilgi: fullName, email ve phone zorunludur." },
        { status: 400 }
      );
    }

    const existingLead = await prisma.lead.findFirst({
      where: { email },
    });

    let leadId = "";
    if (existingLead) {
      const updated = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          fullName,
          phone,
          program,
          source: "WEBSITE" as LeadSource,
          notes: `Google Ads Lead Form güncellendi. Kampanya: ${payload.campaign_name || "Google Arama"}`,
        },
      });
      leadId = updated.id;
    } else {
      const created = await prisma.lead.create({
        data: {
          fullName,
          email,
          phone,
          program,
          source: "WEBSITE" as LeadSource,
          status: "INTERESTED",
          notes: `Google Ads Webhook ile alındı. Kampanya ID: ${payload.campaign_id || "Direct"}`,
        },
      });
      leadId = created.id;
    }

    return NextResponse.json({
      success: true,
      message: "Lead başarıyla kaydedildi.",
      leadId,
    });
  } catch (error: any) {
    console.error("Google Webhook Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "İşleme hatası" },
      { status: 500 }
    );
  }
}
