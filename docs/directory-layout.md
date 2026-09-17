# Advice Yurtdışı Eğitim CRM — Next.js App Router Directory Layout

> **Architecture Principle:** Two isolated route groups share zero layouts, middleware, or auth contexts.
> `(crm)` = Staff / Advisor Portal · `(portal)` = Student Self-Service Portal

```
advice-crm/
├── app/
│   │
│   ├── (crm)/                          # ── STAFF / ADVISOR PORTAL ──────────────────────
│   │   ├── layout.tsx                  # CRM shell: sidebar nav, advisor header, auth guard
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Genel bakış, KPI cards, upcoming tasks
│   │   │
│   │   ├── leads/
│   │   │   ├── page.tsx                # Lead listesi (filterable table)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx            # Lead detay + program seçimi + Convert to Student
│   │   │   └── new/
│   │   │       └── page.tsx            # Yeni lead formu
│   │   │
│   │   ├── students/
│   │   │   ├── page.tsx                # Öğrenci listesi (by program, status)
│   │   │   └── [id]/
│   │   │       ├── layout.tsx          # Student detail shell (tab nav)
│   │   │       ├── profile/
│   │   │       │   └── page.tsx        # Kişisel bilgiler + TC Kimlik + pasaport
│   │   │       ├── program/
│   │   │       │   └── page.tsx        # Program-specific detail (WAT / Akademi / etc.)
│   │   │       ├── documents/
│   │   │       │   └── page.tsx        # Belge listesi + verification actions
│   │   │       ├── payments/
│   │   │       │   └── page.tsx        # Ödeme planı + taksit takibi
│   │   │       ├── approvals/
│   │   │       │   └── page.tsx        # Pending approval diffs — Approve / Revize İste
│   │   │       └── notes/
│   │   │           └── page.tsx        # Advisor notları (append-only log)
│   │   │
│   │   ├── approvals/
│   │   │   └── page.tsx                # Global pending approvals queue
│   │   │
│   │   ├── programs/
│   │   │   ├── wat/
│   │   │   │   └── page.tsx            # Work & Travel toplu görünüm
│   │   │   ├── academy/
│   │   │   │   └── page.tsx            # Akademi toplu görünüm
│   │   │   ├── language/
│   │   │   │   └── page.tsx            # Dil Okulları toplu görünüm
│   │   │   ├── summer-camp/
│   │   │   │   └── page.tsx            # Yaz Okulu toplu görünüm
│   │   │   └── visa/
│   │   │       └── page.tsx            # Vize Danışmanlığı toplu görünüm
│   │   │
│   │   └── settings/
│   │       ├── page.tsx                # Sistem ayarları (admin-only)
│   │       ├── users/
│   │       │   └── page.tsx            # Kullanıcı yönetimi (ADMIN only)
│   │       └── profile/
│   │           └── page.tsx            # Danışman profil ayarları
│   │
│   ├── (portal)/                       # ── STUDENT SELF-SERVICE PORTAL ─────────────────
│   │   ├── layout.tsx                  # Portal shell: student topbar, auth guard (STUDENT only)
│   │   │
│   │   ├── anasayfa/
│   │   │   └── page.tsx                # Öğrenci gösterge paneli + program adımları
│   │   │
│   │   ├── profilim/
│   │   │   ├── page.tsx                # Kişisel bilgilerim (read-only diff view)
│   │   │   └── duzenle/
│   │   │       └── page.tsx            # Düzenleme formu → PendingApproval INSERT
│   │   │
│   │   ├── belgelerim/
│   │   │   ├── page.tsx                # Belgelerim listesi + verification durumu
│   │   │   └── yukle/
│   │   │       └── page.tsx            # Belge yükleme → PendingApproval INSERT
│   │   │
│   │   ├── odemelerim/
│   │   │   └── page.tsx                # Ödeme takvimim + taksit durumları (read-only)
│   │   │
│   │   ├── programim/
│   │   │   └── page.tsx                # Program detaylarım (read-only, program-specific)
│   │   │
│   │   └── bildirimler/
│   │       └── page.tsx                # Onay/red bildirimleri + danışman mesajları
│   │
│   ├── auth/                           # ── AUTH PAGES (public) ─────────────────────────
│   │   ├── giris/
│   │   │   └── page.tsx                # Giriş Yap (email + password)
│   │   ├── sifre-sifirla/
│   │   │   └── page.tsx                # Şifre Sıfırla
│   │   └── callback/
│   │       └── route.ts                # Supabase OAuth / magic-link callback
│   │
│   ├── api/
│   │   └── webhooks/
│   │       └── supabase/
│   │           └── route.ts            # Supabase Auth webhook handler
│   │
│   ├── layout.tsx                      # Root layout: providers, fonts, globals.css
│   ├── not-found.tsx
│   └── error.tsx
│
├── components/
│   ├── ui/                             # shadcn/ui primitives (Button, Card, Dialog, …)
│   ├── crm/                            # CRM-specific composed components
│   │   ├── ApprovalDiffViewer.tsx      # Side-by-side old vs new data diff
│   │   ├── LeadStatusBadge.tsx
│   │   ├── ProgramBadge.tsx
│   │   ├── PaymentTimeline.tsx
│   │   └── StudentProgramTabs.tsx
│   └── portal/                         # Portal-specific components
│       ├── ProfileReadOnlyCard.tsx
│       ├── DocumentUploadForm.tsx
│       ├── InstallmentStatusRow.tsx
│       └── ProgramStepperWizard.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # createBrowserClient (Supabase JS v2)
│   │   ├── server.ts                   # createServerClient (RSC / Server Actions)
│   │   └── admin.ts                    # createAdminClient (service_role — server-only)
│   ├── prisma.ts                       # PrismaClient singleton
│   ├── auth/
│   │   ├── session.ts                  # getSession(), requireRole() guards
│   │   └── roles.ts                    # Role constants + type guards
│   └── utils/
│       ├── currency.ts                 # formatCurrency(amount, currency, locale='tr-TR')
│       ├── date.ts                     # formatDate(date, locale='tr-TR')
│       └── diff.ts                     # diffJson(oldData, newData) → PendingApproval helper
│
├── middleware.ts                        # Edge middleware: route protection + role-based redirects
│                                        #  /(crm)/*   → require ADMIN | ADVISOR
│                                        #  /(portal)/* → require STUDENT
│                                        #  /           → redirect by role
│
├── prisma/
│   ├── schema.prisma                   # ← Step 1
│   └── seed.ts                         # Dev seed: admin, demo advisor, sample students
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 00001_rls_policies.sql      # ← Step 1
│
├── types/
│   ├── database.ts                     # Re-exports from @prisma/client
│   ├── approval.ts                     # ApprovalDiff<T> generic type
│   └── supabase.ts                     # Generated: supabase gen types typescript
│
├── hooks/
│   ├── useSupabaseSession.ts           # Client-side auth state
│   └── useApprovalQueue.ts             # Realtime pending approvals subscription
│
├── .env.local
│                                       # NEXT_PUBLIC_SUPABASE_URL
│                                       # NEXT_PUBLIC_SUPABASE_ANON_KEY
│                                       # DATABASE_URL  (Prisma — pooled)
│                                       # DIRECT_URL    (Prisma — direct)
│                                       # SUPABASE_SERVICE_ROLE_KEY (server-only)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Route Group Isolation

| Concern | `(crm)` | `(portal)` |
|---|---|---|
| Allowed roles | `ADMIN`, `ADVISOR` | `STUDENT` only |
| Layout | Sidebar + advisor header | Topbar + student identity bar |
| Data writes | Directly to live tables via Prisma | Only via `pending_approvals` INSERT |
| RLS context | `is_advisor()` / `is_admin()` | `is_student()` + `my_student_id()` |

## Middleware Role Routing

```
/               → ADMIN/ADVISOR → /dashboard   |   STUDENT → /anasayfa   |   unauth → /auth/giris
/(crm)/*        → requireRole(['ADMIN', 'ADVISOR'])
/(portal)/*     → requireRole(['STUDENT'])
/auth/*         → public
/api/webhooks/* → public (verify Supabase signature separately)
```

## Approval Workflow Data Flow

```
Student (portal)
  └─ INSERT pending_approvals { newData, status: PENDING }
          │
          ▼
Advisor (crm)
  ├─ SELECT pending_approvals WHERE status = PENDING
  ├─ Render ApprovalDiffViewer (oldData ↔ newData)
  ├─ [Onayla]      → UPDATE live table  +  SET status = APPROVED
  └─ [Revize İste] → SET status = REVISION_REQUESTED + rejectionReason
          │
          ▼
Student (portal)
  └─ Sees notification in /bildirimler with status + rejectionReason
```

## Multi-Currency Note

All monetary values are stored as `Decimal(12,2)` in the source currency.
`lib/utils/currency.ts` wraps `Intl.NumberFormat` with `locale='tr-TR'`
(e.g., `1.500,00 ₺`, `$2.500,00`, `€1.200,00`).
