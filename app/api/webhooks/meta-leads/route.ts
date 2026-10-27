// app/api/webhooks/meta-leads/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Program, LeadSource } from "@prisma/client";

const VERIFY_TOKEN =
  process.env.META_WEBHOOK_VERIFY_TOKEN || "advice_meta_webhook_secret_2026";
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || "";

function resolveProgram(formNameOrTag?: string): Program {
  if (!formNameOrTag) return "WORK_AND_TRAVEL";
  const normalized = formNameOrTag.toLowerCase();

  if (
    normalized.includes("wat") ||
    normalized.includes("work") ||
    normalized.includes("travel")
  ) {
    return "WORK_AND_TRAVEL";
  }
  if (
    normalized.includes("akademi") ||
    normalized.includes("academy") ||
    normalized.includes("universite") ||
    normalized.includes("master")
  ) {
    return "ACADEMY";
  }
  if (
    normalized.includes("dil") ||
    normalized.includes("language") ||
    normalized.includes("english")
  ) {
    return "LANGUAGE_SCHOOL";
  }
  if (
    normalized.includes("yaz") ||
    normalized.includes("summer") ||
    normalized.includes("camp")
  ) {
    return "SUMMER_CAMP";
  }
  if (normalized.includes("vize") || normalized.includes("visa")) {
    return "VISA_CONSULTING";
  }
  return "WORK_AND_TRAVEL";
}

/**
 * Fetches full lead details from Meta Graph API when META_PAGE_ACCESS_TOKEN is configured.
 */
async function fetchMetaGraphLead(leadgenId: string) {
  if (!PAGE_ACCESS_TOKEN || !leadgenId) return null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${encodeURIComponent(
        PAGE_ACCESS_TOKEN,
      )}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const fieldMap: Record<string, string> = {};
    if (Array.isArray(data.field_data)) {
      for (const item of data.field_data) {
        if (item.name && Array.isArray(item.values) && item.values[0]) {
          fieldMap[item.name] = item.values[0];
        }
      }
    }
    return {
      fullName: fieldMap.full_name || fieldMap.name,
      email: fieldMap.email,
      phone: fieldMap.phone_number || fieldMap.phone,
      city: fieldMap.city,
      program: fieldMap.program,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Doğrulama başarısız (Invalid verify token)" },
    { status: 403 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== "page") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const entries = body.entry || [];
    const createdLeads: string[] = [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === "leadgen") {
          const leadgenVal = change.value || {};
          const graphLead = await fetchMetaGraphLead(leadgenVal.leadgen_id);

          const fullName =
            graphLead?.fullName ||
            leadgenVal.full_name ||
            leadgenVal.name ||
            "Meta Adayı";
          const email =
            graphLead?.email ||
            leadgenVal.email ||
            `lead_${leadgenVal.leadgen_id || Date.now()}@meta-ad.com`;
          const phone =
            graphLead?.phone ||
            leadgenVal.phone_number ||
            leadgenVal.phone ||
            "05000000000";
          const city = graphLead?.city || leadgenVal.city || null;
          const formName =
            graphLead?.program ||
            leadgenVal.form_name ||
            leadgenVal.campaign_name ||
            "";
          const program = resolveProgram(formName);

          // Balanced advisor assignment
          const advisors = await prisma.user.findMany({
            where: { role: { in: ["ADVISOR", "ADMIN"] }, isActive: true },
            include: { _count: { select: { leadsAsAdvisor: true } } },
          });
          const assignedAdvisor = [...advisors].sort(
            (a, b) => a._count.leadsAsAdvisor - b._count.leadsAsAdvisor,
          )[0];

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
                city: city || existingLead.city,
                program,
                source: "SOCIAL_MEDIA" as LeadSource,
                notes: `Meta Lead Ads Güncellendi (Form: ${formName || "Meta Form"})`,
              },
            });
            leadId = updated.id;
          } else {
            const created = await prisma.lead.create({
              data: {
                fullName,
                email,
                phone,
                city,
                program,
                advisorId: assignedAdvisor?.id || null,
                source: "SOCIAL_MEDIA" as LeadSource,
                status: "INTERESTED",
                notes: `Meta Lead Ads İçe Aktarıldı. Form: ${formName || "Varsayılan Form"}`,
              },
            });
            leadId = created.id;

            if (assignedAdvisor) {
              await prisma.notification.create({
                data: {
                  userId: assignedAdvisor.id,
                  type: "NEW_LEAD",
                  title: "📲 Meta Reklamlarından Yeni Lead",
                  message: `${fullName} (${phone}) Meta formunu doldurdu ve size atandı.`,
                  linkUrl: "/leads",
                },
              });
            }
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
      { status: 500 },
    );
  }
}
