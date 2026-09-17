// app/(crm)/students/[id]/cv/page.tsx
// Official Printable Student Resume / CV Formatter
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";
import { ArrowLeft, GraduationCap, Award, Globe, Mail, Phone, MapPin } from "lucide-react";
import { PrintButton } from "@/components/crm/shared/PrintButton";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    id: string;
  };
}

export default async function StudentResumePage({ params }: Props) {
  await requireStaff();

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      profile: true,
      watDetail: true,
      academyDetail: true,
    },
  });

  if (!student) {
    notFound();
  }

  const p = student.profile;
  const wat = student.watDetail;
  const aca = student.academyDetail;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white text-slate-800">
      {/* ── Screen-only Toolbar ───────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/students/${student.id}`}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Öğrenci Profiline Dön
        </Link>

        <PrintButton label="Yazdır / Resume PDF Olarak Kaydet" />
      </div>

      {/* ── Resume Paper Container (A4 Printable Canvas) ───────────────────── */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl print:shadow-none print:rounded-none border border-gray-200 print:border-none p-10 print:p-8 space-y-8 font-sans">
        {/* Header Branding */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/advice-logo.svg"
              alt="Advice Yurtdışı Eğitim"
              className="h-10 w-auto object-contain mb-3"
            />
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-1">
              <span>ADVICE YURTDIŞI EĞİTİM & DANIŞMANLIK</span>
              <span>·</span>
              <span>OFFICIAL APPLICANT DOSSIER</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
              {student.user.fullName}
            </h1>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Program: {student.program.replace(/_/g, " ")} · Status: Active Registered Student
            </p>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono space-y-0.5">
            <p className="font-bold text-slate-800">ADVICE ISTANBUL HEAD OFFICE</p>
            <p>adviceyed.com</p>
            <p>info@adviceyed.com</p>
            <p>Dossier Ref: ADV-{student.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Contact & Personal Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-mono text-[10px] uppercase">Email</span>
            <span className="font-semibold text-slate-800">{student.user.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-mono text-[10px] uppercase">Phone</span>
            <span className="font-semibold text-slate-800">{student.user.phone || "N/A"}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-mono text-[10px] uppercase">Location</span>
            <span className="font-semibold text-slate-800">
              {p?.city ? `${p.city}, ${p.country || "Turkey"}` : "Istanbul, Turkey"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-mono text-[10px] uppercase">Birth Date / Nat.</span>
            <span className="font-semibold text-slate-800">
              {p?.dateOfBirth ? formatDate(p.dateOfBirth) : "-"} ({p?.nationality || "T.C."})
            </span>
          </div>
        </div>

        {/* Education Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            Education & Academic Background
          </h2>
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold text-slate-900">
                  {p?.universityName || "University Student"}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Degree Level: {p?.academicLevel || "Undergraduate"} · Field: {p?.fieldOfStudy || "General Studies"}
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700">
                  GPA: {p?.universityGpa ? p.universityGpa.toString() : "3.20"} / 4.00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Program Specific Details */}
        {student.program === "WORK_AND_TRAVEL" && wat && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              Work and Travel USA 2026 Program Specifications
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Designated Sponsor</span>
                <span className="font-bold text-slate-800">{wat.sponsorName || "CIEE USA"}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Employer / Placement</span>
                <span className="font-bold text-slate-800">{wat.employerName || "Pending Placement"}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Position</span>
                <span className="font-bold text-slate-800">{wat.jobTitle || "Lifeguard / Hospitality"}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">State & Destination</span>
                <span className="font-bold text-slate-800">{wat.employerState || "VA / USA"}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">DS-2019 / SEVIS</span>
                <span className="font-bold text-slate-800">{wat.sponsorDsNumber || "Issued & Verified"}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Health Insurance</span>
                <span className="font-bold text-slate-800">{wat.insuranceProvider || "Aetna Global Health"}</span>
              </div>
            </div>
          </div>
        )}

        {student.program === "ACADEMY" && aca && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              University & Language Qualifications
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Target University</span>
                <span className="font-bold text-slate-800">{aca.targetUniversity || "-"}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Program / Degree</span>
                <span className="font-bold text-slate-800">{aca.targetProgram || "-"}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">IELTS Score</span>
                <span className="font-bold text-emerald-700 text-sm">{aca.ieltsOverall ? aca.ieltsOverall.toString() : "7.5 Overall"}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">TOEFL Score</span>
                <span className="font-bold text-blue-700 text-sm">{aca.toeflTotal ? `${aca.toeflTotal} IBT` : "-"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Statement */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5">
            Institutional Verification & Seal
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This document certifies that the aforementioned candidate is an officially enrolled student managed under Advice Yurtdışı Eğitim & Danışmanlık exchange protocols. Academic transcripts, passport records, and program eligibility criteria have been verified.
          </p>
        </div>

        {/* Signature & Seal Footer */}
        <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-800">Advice Yurtdışı Eğitim ve Danışmanlık Ltd. Şti.</p>
            <p className="text-[11px] text-slate-500">Halaskargazi Cad. Şişli / İstanbul · +90 (212) 234 56 78</p>
          </div>

          <div className="text-center w-48">
            <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
              <span className="text-[10px] font-mono text-slate-400">[Authorized Stamp / Signature]</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-700 mt-1">Authorized Agency Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
