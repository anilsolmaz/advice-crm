// app/api/webhooks/meta-leads/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Program, LeadSource } from "@prisma/client";

// Meta challenge verification token (configurable in env)
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "advice_meta_webhook_secret_2026";

/**
 * Maps incoming lead ad form names or custom field tags to Program vertical
 */
function resolveProgram(formNameOrTag?: string): Program {
  if (!formNameOrTag) return "WORK_AND_TRAVEL";
  const normalized = formNameOrTag.toLowerCase();

  if (normalized.includes("wat") || normalized.includes("work") || normalized.includes("travel")) {
    return "WORK_AND_TRAVEL";
  }
  if (normalized.includes("akademi") || normalized.includes("academy") || normalized.includes("universite") || normalized.includes("master")) {
    return "ACADEMY";
  }
  if (normalized.includes("dil") || normalized.includes("language") || normalized.includes("english")) {
    return "LANGUAGE_SCHOOL";
  }
  if (normalized.includes("yaz") || normalized.includes("summer") || normalized.includes("camp")) {
    return "SUMMER_CAMP";
  }
  if (normalized.includes("vize") || normalized.includes("visa")) {
    return "VISA_CONSULTING";
  }
  return "WORK_AND_TRAVEL";
}

/**
 * GET Handler: Meta Webhook Handshake Verification
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Doğrulama başarısız (Invalid verify token)" }, { status: 403 });
}

/**
 * POST Handler: Process incoming Meta Lead Ads event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify object type is page/leadgen
    if (body.object !== "page") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const entries = body.entry || [];
    const createdLeads = [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === "leadgen") {
          const leadgenVal = change.value;
          // In real production, leadgen_id is queried via Meta Graph API.
          // For webhook ingestion payload adapter:
          const fullName = leadgenVal.full_name || leadgenVal.name || "Meta Adayı";
          const email = leadgenVal.email || `lead_${leadgenVal.leadgen_id || Date.now()}@meta-ad.com`;
          const phone = leadgenVal.phone_number || leadgenVal.phone || "05000000000";
          const formName = leadgenVal.form_name || leadgenVal.campaign_name || "";
          const program = resolveProgram(formName);

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
                source: "SOCIAL_MEDIA" as LeadSource,
                notes: `Meta Lead Ads (Form ID: ${leadgenVal.form_id || "N/A"}, Ad ID: ${leadgenVal.ad_id || "N/A"})`,
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
                source: "SOCIAL_MEDIA" as LeadSource,
                status: "INTERESTED",
                notes: `Meta Lead Ads İçe Aktarıldı. Form: ${formName || "Varsayılan Form"}`,
              },
            });
            leadId = created.id;
          }

          createdLeads.push(leadId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: createdLeads.length,
      leadIds: createdLeads,
    });
  } catch (error: any) {
    console.error("Meta Webhook Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "İşleme hatası" },
      { status: 500 }
    );
  }
}
