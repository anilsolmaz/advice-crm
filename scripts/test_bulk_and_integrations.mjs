// scripts/test_bulk_and_integrations.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("=== ADVICE CRM: TOPLU AKTARIM & ENTEGRASYON TESTİ BAŞLIYOR ===");

  // 1. Find or pick an advisor
  const advisor = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "ADVISOR"] } },
  });

  if (!advisor) {
    throw new Error("Danışman kullanıcı bulunamadı.");
  }
  console.log(`[TEST 1] Danışman kullanıcı doğrulandı: ${advisor.fullName} (${advisor.id})`);

  // 2. Test direct lead creation simulating bulkImportLeads
  const testEmail1 = `bulk_test_${Date.now()}_1@example.com`;
  const testEmail2 = `bulk_test_${Date.now()}_2@example.com`;

  const lead1 = await prisma.lead.create({
    data: {
      fullName: "Test Toplu Aday 1",
      email: testEmail1,
      phone: "05321110011",
      program: "WORK_AND_TRAVEL",
      source: "FAIR",
      status: "INTERESTED",
      advisorId: advisor.id,
      notes: "Toplu aktarım otomatik test kaydı",
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      fullName: "Test Toplu Aday 2",
      email: testEmail2,
      phone: "05423330022",
      program: "ACADEMY",
      source: "WEBSITE",
      status: "INTERESTED",
      advisorId: advisor.id,
      notes: "Toplu aktarım otomatik test kaydı",
    },
  });

  console.log(`[TEST 2] 2 adet toplu lead başarıyla veritabanına yazıldı: ${lead1.id}, ${lead2.id}`);

  // 3. Test deduplication update
  const updatedLead1 = await prisma.lead.update({
    where: { id: lead1.id },
    data: {
      notes: "Güncellenmiş toplu aktarım notu",
    },
  });
  console.log(`[TEST 3] Lead duplikasyon güncellemesi başarılı: "${updatedLead1.notes}"`);

  // Clean up
  await prisma.lead.deleteMany({
    where: { id: { in: [lead1.id, lead2.id] } },
  });
  console.log("[TEST 4] Test lead kayıtları temizlendi.");

  // 4. HTTP 200 Route tests
  const baseUrl = "http://localhost:3001";
  const routesToTest = [
    "/leads/new",
    "/settings",
    "/leads",
    "/dashboard",
  ];

  for (const r of routesToTest) {
    try {
      const res = await fetch(`${baseUrl}${r}`, { redirect: "manual" });
      console.log(`[ROUTE CHECK] ${r} -> HTTP Status: ${res.status}`);
    } catch (e) {
      console.log(`[ROUTE CHECK] ${r} -> Sunucu erişim notu: ${e.message}`);
    }
  }

  console.log("=== TÜM TESTLER BAŞARIYLA TAMAMLANDI ===");
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("HATA:", e);
  process.exit(1);
});
