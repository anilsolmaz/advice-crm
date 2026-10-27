import {
  PrismaClient,
  Role,
  LeadStatus,
  Program,
  LeadSource,
  Currency,
  PaymentStatus,
  ApprovalEntityType,
  ApprovalStatus,
  DocumentType,
  VerificationStatus,
  VisaType,
  AcademicLevel,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "../lib/supabase/admin";

const prisma = new PrismaClient();

// Standard test password for all test accounts
export const DEFAULT_TEST_PASSWORD = "Password123!";

async function createOrUpdateSupabaseAuthUser(id: string, email: string, fullName: string) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      id,
      email,
      password: DEFAULT_TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error && !error.message.includes("already")) {
      console.warn(`Supabase Auth uyarısı (${email}):`, error.message);
    }
  } catch (err: any) {
    // Fallback when running directly with local PostgreSQL
  }
}

async function main() {
  console.log("🌱 Advice Yurtdışı Eğitim CRM tohumlama (seeding) başlatılıyor...");

  // Hash standard password with bcrypt (cost factor 10)
  const passwordHash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);

  // Clean existing tables in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.accountingEntry.deleteMany();
  await prisma.academicApplication.deleteMany();
  await prisma.watJobAssignment.deleteMany();
  await prisma.watJob.deleteMany();
  await prisma.leadCallLog.deleteMany();
  await prisma.advisorNote.deleteMany();
  await prisma.pendingApproval.deleteMany();
  await prisma.document.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.watDetail.deleteMany();
  await prisma.academyDetail.deleteMany();
  await prisma.languageDetail.deleteMany();
  await prisma.summerCampDetail.deleteMany();
  await prisma.visaDetail.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.student.deleteMany();
  await prisma.summerBooking.deleteMany();
  await prisma.summerAllocation.deleteMany();
  await prisma.partnerSchool.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.advisorProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customRole.deleteMany();

  // =========================================================================
  // 1. CORE USERS: Yönetici & Danışmanlar
  // =========================================================================
  const adminId = "00000000-0000-0000-0000-000000000001";
  const advisorRecepId = "00000000-0000-0000-0000-000000000002";
  const advisorIpekId = "00000000-0000-0000-0000-000000000005";

  const admin = await prisma.user.create({
    data: {
      id: adminId,
      email: "harun@adviceyed.com",
      fullName: "Harun Teke (Yönetici)",
      phone: "0532 100 0001",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      advisorProfile: {
        create: {
          department: "Genel Yönetim & İcra Kurulu",
          bio: "Kurucu Ortak & Genel Müdür",
          allowedPrograms: [
            Program.WORK_AND_TRAVEL,
            Program.ACADEMY,
            Program.LANGUAGE_SCHOOL,
            Program.SUMMER_CAMP,
            Program.VISA_CONSULTING,
          ],
          canManageApprovals: true,
          canManageMarketing: true,
          canExportData: true,
          canViewAllLeads: true,
        },
      },
    },
  });

  const advisorRecep = await prisma.user.create({
    data: {
      id: advisorRecepId,
      email: "recep@adviceyed.com",
      fullName: "Recep Özdemir (Danışman)",
      phone: "0532 100 0002",
      passwordHash,
      role: Role.ADVISOR,
      isActive: true,
      advisorProfile: {
        create: {
          department: "Amerika & Work and Travel Departmanı",
          bio: "Kıdemli Danışman - İstanbul Şişli Merkez Ofis",
          allowedPrograms: [Program.WORK_AND_TRAVEL],
          canManageApprovals: true,
          canManageMarketing: true,
          canExportData: false,
          canViewAllLeads: true,
        },
      },
    },
  });

  const advisorIpek = await prisma.user.create({
    data: {
      id: advisorIpekId,
      email: "ipek@adviceyed.com",
      fullName: "İpek Zeynep Köken (Danışman)",
      phone: "0532 100 0005",
      passwordHash,
      role: Role.ADVISOR,
      isActive: true,
      advisorProfile: {
        create: {
          department: "Akademi, Dil Okulları & Yaz Kampları",
          bio: "Yurtdışı Eğitim Danışmanı - İstanbul Şişli Merkez Ofis",
          allowedPrograms: [
            Program.ACADEMY,
            Program.LANGUAGE_SCHOOL,
            Program.SUMMER_CAMP,
          ],
          canManageApprovals: true,
          canManageMarketing: true,
          canExportData: false,
          canViewAllLeads: true,
        },
      },
    },
  });

  await createOrUpdateSupabaseAuthUser(adminId, "harun@adviceyed.com", "Harun Teke (Yönetici)");
  await createOrUpdateSupabaseAuthUser(advisorRecepId, "recep@adviceyed.com", "Recep Özdemir (Danışman)");
  await createOrUpdateSupabaseAuthUser(advisorIpekId, "ipek@adviceyed.com", "İpek Zeynep Köken (Danışman)");

  console.log("✅ Yönetici ve Danışmanlar oluşturuldu.");

  // =========================================================================
  // 2. POTANSİYEL ADAYLAR (LEADS) — 7 Gerçekçi Kayıt
  // =========================================================================
  await prisma.lead.createMany({
    data: [
      {
        fullName: "Selin Yıldız",
        email: "selin.yildiz@example.com",
        phone: "0541 234 5678",
        program: Program.WORK_AND_TRAVEL,
        source: LeadSource.SOCIAL_MEDIA,
        status: LeadStatus.INTERESTED,
        notes: "Instagram reklamından ulaştı. 2026 yaz dönemi WAT programıyla ilgileniyor. İngilizce seviyesi B2, cankurtaranlık sertifikası almak istiyor.",
        advisorId: advisorRecep.id,
        createdAt: new Date("2026-03-01T10:15:00Z"),
      },
      {
        fullName: "Caner Erkin",
        email: "caner.erkin@example.com",
        phone: "0533 987 6543",
        program: Program.ACADEMY,
        source: LeadSource.WEBSITE,
        status: LeadStatus.CONSIDERING_NEXT_YEAR,
        notes: "Almanya ve İngiltere yüksek lisans programları için bilgi aldı. ODTÜ Makine mezunu, GPA 3.20. Gelecek sonbahar dönemi düşünüyor.",
        advisorId: advisorIpek.id,
        createdAt: new Date("2026-02-20T14:30:00Z"),
      },
      {
        fullName: "Melisa Öztürk",
        email: "melisa.ozturk@example.com",
        phone: "0535 444 8899",
        program: Program.LANGUAGE_SCHOOL,
        source: LeadSource.WEBSITE,
        status: LeadStatus.INTERESTED,
        notes: "İrlanda Dublin ve Malta dil okulları için 25 haftalık çalışma izinli program sordu. Vize şartlarını incelemek istiyor.",
        advisorId: advisorIpek.id,
        createdAt: new Date("2026-03-05T09:00:00Z"),
      },
      {
        fullName: "Alperen Çetin",
        email: "alperen.cetin@example.com",
        phone: "0544 321 9876",
        program: Program.WORK_AND_TRAVEL,
        source: LeadSource.REFERRAL,
        status: LeadStatus.INTERESTED,
        notes: "Eski WAT öğrencimiz Barış Akın'ın tavsiyesiyle geldi. Amerika Doğu Yakası resort işleri istiyor.",
        advisorId: advisorRecep.id,
        createdAt: new Date("2026-03-07T11:45:00Z"),
      },
      {
        fullName: "Büşra Tekin",
        email: "busra.tekin@example.com",
        phone: "0530 112 3344",
        program: Program.SUMMER_CAMP,
        source: LeadSource.PHONE,
        status: LeadStatus.UNINTERESTED,
        notes: "İngiltere yaz okulları bütçesi bu yıl için uygun gelmedi, görüşme sonlandırıldı.",
        advisorId: advisorIpek.id,
        createdAt: new Date("2026-01-15T16:00:00Z"),
      },
      {
        fullName: "Kaan Çelik",
        email: "kaan.celik@example.com",
        phone: "0555 999 1122",
        program: Program.VISA_CONSULTING,
        source: LeadSource.WALK_IN,
        status: LeadStatus.NOT_CONSIDERING,
        notes: "Ofise uğrayıp Kanada vizesi danışmanlığı sordu, şimdilik planlarını ertelediğini belirtti.",
        advisorId: admin.id,
        createdAt: new Date("2026-02-02T13:20:00Z"),
      },
      {
        fullName: "Mert Karaca",
        email: "mert.karaca@example.com",
        phone: "0538 777 6655",
        program: Program.WORK_AND_TRAVEL,
        source: LeadSource.FAIR,
        status: LeadStatus.REGISTERED,
        notes: "Üniversite kariyer fuarında kaydı alındı. Evrakları toplanarak kesin kayıtlı öğrenciye dönüştürüldü.",
        advisorId: advisorRecep.id,
        convertedAt: new Date("2026-02-28T15:00:00Z"),
        createdAt: new Date("2026-02-10T12:00:00Z"),
      },
    ],
  });

  console.log("✅ 7 adet potansiyel aday (Lead) oluşturuldu.");

  // =========================================================================
  // 3. KAYITLI ÖĞRENCİLER (STUDENTS) — 5 Zengin Profil
  // =========================================================================

  // --- ÖĞRENCİ 1: Anıl Solmaz (WAT - CIEE Virginia Lifeguard) ---
  const student1Id = "00000000-0000-0000-0000-000000000003";
  await createOrUpdateSupabaseAuthUser(student1Id, "anil@adviceyed.com", "Anıl Solmaz");

  const student1User = await prisma.user.create({
    data: {
      id: student1Id,
      email: "anil@adviceyed.com",
      fullName: "Anıl Solmaz",
      phone: "0555 123 4567",
      passwordHash,
      role: Role.STUDENT,
      isActive: true,
    },
  });

  const student1 = await prisma.student.create({
    data: {
      userId: student1User.id,
      advisorId: advisorRecep.id,
      program: Program.WORK_AND_TRAVEL,
      isActive: true,
      profile: {
        create: {
          nationalId: "12345678901",
          dateOfBirth: new Date("2002-05-14"),
          placeOfBirth: "İstanbul - Kadıköy",
          nationality: "T.C.",
          gender: "MALE",
          maritalStatus: "SINGLE",
          motherName: "Fatma",
          fatherName: "Mehmet",
          city: "İstanbul",
          district: "Beşiktaş",
          addressLine1: "Yıldız Mah. Çırağan Cad. No:12 D:4",
          country: "Türkiye",
          emergencyContactName: "Mehmet Solmaz",
          emergencyContactRelationship: "Baba",
          emergencyContactPhone: "0532 555 4433",
          passportNumber: "U12345678",
          passportCountry: "Türkiye",
          passportIssueDate: new Date("2021-08-20"),
          passportExpiry: new Date("2029-08-20"),
          universityName: "Boğaziçi Üniversitesi",
          universityGpa: "3.42",
          academicLevel: AcademicLevel.UNDERGRADUATE,
          fieldOfStudy: "İktisat",
        },
      },
      watDetail: {
        create: {
          sponsorName: "CIEE",
          sponsorDsNumber: "DS-2019-987654",
          jobTitle: "Lifeguard (Cankurtaran)",
          employerName: "Premier Aquatics Inc.",
          employerState: "VA",
          jobStartDate: new Date("2026-06-15"),
          jobEndDate: new Date("2026-09-15"),
          usArrivalDate: new Date("2026-06-12"),
          sevisId: "N0034567891",
          insuranceProvider: "Aetna Global",
          insurancePolicyNo: "POL-9923841",
          visaInterviewDate: new Date("2026-05-12T10:30:00Z"),
          visaApproved: false,
          notes: "İş fuarında mülakatı başarıyla geçti. Cankurtaranlık sertifikasyon eğitimi planlandı.",
        },
      },
    },
  });

  // Anıl Solmaz Ödeme & Taksitleri
  await prisma.payment.create({
    data: {
      studentId: student1.id,
      description: "Work and Travel 2026 Program Ücreti",
      totalAmount: 3250.0,
      currency: Currency.USD,
      status: PaymentStatus.PARTIALLY_PAID,
      installments: {
        create: [
          {
            sequence: 1,
            amount: 500.0,
            currency: Currency.USD,
            dueDate: new Date("2025-11-01"),
            isPaid: true,
            paidAt: new Date("2025-10-28"),
            paidAmount: 500.0,
            notes: "Ön kayıt depozitosu ödendi",
          },
          {
            sequence: 2,
            amount: 1250.0,
            currency: Currency.USD,
            dueDate: new Date("2026-02-15"),
            isPaid: true,
            paidAt: new Date("2026-02-10"),
            paidAmount: 1250.0,
            notes: "İş yerleştirme ve DS basım taksiti",
          },
          {
            sequence: 3,
            amount: 1500.0,
            currency: Currency.USD,
            dueDate: new Date("2026-04-30"),
            isPaid: false,
            notes: "Vize randevusu öncesi son bakiye",
          },
        ],
      },
    },
  });

  // Anıl Solmaz Evrakları
  await prisma.document.createMany({
    data: [
      {
        studentId: student1.id,
        type: DocumentType.PASSPORT,
        fileName: "anil_solmaz_pasaport.pdf",
        fileUrl: "/mock-docs/anil_solmaz_pasaport.pdf",
        fileSizeBytes: 2450000,
        mimeType: "application/pdf",
        verificationStatus: VerificationStatus.APPROVED,
        uploadedByStudent: true,
      },
      {
        studentId: student1.id,
        type: DocumentType.TRANSCRIPT,
        fileName: "bogazici_resmi_transkript_anil.pdf",
        fileUrl: "/mock-docs/bogazici_transkript.pdf",
        fileSizeBytes: 1840000,
        mimeType: "application/pdf",
        verificationStatus: VerificationStatus.APPROVED,
        uploadedByStudent: true,
      },
      {
        studentId: student1.id,
        type: DocumentType.SPONSOR_LETTER,
        fileName: "ciee_job_offer_premier_aquatics.pdf",
        fileUrl: "/mock-docs/job_offer.pdf",
        fileSizeBytes: 3100000,
        mimeType: "application/pdf",
        verificationStatus: VerificationStatus.APPROVED,
        uploadedByStudent: false,
      },
    ],
  });

  // Anıl Solmaz Danışman Notları
  await prisma.advisorNote.createMany({
    data: [
      {
        studentId: student1.id,
        authorId: advisorRecep.id,
        note: "İngilizce seviye tespit mülakatı yapıldı, Advanced (B2/C1) olarak teyit edildi. CIEE havuz işlerine uygun.",
        createdAt: new Date("2025-10-25T14:00:00Z"),
      },
      {
        studentId: student1.id,
        authorId: advisorRecep.id,
        note: "Premier Aquatics iş fuarı mülakatını başarıyla geçti. Saatlik 18$ ücret + konaklama desteği onaylandı.",
        createdAt: new Date("2026-01-18T16:30:00Z"),
      },
      {
        studentId: student1.id,
        authorId: advisorRecep.id,
        note: "DS-2019 belgesi basım aşamasında. Vize randevusu 12 Mayıs için konsolosluk sistemine girildi.",
        isPinned: true,
        createdAt: new Date("2026-02-25T11:00:00Z"),
      },
    ],
  });

  // Anıl Solmaz Onay Bekleyen Talep (Gerçekçi Diff!)
  await prisma.pendingApproval.create({
    data: {
      studentId: student1.id,
      entityType: ApprovalEntityType.STUDENT_PROFILE,
      oldData: {
        passportNumber: "U12345678",
        passportExpiry: "2029-08-20T00:00:00.000Z",
        universityGpa: "3.42",
        emergencyContactPhone: "0532 555 4433",
      },
      newData: {
        passportNumber: "U87654321",
        passportExpiry: "2031-10-15T00:00:00.000Z",
        universityGpa: "3.58",
        emergencyContactPhone: "0532 999 8877",
      },
      status: ApprovalStatus.PENDING,
      createdAt: new Date("2026-03-08T09:20:00Z"),
    },
  });

  // --- ÖĞRENCİ 2: Deniz Arda (Akademi - Münih Teknik / TUM M.Sc.) ---
  const student2Id = "00000000-0000-0000-0000-000000000004";
  await createOrUpdateSupabaseAuthUser(student2Id, "deniz.arda@example.com", "Deniz Arda");

  const student2User = await prisma.user.create({
    data: {
      id: student2Id,
      email: "deniz.arda@example.com",
      fullName: "Deniz Arda",
      phone: "0530 456 7890",
      passwordHash,
      role: Role.STUDENT,
      isActive: true,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: student2User.id,
      advisorId: advisorIpek.id,
      program: Program.ACADEMY,
      isActive: true,
      profile: {
        create: {
          nationalId: "98765432109",
          dateOfBirth: new Date("2001-09-22"),
          placeOfBirth: "Ankara - Çankaya",
          nationality: "T.C.",
          gender: "FEMALE",
          maritalStatus: "SINGLE",
          city: "Ankara",
          district: "Çankaya",
          addressLine1: "Tunalı Hilmi Cad. No:45/8",
          country: "Türkiye",
          emergencyContactName: "Kemal Arda",
          emergencyContactRelationship: "Baba",
          emergencyContactPhone: "0532 222 3344",
          passportNumber: "U45678901",
          passportExpiry: new Date("2030-04-10"),
          universityName: "Orta Doğu Teknik Üniversitesi (ODTÜ)",
          universityGpa: "3.75",
          academicLevel: AcademicLevel.UNDERGRADUATE,
          fieldOfStudy: "Bilgisayar Mühendisliği",
        },
      },
      academyDetail: {
        create: {
          targetCountry: "Almanya / Münih",
          targetUniversity: "Technical University of Munich (TUM)",
          targetProgram: "M.Sc. in Computer Science & AI",
          academicLevel: AcademicLevel.MASTERS,
          intakeYear: 2026,
          intakeSeason: "Fall / Güz",
          ieltsOverall: "7.5",
          ieltsListening: "8.0",
          ieltsReading: "7.5",
          ieltsWriting: "7.0",
          ieltsSpeaking: "7.5",
          toeflTotal: 104,
          applicationStatus: "TUM Ön Kabul Mektubu Alındı · Vize Dosyası Hazırlanıyor",
        },
      },
    },
  });

  // Deniz Arda Ödemeleri
  await prisma.payment.create({
    data: {
      studentId: student2.id,
      description: "Almanya Yüksek Lisans Danışmanlık & Yerleştirme Paketi",
      totalAmount: 2200.0,
      currency: Currency.EUR,
      status: PaymentStatus.PARTIALLY_PAID,
      installments: {
        create: [
          {
            sequence: 1,
            amount: 1200.0,
            currency: Currency.EUR,
            dueDate: new Date("2025-12-15"),
            isPaid: true,
            paidAt: new Date("2025-12-10"),
            paidAmount: 1200.0,
          },
          {
            sequence: 2,
            amount: 1000.0,
            currency: Currency.EUR,
            dueDate: new Date("2026-05-15"),
            isPaid: false,
          },
        ],
      },
    },
  });

  // Deniz Arda Danışman Notları
  await prisma.advisorNote.create({
    data: {
      studentId: student2.id,
      authorId: advisorIpek.id,
      note: "Uni-assist denklik onayı (VPD belgesi) geldi. TUM portalına başvuru tamamlandı. Bloke hesap (Fintiba) açılışı yönlendirildi.",
      isPinned: true,
      createdAt: new Date("2026-02-14T10:00:00Z"),
    },
  });

  // Deniz Arda Revize İstenen Belge
  await prisma.document.create({
    data: {
      studentId: student2.id,
      type: DocumentType.LANGUAGE_SCORE_REPORT,
      fileName: "ielts_test_report_deniz.pdf",
      fileUrl: "/mock-docs/ielts_deniz.pdf",
      verificationStatus: VerificationStatus.REVISION_REQUESTED,
      rejectionReason: "Yüklediğiniz IELTS sınav belgesinin üzerinde TRF doğrulama numarası okunmuyor. Lütfen taranmış yüksek çözünürlüklü PDF formatında tekrar yükleyiniz.",
      uploadedByStudent: true,
    },
  });

  // --- ÖĞRENCİ 3: Zeynep Melis Karaca (Dil Okulu - EC English Dublin) ---
  const student3Id = "00000000-0000-0000-0000-000000000006";
  await createOrUpdateSupabaseAuthUser(student3Id, "zeynep.karaca@example.com", "Zeynep Melis Karaca");

  const student3User = await prisma.user.create({
    data: {
      id: student3Id,
      email: "zeynep.karaca@example.com",
      fullName: "Zeynep Melis Karaca",
      phone: "0532 987 6543",
      passwordHash,
      role: Role.STUDENT,
      isActive: true,
    },
  });

  const student3 = await prisma.student.create({
    data: {
      userId: student3User.id,
      advisorId: advisorIpek.id,
      program: Program.LANGUAGE_SCHOOL,
      isActive: true,
      profile: {
        create: {
          nationalId: "23456789012",
          dateOfBirth: new Date("2000-11-08"),
          placeOfBirth: "İzmir - Karşıyaka",
          nationality: "T.C.",
          gender: "FEMALE",
          maritalStatus: "SINGLE",
          city: "İstanbul",
          district: "Kadıköy",
          addressLine1: "Moda Cad. No:14 D:2",
          country: "Türkiye",
          emergencyContactName: "Ayşe Karaca",
          emergencyContactRelationship: "Anne",
          emergencyContactPhone: "0532 111 2233",
          passportNumber: "U76543210",
          passportExpiry: new Date("2030-07-25"),
          universityName: "İstanbul Üniversitesi",
          universityGpa: "3.10",
          academicLevel: AcademicLevel.UNDERGRADUATE,
          fieldOfStudy: "İşletme",
        },
      },
      languageDetail: {
        create: {
          targetCountry: "İrlanda",
          targetCity: "Dublin",
          schoolName: "EC English Dublin",
          courseType: "25 Hafta Yoğun Genel İngilizce (Çalışma İzinli)",
          weeksDuration: 25,
          accommodationType: "Aile Yanı (Tek Kişilik Oda + Yarım Pansiyon)",
          currentLanguageLevel: "B1 Intermediate",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-11-20"),
          notes: "Öğrenci Dublin'de haftalık 20 saat yasal çalışma hakkından faydalanmak istiyor.",
        },
      },
    },
  });

  // Zeynep Karaca Ödeme
  await prisma.payment.create({
    data: {
      studentId: student3.id,
      description: "İrlanda 25 Hafta Kurs + Aile Yanı Konaklama + Vize Harcı",
      totalAmount: 4850.0,
      currency: Currency.EUR,
      status: PaymentStatus.PARTIALLY_PAID,
      installments: {
        create: [
          {
            sequence: 1,
            amount: 2425.0,
            currency: Currency.EUR,
            dueDate: new Date("2026-01-20"),
            isPaid: true,
            paidAt: new Date("2026-01-18"),
            paidAmount: 2425.0,
          },
          {
            sequence: 2,
            amount: 2425.0,
            currency: Currency.EUR,
            dueDate: new Date("2026-04-15"),
            isPaid: false,
          },
        ],
      },
    },
  });

  // Zeynep Karaca Bekleyen Onay Talebi (Adres & Telefon Güncellemesi)
  await prisma.pendingApproval.create({
    data: {
      studentId: student3.id,
      entityType: ApprovalEntityType.STUDENT_PROFILE,
      oldData: {
        emergencyContactPhone: "0532 111 2233",
        addressLine1: "Moda Cad. No:14 D:2",
      },
      newData: {
        emergencyContactPhone: "0532 888 9900",
        addressLine1: "Suadiye Mah. Bağdat Cad. No:240 D:8",
      },
      status: ApprovalStatus.PENDING,
      createdAt: new Date("2026-03-09T14:10:00Z"),
    },
  });

  // --- ÖĞRENCİ 4: Barış Akın (WAT - Cedar Point Ohio - Gecikmiş Taksit Testi!) ---
  const student4Id = "00000000-0000-0000-0000-000000000007";
  await createOrUpdateSupabaseAuthUser(student4Id, "baris.akin@example.com", "Barış Akın");

  const student4User = await prisma.user.create({
    data: {
      id: student4Id,
      email: "baris.akin@example.com",
      fullName: "Barış Akın",
      phone: "0542 555 6677",
      passwordHash,
      role: Role.STUDENT,
      isActive: true,
    },
  });

  const student4 = await prisma.student.create({
    data: {
      userId: student4User.id,
      advisorId: advisorRecep.id,
      program: Program.WORK_AND_TRAVEL,
      isActive: true,
      profile: {
        create: {
          nationalId: "34567890123",
          dateOfBirth: new Date("2003-02-18"),
          placeOfBirth: "Bursa - Nilüfer",
          nationality: "T.C.",
          gender: "MALE",
          maritalStatus: "SINGLE",
          city: "İstanbul",
          district: "Sarıyer",
          addressLine1: "İTÜ Ayazağa Kampüsü Gölet Yurtları",
          country: "Türkiye",
          emergencyContactName: "Serdar Akın",
          emergencyContactRelationship: "Ağabey",
          emergencyContactPhone: "0532 777 8899",
          passportNumber: "U65432109",
          passportExpiry: new Date("2031-03-15"),
          universityName: "İstanbul Teknik Üniversitesi (İTÜ)",
          universityGpa: "2.85",
          academicLevel: AcademicLevel.UNDERGRADUATE,
          fieldOfStudy: "Makine Mühendisliği",
        },
      },
      watDetail: {
        create: {
          sponsorName: "Intrax",
          sponsorDsNumber: "DS-2019-445566",
          jobTitle: "Ride Operator (Eğlence Parkı Operatörü)",
          employerName: "Cedar Point Amusement Park",
          employerState: "OH",
          jobStartDate: new Date("2026-06-20"),
          jobEndDate: new Date("2026-09-25"),
          usArrivalDate: new Date("2026-06-18"),
          sevisId: "N0099887766",
          insuranceProvider: "Intrax CareMed Global",
          visaApproved: false,
        },
      },
    },
  });

  // Barış Akın Ödemeleri — 1 ADET GECİKMİŞ (OVERDUE) TAKSİT (Dashboard istatistiği için!)
  await prisma.payment.create({
    data: {
      studentId: student4.id,
      description: "Work and Travel 2026 Kayıt & Yerleştirme",
      totalAmount: 3100.0,
      currency: Currency.USD,
      status: PaymentStatus.OVERDUE,
      installments: {
        create: [
          {
            sequence: 1,
            amount: 500.0,
            currency: Currency.USD,
            dueDate: new Date("2025-11-15"),
            isPaid: true,
            paidAt: new Date("2025-11-10"),
            paidAmount: 500.0,
          },
          {
            sequence: 2,
            amount: 1300.0,
            currency: Currency.USD,
            dueDate: new Date("2026-01-15"), // Geçmiş tarih: OVERDUE!
            isPaid: false,
            notes: "Vadesi geçti, danışman öğrenciyi ödeme için aradı.",
          },
          {
            sequence: 3,
            amount: 1300.0,
            currency: Currency.USD,
            dueDate: new Date("2026-04-15"),
            isPaid: false,
          },
        ],
      },
    },
  });

  // Barış Akın Danışman Notu
  await prisma.advisorNote.create({
    data: {
      studentId: student4.id,
      authorId: advisorRecep.id,
      note: "Öğrenci 2. taksit gecikmesi için arandı. 20 Mart'ta burs ödemesi yattığında ödeyeceğini belirtti.",
      createdAt: new Date("2026-02-05T15:00:00Z"),
    },
  });

  // Barış Akın Evrakları
  await prisma.document.createMany({
    data: [
      {
        studentId: student4.id,
        type: DocumentType.PASSPORT,
        fileName: "baris_akin_pasaport.pdf",
        fileUrl: "/mock-docs/baris_pasaport.pdf",
        fileSizeBytes: 2100000,
        mimeType: "application/pdf",
        verificationStatus: VerificationStatus.APPROVED,
        uploadedByStudent: true,
      },
      {
        studentId: student4.id,
        type: DocumentType.TRANSCRIPT,
        fileName: "itu_transkript_baris.pdf",
        fileUrl: "/mock-docs/itu_transkript.pdf",
        fileSizeBytes: 1450000,
        mimeType: "application/pdf",
        verificationStatus: VerificationStatus.APPROVED,
        uploadedByStudent: true,
      },
    ],
  });

  // Barış Akın Bekleyen WAT Değişiklik Talebi
  await prisma.pendingApproval.create({
    data: {
      studentId: student4.id,
      entityType: ApprovalEntityType.WAT_DETAIL,
      oldData: {
        jobTitle: "Ride Operator",
        sevisId: "N0099887766",
        visaInterviewDate: "2026-04-10T09:00:00.000Z",
      },
      newData: {
        jobTitle: "Ride Operations Team Lead",
        sevisId: "N0099887766",
        visaInterviewDate: "2026-04-28T10:30:00.000Z",
      },
      status: ApprovalStatus.PENDING,
      createdAt: new Date("2026-03-09T16:45:00Z"),
    },
  });

  // Deniz Arda: Geçmişte Revize İstenen Talep (Revize tab'ı testi için!)
  await prisma.pendingApproval.create({
    data: {
      studentId: student2.id,
      entityType: ApprovalEntityType.ACADEMY_DETAIL,
      oldData: {
        applicationStatus: "TUM Başvuru Belgeleri Gönderildi",
      },
      newData: {
        applicationStatus: "IELTS Belgesi Eksik / Doğrulanamadı",
      },
      status: ApprovalStatus.REVISION_REQUESTED,
      rejectionReason: "Yüklenen sınav belgesinde TRF doğrulama numarası okunmuyor. Lütfen renkli taranmış yüksek çözünürlüklü PDF yükleyin.",
      reviewedById: advisorIpek.id,
      reviewedAt: new Date("2026-03-05T11:00:00Z"),
      createdAt: new Date("2026-03-04T15:00:00Z"),
    },
  });

  // Anıl Solmaz: Geçmişte Onaylanan Talep (Onaylananlar tab'ı testi için!)
  await prisma.pendingApproval.create({
    data: {
      studentId: student1.id,
      entityType: ApprovalEntityType.STUDENT_PROFILE,
      oldData: {
        district: "Şişli",
        addressLine1: "Eski Adres Sok. No:5",
      },
      newData: {
        district: "Beşiktaş",
        addressLine1: "Yıldız Mah. Çırağan Cad. No:12 D:4",
      },
      status: ApprovalStatus.APPROVED,
      reviewedById: advisorRecep.id,
      reviewedAt: new Date("2026-02-10T14:20:00Z"),
      createdAt: new Date("2026-02-09T10:00:00Z"),
    },
  });

  // --- ÖĞRENCİ 5: Cemre Doğan (Yaz Kampı - Oxford Summer Academy - PAID!) ---
  const student5Id = "00000000-0000-0000-0000-000000000008";
  await createOrUpdateSupabaseAuthUser(student5Id, "cemre.dogan@example.com", "Cemre Doğan");

  const student5User = await prisma.user.create({
    data: {
      id: student5Id,
      email: "cemre.dogan@example.com",
      fullName: "Cemre Doğan",
      phone: "0533 111 4455",
      passwordHash,
      role: Role.STUDENT,
      isActive: true,
    },
  });

  const student5 = await prisma.student.create({
    data: {
      userId: student5User.id,
      advisorId: advisorIpek.id,
      program: Program.SUMMER_CAMP,
      isActive: true,
      profile: {
        create: {
          nationalId: "45678901234",
          dateOfBirth: new Date("2008-06-10"),
          placeOfBirth: "İstanbul - Şişli",
          nationality: "T.C.",
          gender: "FEMALE",
          city: "İstanbul",
          district: "Sarıyer",
          addressLine1: "Tarabya Mah. Dereboyu Cad. No:8",
          country: "Türkiye",
          emergencyContactName: "Hakan Doğan",
          emergencyContactRelationship: "Veli / Baba",
          emergencyContactPhone: "0532 999 0011",
          passportNumber: "U32109876",
          passportExpiry: new Date("2033-01-15"),
          highSchoolName: "Robert Koleji",
          academicLevel: AcademicLevel.HIGH_SCHOOL,
        },
      },
      summerCampDetail: {
        create: {
          targetCountry: "İngiltere",
          campName: "Oxford Summer Academy (St. Hugh's College)",
          campProvider: "Oxford Royale Academy",
          programType: "STEM & International Leadership",
          startDate: new Date("2026-07-05"),
          endDate: new Date("2026-07-26"),
          ageGroup: "16-18 Yaş",
          guardianName: "Hakan Doğan",
          guardianPhone: "0532 999 0011",
          flightArranged: true,
          airportTransfer: true,
          notes: "Heathrow havalimanı gidiş-dönüş özel transfer ayarlandı.",
        },
      },
    },
  });

  // Cemre Doğan Ödemesi (TAMAMI ÖDENMİŞ)
  await prisma.payment.create({
    data: {
      studentId: student5.id,
      description: "Oxford Summer Academy 3 Hafta Her Şey Dahil Kamp Ücreti",
      totalAmount: 3800.0,
      currency: Currency.GBP,
      status: PaymentStatus.PAID,
      installments: {
        create: [
          {
            sequence: 1,
            amount: 1900.0,
            currency: Currency.GBP,
            dueDate: new Date("2025-12-01"),
            isPaid: true,
            paidAt: new Date("2025-11-25"),
            paidAmount: 1900.0,
          },
          {
            sequence: 2,
            amount: 1900.0,
            currency: Currency.GBP,
            dueDate: new Date("2026-02-01"),
            isPaid: true,
            paidAt: new Date("2026-01-29"),
            paidAmount: 1900.0,
          },
        ],
      },
    },
  });

  console.log("✅ 5 adet zengin kayıtlı öğrenci (Student) oluşturuldu.");

  // =========================================================================
  // 4. ADVICE V2 MODÜLLERİ: Muhasebe Rolü, WAT İş Havuzu, Partner Okullar,
  //    Akademik Başvurular, Yaz Okulu Allocation/Booking ve Muhasebe Defteri
  // =========================================================================

  // Muhasebe Kullanıcısı (Section 1 & 8)
  const accountingUserId = "00000000-0000-0000-0000-000000000009";
  await prisma.user.create({
    data: {
      id: accountingUserId,
      email: "muhasebe@adviceyed.com",
      fullName: "Selim Kaya (Muhasebe & Finans)",
      phone: "0532 100 0009",
      passwordHash,
      role: Role.ACCOUNTING,
      isActive: true,
      advisorProfile: {
        create: {
          department: "Finans & Muhasebe Departmanı",
          bio: "Kıdemli Finans ve Tahsilat Uzmanı",
          allowedPrograms: [],
          canManageApprovals: false,
          canManageMarketing: false,
          canExportData: true,
          canViewAllLeads: false,
          canManageAccounting: true,
        },
      },
    },
  });

  // Dinamik Roller (CustomRole - Section 1)
  await prisma.customRole.createMany({
    data: [
      {
        name: "Süper Yönetici (Admin)",
        slug: "super-admin",
        description: "Tüm modüller, muhasebe, rol tanımlama ve sistem ayarlarına tam erişim.",
        baseRole: Role.ADMIN,
        isSystem: true,
        permissions: {
          allModules: true,
          canManageAccounting: true,
          canManageJobPool: true,
          canManagePartnerPool: true,
          canExportData: true,
        },
      },
      {
        name: "Work and Travel Danışmanı",
        slug: "wat-advisor",
        description: "WAT adayları, öğrencileri, iş havuzu, DS-160 ve vize takibi yetkisi.",
        baseRole: Role.ADVISOR,
        isSystem: true,
        permissions: {
          allowedPrograms: ["WORK_AND_TRAVEL"],
          canManageJobPool: true,
          canManageApprovals: true,
        },
      },
      {
        name: "Akademi & Dil Okulu Danışmanı",
        slug: "academy-language-advisor",
        description: "Akademi, Dil Okulu, Yaz Kampı, Partner Okul Havuzu ve Application yönetimi.",
        baseRole: Role.ADVISOR,
        isSystem: true,
        permissions: {
          allowedPrograms: ["ACADEMY", "LANGUAGE_SCHOOL", "SUMMER_CAMP"],
          canManagePartnerPool: true,
          canManageApprovals: true,
        },
      },
      {
        name: "Muhasebe & Finans Uzmanı",
        slug: "accounting-specialist",
        description: "Sadece muhasebe modülü, tahsilatlar, komisyonlar ve okul-hafta satış raporları.",
        baseRole: Role.ACCOUNTING,
        isSystem: true,
        permissions: {
          canManageAccounting: true,
          canExportData: true,
        },
      },
    ],
  });

  // Lead Follow-up Tarihleri Güncellemesi (Bugün, Overdue, Hiç Aranmamış, Tamamlandı sekmeleri için)
  const allLeads = await prisma.lead.findMany({ orderBy: { createdAt: "asc" } });
  const now = new Date();
  const todayFollowUp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30, 0);
  const overdueFollowUp = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 gün geçmiş (Overdue!)
  const futureFollowUp = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  if (allLeads[0]) {
    await prisma.lead.update({
      where: { id: allLeads[0].id },
      data: {
        sponsor: "AWA",
        city: "İstanbul",
        visaStatus: "Başvuru Hazırlığında",
        followUpAt: todayFollowUp,
        lastContactedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        lastCallOutcome: "REACHED",
        callCount: 1,
      },
    });
  }
  if (allLeads[1]) {
    await prisma.lead.update({
      where: { id: allLeads[1].id },
      data: {
        sponsor: "TUM / Uni-Assist",
        city: "Ankara",
        visaStatus: "Evrak Bekleniyor",
        followUpAt: overdueFollowUp, // OVERDUE kırmızı uyarı!
        lastContactedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        lastCallOutcome: "BUSY",
        callCount: 1,
      },
    });
  }
  if (allLeads[2]) {
    await prisma.lead.update({
      where: { id: allLeads[2].id },
      data: {
        sponsor: "EC English",
        city: "İzmir",
        visaStatus: "Belirsiz",
        followUpAt: todayFollowUp,
        callCount: 0,
      },
    });
  }
  if (allLeads[3]) {
    await prisma.lead.update({
      where: { id: allLeads[3].id },
      data: {
        sponsor: "IEE",
        city: "Bursa",
        visaStatus: "Pasaport Bekleniyor",
        followUpAt: overdueFollowUp, // OVERDUE!
        callCount: 0,
      },
    });
  }
  if (allLeads[4]) {
    await prisma.lead.update({
      where: { id: allLeads[4].id },
      data: {
        sponsor: "Oxford Royale",
        city: "Antalya",
        lastContactedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        lastCallOutcome: "UNINTERESTED",
        callCount: 2,
        followUpAt: futureFollowUp,
      },
    });
  }

  // WAT İş Havuzu (Section 4 — 22 Alanlı Gerçekçi İş İlanları)
  const watJob1 = await prisma.watJob.create({
    data: {
      sponsor: "AWA",
      program: "Work and Travel",
      jobCategory: "Lifeguard",
      jobTitle: "Premier Aquatics — Lifeguard",
      placementType: "Full Placement",
      location: "Virginia Beach, VA",
      state: "VA",
      arrivalAirport: "Washington Dulles (IAD)",
      hourlyWage: 18.0,
      avgWorkingHours: 40,
      accommodationCost: 115.0,
      accommodationDeposit: 200.0,
      food: "Yok (Mutfaklı Konaklama)",
      transportation: "Bisiklet / Toplu Taşıma (Yürüme Mesafesi)",
      workApparel: "Ücretsiz Cankurtaran Üniforması + Düdük",
      position: "Pool Lifeguard",
      genderPreference: "Males and Females",
      jobStartDate: new Date("2026-06-15"),
      jobEndDate: new Date("2026-09-15"),
      earlyLeaveInfo: "7 Eylül sonrası izinli",
      numPlacements: 12,
      filledPlacements: 4,
      bonus: "Sezon sonu $250 tamamlama bonusu",
      additionalInfo: "Ücretsiz Red Cross sertifika eğitimi işveren tarafından sağlanır. Overtime (27$/saat) imkanı mevcuttur.",
      isActive: true,
    },
  });

  const watJob2 = await prisma.watJob.create({
    data: {
      sponsor: "UWT",
      program: "Work and Travel",
      jobCategory: "Amusement Park",
      jobTitle: "Cedar Point Amusement Park — Ride Operator",
      placementType: "Full Placement",
      location: "Sandusky, OH",
      state: "OH",
      arrivalAirport: "Cleveland Hopkins (CLE)",
      hourlyWage: 16.5,
      avgWorkingHours: 42,
      accommodationCost: 85.0,
      accommodationDeposit: 100.0,
      food: "Personel kafeteryasında %50 indirimli öğün",
      transportation: "Ücretsiz Park İçi Shuttle Servisi",
      workApparel: "2 adet tişört işveren tarafından verilir, bej şort öğrenciye ait",
      position: "Ride Operator & Park Attendant",
      genderPreference: "Males and Females",
      jobStartDate: new Date("2026-06-10"),
      jobEndDate: new Date("2026-09-20"),
      earlyLeaveInfo: "Var (10 Eylül)",
      numPlacements: 20,
      filledPlacements: 8,
      bonus: "Saat başı +$1.00 sezon sonu sadakat primi",
      additionalInfo: "Amerika'nın en büyük roller coaster parkı. Kampüs içi yurt konaklaması.",
      isActive: true,
    },
  });

  await prisma.watJob.createMany({
    data: [
      {
        sponsor: "IEE",
        program: "Work and Travel",
        jobCategory: "Hospitality & Resort",
        jobTitle: "Grand Hotel Mackinac Island — Server & Hostess",
        placementType: "Full Placement",
        location: "Mackinac Island, MI",
        state: "MI",
        arrivalAirport: "Pellston Regional (PLN) / Detroit (DTW)",
        hourlyWage: 15.5,
        avgWorkingHours: 38,
        accommodationCost: 95.0,
        accommodationDeposit: 150.0,
        food: "Günde 3 öğün ücretsiz açık büfe yemek",
        transportation: "Ada içi yaya / bisiklet ulaşımı",
        workApparel: "Siyah pantolon, beyaz gömlek",
        position: "Dining Room Server / Host",
        genderPreference: "Males and Females",
        jobStartDate: new Date("2026-06-12"),
        jobEndDate: new Date("2026-09-18"),
        earlyLeaveInfo: "Yok",
        numPlacements: 8,
        filledPlacements: 2,
        bonus: "Bahşiş (Tips) + Sezon sonu $300 bonus",
        additionalInfo: "Bahşişlerle birlikte haftalık ortalama $850-$1100 kazanç potansiyeli.",
        isActive: true,
      },
      {
        sponsor: "Life Adventures",
        program: "Work and Travel",
        jobCategory: "Food & Beverage",
        jobTitle: "Ocean City Boardwalk — Barista & Cashier",
        placementType: "Full Placement",
        location: "Ocean City, MD",
        state: "MD",
        arrivalAirport: "Baltimore/Washington (BWI) / JFK",
        hourlyWage: 16.0,
        avgWorkingHours: 36,
        accommodationCost: 130.0,
        accommodationDeposit: 250.0,
        food: "Vardiya sırasında 1 öğün ücretsiz + kahve",
        transportation: "Otobüs (haftalık $15 sınırsız geçiş)",
        workApparel: "İşveren tişörtü + kot/şort",
        position: "Barista / Counter Staff",
        genderPreference: "Females Only",
        jobStartDate: new Date("2026-06-08"),
        jobEndDate: new Date("2026-09-12"),
        earlyLeaveInfo: "1 Eylül sonrası mümkün",
        numPlacements: 6,
        filledPlacements: 1,
        bonus: "Bahşiş (Tip Jar paylaşımı)",
        additionalInfo: "Sahil kasabası, ikinci iş (second job) bulmaya çok elverişli lokasyon.",
        isActive: true,
      },
    ],
  });

  // Öğrenciye Özel İş Linki Ataması (Anıl Solmaz & Barış Akın)
  await prisma.watJobAssignment.create({
    data: {
      jobId: watJob1.id,
      studentId: student1.id,
      assignedById: advisorRecep.id,
      shareToken: "advice-wat-offer-anil-2026",
      status: "ACCEPTED",
      studentNote: "İş şartlarını ve konaklama detaylarını inceledim, onaylıyorum.",
      respondedAt: new Date("2026-02-15T14:20:00Z"),
    },
  });

  await prisma.watJobAssignment.create({
    data: {
      jobId: watJob2.id,
      studentId: student4.id,
      assignedById: advisorRecep.id,
      shareToken: "advice-wat-offer-baris-2026",
      status: "SENT",
    },
  });

  // Anıl Solmaz WAT DS-160 & Konaklama Güncellemesi
  await prisma.watDetail.update({
    where: { studentId: student1.id },
    data: {
      currentStage: "VISA_APPOINTMENT",
      ds160Status: "SUBMITTED",
      ds160ConfirmationNo: "AA0098X4K2",
      passportDeadline: new Date("2026-03-01"),
      visaDeadline: new Date("2026-05-05"),
      accommodationSold: true,
      accommodationCommission: 250.0,
      ds160Data: {
        confirmationNo: "AA0098X4K2",
        consulateLocation: "İstanbul Başkonsolosluğu",
        travelPurpose: "J-1 Exchange Visitor (Work & Travel)",
        intendedArrivalDate: "2026-06-12",
        intendedLengthOfStay: "3.5 Ay",
        usAddressStreet: "400 Atlantic Ave",
        usAddressCity: "Virginia Beach",
        usAddressState: "VA",
        usContactName: "Premier Aquatics HR",
        usContactPhone: "+1 757-555-0192",
        sevisId: "N0034567891",
        programNumber: "P-4-05412",
      },
    },
  });

  // Barış Akın WAT Overdue Deadline Testi
  await prisma.watDetail.update({
    where: { studentId: student4.id },
    data: {
      currentStage: "JOB_PLACEMENT",
      ds160Status: "DRAFT",
      passportDeadline: new Date("2026-02-01"),
      visaDeadline: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // OVERDUE!
    },
  });

  // Partner Okul Havuzu (Section 6 [P1])
  const partnerTum = await prisma.partnerSchool.create({
    data: {
      name: "Technical University of Munich (TUM)",
      country: "Almanya",
      city: "Münih",
      programType: Program.ACADEMY,
      programsOffered: ["M.Sc. Computer Science", "M.Sc. Data Engineering", "B.Sc. Management & Tech"],
      quota: 15,
      commissionRate: 12.0,
      commissionFixed: 450.0,
      currency: Currency.EUR,
      contactEmail: "international@tum.de",
      website: "https://www.tum.de",
      notes: "Uni-assist VPD ön onayı gerektirir. Son başvuru 31 Mayıs.",
    },
  });

  const partnerEcDublin = await prisma.partnerSchool.create({
    data: {
      name: "EC English Language Centres — Dublin",
      country: "İrlanda",
      city: "Dublin",
      programType: Program.LANGUAGE_SCHOOL,
      programsOffered: ["25 Hafta Work & Study", "Yoğun İngilizce 30 Ders", "IELTS Hazırlık"],
      quota: 40,
      commissionRate: 25.0,
      commissionFixed: 950.0,
      currency: Currency.EUR,
      contactEmail: "admissions@ecenglish.com",
      website: "https://www.ecenglish.com",
      notes: "25 hafta kayıtlarda %25 acente komisyonu (Gross/Net fatura kesilir).",
    },
  });

  const partnerOxfordRoyale = await prisma.partnerSchool.create({
    data: {
      name: "Oxford Royale Academy — St. Hugh's College",
      country: "İngiltere",
      city: "Oxford",
      programType: Program.SUMMER_CAMP,
      programsOffered: ["STEM & Leadership (16-18)", "Medical School Prep", "Young Explorers (13-15)"],
      quota: 30,
      commissionRate: 15.0,
      commissionFixed: 570.0,
      currency: Currency.GBP,
      contactEmail: "groups@oxfordroyale.com",
      website: "https://www.oxfordroyale.com",
      notes: "Grup allocation sözleşmesi mevcut. 15 öğrenciye 1 grup lideri ücretsiz.",
    },
  });

  // Akademik Başvurular (Section 6 [P1] — Deniz Arda Application Kartları)
  await prisma.academicApplication.createMany({
    data: [
      {
        appCode: "APP-2026-101",
        studentId: student2.id,
        partnerSchoolId: partnerTum.id,
        institutionName: "Technical University of Munich (TUM)",
        country: "Almanya",
        courseName: "M.Sc. in Computer Science & AI",
        degree: "M.Sc.",
        intake: "Fall 2026",
        priority: 1,
        status: "CONDITIONAL_OFFER",
        applicationDeadline: new Date("2026-05-31"),
        visaDeadline: new Date("2026-07-15"),
        notes: "Ön kabul mektubu alındı. Bloke hesap onayı bekleniyor.",
      },
      {
        appCode: "APP-2026-102",
        studentId: student2.id,
        institutionName: "RWTH Aachen University",
        country: "Almanya",
        courseName: "M.Sc. Data Science",
        degree: "M.Sc.",
        intake: "Fall 2026",
        priority: 2,
        status: "SENT_TO_INSTITUTION",
        applicationDeadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Overdue test!
        visaDeadline: new Date("2026-07-20"),
        notes: "Kuruma gönderildi, komite değerlendirmesinde.",
      },
    ],
  });

  // Dil Okulu 5 Aşamalı Takip Güncellemesi (Zeynep Melis Karaca - Section 6)
  await prisma.languageDetail.update({
    where: { studentId: student3.id },
    data: {
      partnerSchoolId: partnerEcDublin.id,
      agreementsDone: true,
      agreementsDate: new Date("2026-01-12"),
      agreementsSignedDone: true,
      agreementsSignedDate: new Date("2026-01-15"),
      grossInvoiceDone: true,
      grossInvoiceDate: new Date("2026-01-18"),
      grossInvoiceAmount: 4850.0,
      netInvoiceDone: true,
      netInvoiceDate: new Date("2026-01-19"),
      netInvoiceAmount: 3637.5,
      letterOfAcceptanceDone: false,
    },
  });

  // Yaz Okulu Allocation & Booking (Section 5 & Section 7)
  const oxfordAllocation = await prisma.summerAllocation.create({
    data: {
      country: "İngiltere",
      centerName: "Oxford St. Hugh's College Campus",
      nights: 21,
      startDate: new Date("2026-07-05"),
      endDate: new Date("2026-07-26"),
      totalQuota: 20,
      usedQuota: 12,
      pricePerStudent: 3800.0,
      currency: Currency.GBP,
      notes: "Advice 2026 Temmuz UK Grup Kontenjanı",
    },
  });

  const oxfordBooking = await prisma.summerBooking.create({
    data: {
      bookingCode: "BK-2026-101",
      groupName: "UK Oxford Temmuz 2026 Grubu",
      allocationId: oxfordAllocation.id,
      country: "İngiltere",
      centerName: "Oxford St. Hugh's College Campus",
      nights: 21,
      startDate: new Date("2026-07-05"),
      participantCount: 12,
      termsAccepted: true,
      airportTransfers: {
        arrivalAirport: "London Heathrow (LHR)",
        arrivalFlightNo: "TK1979",
        departureAirport: "London Heathrow (LHR)",
        departureFlightNo: "TK1980",
        transferIncluded: true,
      },
      extraServices: {
        excursions: ["London Eye & Thames Tour", "Cambridge Day Trip", "Harry Potter Warner Bros Studio"],
        travelInsurance: true,
        mealPlan: "Full Board (3 Öğün)",
        groupLeaderCount: 1,
      },
      totalAmount: 45600.0,
      currency: Currency.GBP,
      summaryNotes: "12 öğrenci + 1 grup lideri onaylı UK yaz okulu paketi.",
      status: "CONFIRMED",
    },
  });

  await prisma.student.update({
    where: { id: student5.id },
    data: {
      groupName: "UK Oxford Temmuz 2026 Grubu",
      summerBookingId: oxfordBooking.id,
    },
  });

  await prisma.summerCampDetail.update({
    where: { studentId: student5.id },
    data: {
      ukviLink: "https://visas-immigration.service.gov.uk/apply/uk-visa-cemre-2026",
      visaAppointmentDate: new Date("2026-05-18T11:00:00Z"),
      visaStatus: "TLScontact Randevu Alındı · Evrak Tamam",
    },
  });

  // Muhasebe Defteri Kayıtları (Section 8 — Alınan, Verilen, Komisyonlar ve Okul-Hafta Raporu)
  await prisma.accountingEntry.createMany({
    data: [
      {
        type: "INCOME",
        category: "TUITION",
        studentId: student1.id,
        advisorId: advisorRecep.id,
        description: "Anıl Solmaz — WAT 2026 1. ve 2. Taksit Tahsilatı",
        amount: 1750.0,
        currency: Currency.USD,
        paymentMethod: "BANK_TRANSFER",
        transactionDate: new Date("2026-02-10"),
        isPaid: true,
      },
      {
        type: "EXPENSE",
        category: "VISA_FEE",
        studentId: student1.id,
        advisorId: advisorRecep.id,
        description: "Anıl Solmaz — CIEE Sponsor & SEVIS Ödemesi",
        amount: 920.0,
        currency: Currency.USD,
        paymentMethod: "BANK_TRANSFER",
        transactionDate: new Date("2026-02-18"),
        isPaid: true,
      },
      {
        type: "COMMISSION",
        category: "ACCOMMODATION_COMMISSION",
        studentId: student1.id,
        advisorId: advisorRecep.id,
        description: "Anıl Solmaz — Virginia Beach Konaklama Satış Komisyonu",
        amount: 250.0,
        currency: Currency.USD,
        paymentMethod: "BANK_TRANSFER",
        transactionDate: new Date("2026-02-20"),
        isPaid: true,
      },
      {
        type: "INCOME",
        category: "TUITION",
        studentId: student3.id,
        partnerSchoolId: partnerEcDublin.id,
        advisorId: advisorIpek.id,
        description: "Zeynep Melis Karaca — EC English Dublin 25 Hafta Dil Okulu",
        amount: 4850.0,
        grossAmount: 4850.0,
        netAmount: 3637.5,
        weeksSold: 25,
        currency: Currency.EUR,
        paymentMethod: "BANK_TRANSFER",
        transactionDate: new Date("2026-01-18"),
        isPaid: true,
      },
      {
        type: "COMMISSION",
        category: "SCHOOL_COMMISSION",
        studentId: student3.id,
        partnerSchoolId: partnerEcDublin.id,
        advisorId: advisorIpek.id,
        description: "EC English Dublin — 25 Hafta %25 Acente Satış Komisyonu (Gross - Net)",
        amount: 1212.5,
        grossAmount: 4850.0,
        netAmount: 3637.5,
        weeksSold: 25,
        currency: Currency.EUR,
        paymentMethod: "BANK_TRANSFER",
        transactionDate: new Date("2026-01-20"),
        isPaid: true,
      },
      {
        type: "INCOME",
        category: "TUITION",
        studentId: student5.id,
        partnerSchoolId: partnerOxfordRoyale.id,
        advisorId: advisorIpek.id,
        description: "Cemre Doğan — Oxford Summer Academy 3 Hafta Kamp Ücreti",
        amount: 3800.0,
        grossAmount: 3800.0,
        netAmount: 3230.0,
        weeksSold: 3,
        currency: Currency.GBP,
        paymentMethod: "CREDIT_CARD",
        transactionDate: new Date("2026-01-29"),
        isPaid: true,
      },
    ],
  });

  // Bildirim Merkezi Örnekleri (Section 9 — Çan İkonu Bildirimleri)
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: "OVERDUE",
        title: "⚠️ 2 Adayın Arama Takibi (Follow-up) Gecikti!",
        message: "Caner Erkin ve Alperen Çetin için planlanan arama tarihi geçti.",
        linkUrl: "/leads?tab=overdue",
      },
      {
        userId: advisorRecep.id,
        type: "JOB_RESPONSE",
        title: "✅ Anıl Solmaz WAT İş Teklifini Onayladı",
        message: "Premier Aquatics — Lifeguard (Virginia Beach, VA) teklifi öğrenci tarafından kabul edildi.",
        linkUrl: `/students/${student1.id}`,
      },
      {
        userId: advisorIpek.id,
        type: "DEADLINE",
        title: "⏰ Akademik Başvuru Deadline Uyarısı",
        message: "Deniz Arda — RWTH Aachen M.Sc. başvuru son tarihi geçti, durumu güncelleyin.",
        linkUrl: `/students/${student2.id}`,
      },
    ],
  });

  console.log("✅ Advice V2 Modülleri (İş Havuzu, Partner Okullar, Başvurular, Booking, Muhasebe) tohumlandı.");
  console.log("🚀 CRM Mock Veri Tohumlaması Başarıyla Tamamlandı!");
}

main()
  .catch((e) => {
    console.error("❌ Tohumlama sırasında hata oluştu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
