-- ============================================================
-- Migration: 00001_rls_policies.sql
-- Advice Yurtdışı Eğitim CRM — Row Level Security
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. HELPER FUNCTIONS  (SECURITY DEFINER — run as table owner)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_my_role() = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION public.is_advisor()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_my_role() IN ('ADMIN', 'ADVISOR');
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_my_role() = 'STUDENT';
$$;

CREATE OR REPLACE FUNCTION public.my_student_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.advisor_owns_student(p_student_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE id = p_student_id AND advisor_id = auth.uid()
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 1. ENABLE RLS ON ALL TABLES
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wat_details          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_details      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_details     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summer_camp_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_details         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_approvals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_notes        ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 2. USERS
-- ────────────────────────────────────────────────────────────

CREATE POLICY "users: admin full access"
  ON public.users FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "users: advisor read all"
  ON public.users FOR SELECT TO authenticated
  USING (public.is_advisor());

CREATE POLICY "users: advisor update own"
  ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid() AND public.is_advisor())
  WITH CHECK (id = auth.uid() AND public.is_advisor());

CREATE POLICY "users: student read own"
  ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() AND public.is_student());

CREATE POLICY "users: student update own"
  ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid() AND public.is_student())
  WITH CHECK (id = auth.uid() AND public.is_student());

-- ────────────────────────────────────────────────────────────
-- 3. ADVISOR PROFILES
-- ────────────────────────────────────────────────────────────

CREATE POLICY "advisor_profiles: admin full access"
  ON public.advisor_profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "advisor_profiles: advisor read own"
  ON public.advisor_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_advisor());

CREATE POLICY "advisor_profiles: advisor update own"
  ON public.advisor_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_advisor())
  WITH CHECK (user_id = auth.uid() AND public.is_advisor());

-- ────────────────────────────────────────────────────────────
-- 4. LEADS
-- ────────────────────────────────────────────────────────────

CREATE POLICY "leads: admin full access"
  ON public.leads FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "leads: advisor reads assigned"
  ON public.leads FOR SELECT TO authenticated
  USING (advisor_id = auth.uid() AND public.is_advisor());

CREATE POLICY "leads: advisor inserts"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (public.is_advisor());

CREATE POLICY "leads: advisor updates assigned"
  ON public.leads FOR UPDATE TO authenticated
  USING (advisor_id = auth.uid() AND public.is_advisor())
  WITH CHECK (advisor_id = auth.uid() AND public.is_advisor());

-- ────────────────────────────────────────────────────────────
-- 5. STUDENTS
-- ────────────────────────────────────────────────────────────

CREATE POLICY "students: admin full access"
  ON public.students FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "students: advisor reads assigned"
  ON public.students FOR SELECT TO authenticated
  USING (advisor_id = auth.uid() AND public.is_advisor());

CREATE POLICY "students: advisor updates assigned"
  ON public.students FOR UPDATE TO authenticated
  USING (advisor_id = auth.uid() AND public.is_advisor())
  WITH CHECK (advisor_id = auth.uid() AND public.is_advisor());

CREATE POLICY "students: student reads own"
  ON public.students FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_student());

-- ────────────────────────────────────────────────────────────
-- 6. STUDENT PROFILES
-- ────────────────────────────────────────────────────────────

CREATE POLICY "student_profiles: admin full access"
  ON public.student_profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "student_profiles: advisor rw assigned"
  ON public.student_profiles FOR ALL TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id))
  WITH CHECK (public.is_advisor() AND public.advisor_owns_student(student_id));

-- Students: SELECT only — no direct INSERT/UPDATE (goes via pending_approvals)
CREATE POLICY "student_profiles: student reads own"
  ON public.student_profiles FOR SELECT TO authenticated
  USING (student_id = public.my_student_id() AND public.is_student());

-- ────────────────────────────────────────────────────────────
-- 7. PROGRAM DETAIL TABLES (same pattern for all five)
-- ────────────────────────────────────────────────────────────

-- WAT DETAILS
CREATE POLICY "wat_details: admin full access"
  ON public.wat_details FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "wat_details: advisor rw assigned"
  ON public.wat_details FOR ALL TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id))
  WITH CHECK (public.is_advisor() AND public.advisor_owns_student(student_id));
CREATE POLICY "wat_details: student reads own"
  ON public.wat_details FOR SELECT TO authenticated
  USING (student_id = public.my_student_id() AND public.is_student());

-- ACADEMY DETAILS
CREATE POLICY "academy_details: admin full access"
  ON public.academy_details FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "academy_details: advisor rw assigned"
  ON public.academy_details FOR ALL TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id))
  WITH CHECK (public.is_advisor() AND public.advisor_owns_student(student_id));
CREATE POLICY "academy_details: student reads own"
  ON public.academy_details FOR SELECT TO authenticated
  USING (student_id = public.my_student_id() AND public.is_student());

-- LANGUAGE DETAILS
CREATE POLICY "language_details: admin full access"
  ON public.language_details FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "language_details: advisor rw assigned"
  ON public.language_details FOR ALL TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id))
  WITH CHECK (public.is_advisor() AND public.advisor_owns_student(student_id));
CREATE POLICY "language_details: student reads own"
  ON public.language_details FOR SELECT TO authenticated
  USING (student_id = public.my_student_id() AND public.is_student());

-- SUMMER CAMP DETAILS
CREATE POLICY "summer_camp_details: admin full access"
  ON public.summer_camp_details FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "summer_camp_details: advisor rw assigned"
  ON public.summer_camp_details FOR ALL TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id))
  WITH CHECK (public.is_advisor() AND public.advisor_owns_student(student_id));
CREATE POLICY "summer_camp_details: student reads own"
  ON public.summer_camp_details FOR SELECT TO authenticated
  USING (student_id = public.my_student_id() AND public.is_student());

-- VISA DETAILS
CREATE POLICY "visa_details: admin full access"
  ON public.visa_details FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "visa_details: advisor rw assigned"
  ON public.visa_details FOR ALL TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id))
  WITH CHECK (public.is_advisor() AND public.advisor_owns_student(student_id));
CREATE POLICY "visa_details: student reads own"
  ON public.visa_details FOR SELECT TO authenticated
  USING (student_id = public.my_student_id() AND public.is_student());

-- ────────────────────────────────────────────────────────────
-- 8. PENDING APPROVALS
-- ────────────────────────────────────────────────────────────

CREATE POLICY "pending_approvals: admin full access"
  ON public.pending_approvals FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "pending_approvals: advisor reads assigned"
  ON public.pending_approvals FOR SELECT TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id));

CREATE POLICY "pending_approvals: advisor updates assigned"
  ON public.pending_approvals FOR UPDATE TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id))
  WITH CHECK (public.is_advisor() AND public.advisor_owns_student(student_id));

-- Students: INSERT new requests + SELECT own (no UPDATE/DELETE)
CREATE POLICY "pending_approvals: student inserts own"
  ON public.pending_approvals FOR INSERT TO authenticated
  WITH CHECK (student_id = public.my_student_id() AND public.is_student());

CREATE POLICY "pending_approvals: student reads own"
  ON public.pending_approvals FOR SELECT TO authenticated
  USING (student_id = public.my_student_id() AND public.is_student());

-- ────────────────────────────────────────────────────────────
-- 9. DOCUMENTS
-- ────────────────────────────────────────────────────────────

CREATE POLICY "documents: admin full access"
  ON public.documents FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "documents: advisor rw assigned"
  ON public.documents FOR ALL TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id))
  WITH CHECK (public.is_advisor() AND public.advisor_owns_student(student_id));

CREATE POLICY "documents: student reads own"
  ON public.documents FOR SELECT TO authenticated
  USING (student_id = public.my_student_id() AND public.is_student());

-- uploaded_by_student must be TRUE to prevent spoofing advisor-uploaded docs
CREATE POLICY "documents: student inserts own"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (
    student_id = public.my_student_id()
    AND public.is_student()
    AND uploaded_by_student = TRUE
  );

-- ────────────────────────────────────────────────────────────
-- 10. PAYMENTS
-- ────────────────────────────────────────────────────────────

CREATE POLICY "payments: admin full access"
  ON public.payments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "payments: advisor rw assigned"
  ON public.payments FOR ALL TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id))
  WITH CHECK (public.is_advisor() AND public.advisor_owns_student(student_id));

CREATE POLICY "payments: student reads own"
  ON public.payments FOR SELECT TO authenticated
  USING (student_id = public.my_student_id() AND public.is_student());

-- ────────────────────────────────────────────────────────────
-- 11. INSTALLMENTS
-- ────────────────────────────────────────────────────────────

CREATE POLICY "installments: admin full access"
  ON public.installments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "installments: advisor rw assigned"
  ON public.installments FOR ALL TO authenticated
  USING (
    public.is_advisor() AND EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = installments.payment_id
        AND public.advisor_owns_student(p.student_id)
    )
  )
  WITH CHECK (
    public.is_advisor() AND EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = installments.payment_id
        AND public.advisor_owns_student(p.student_id)
    )
  );

CREATE POLICY "installments: student reads own"
  ON public.installments FOR SELECT TO authenticated
  USING (
    public.is_student() AND EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = installments.payment_id
        AND p.student_id = public.my_student_id()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 12. ADVISOR NOTES  (immutable — no UPDATE/DELETE policies)
-- ────────────────────────────────────────────────────────────

CREATE POLICY "advisor_notes: admin full access"
  ON public.advisor_notes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "advisor_notes: advisor reads assigned"
  ON public.advisor_notes FOR SELECT TO authenticated
  USING (public.is_advisor() AND public.advisor_owns_student(student_id));

CREATE POLICY "advisor_notes: advisor inserts assigned"
  ON public.advisor_notes FOR INSERT TO authenticated
  WITH CHECK (
    public.is_advisor()
    AND public.advisor_owns_student(student_id)
    AND author_id = auth.uid()
  );

-- Students have NO access to advisor notes (internal only)

-- ────────────────────────────────────────────────────────────
-- 13. STORAGE BUCKET POLICIES
--     Bucket: student-documents
--     Path convention: {student_id}/{document_type}/{filename}
-- ────────────────────────────────────────────────────────────

CREATE POLICY "storage: admin full access"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'student-documents' AND public.is_admin())
  WITH CHECK (bucket_id = 'student-documents' AND public.is_admin());

CREATE POLICY "storage: advisor read assigned"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND public.is_advisor()
    AND public.advisor_owns_student(((storage.foldername(name))[1])::UUID)
  );

CREATE POLICY "storage: student upload own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents'
    AND public.is_student()
    AND (storage.foldername(name))[1] = public.my_student_id()::TEXT
  );

CREATE POLICY "storage: student read own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND public.is_student()
    AND (storage.foldername(name))[1] = public.my_student_id()::TEXT
  );
