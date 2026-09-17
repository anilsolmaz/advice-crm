// app/(crm)/students/[id]/makbuz/page.tsx
// Official Printable Payment Receipt / Tahsilat Makbuzu
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";
import { PROGRAM_LABELS } from "@/types/crm";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";
import { ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PrintButton } from "@/components/crm/shared/PrintButton";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    id: string;
  };
}

export default async function StudentReceiptPage({ params }: Props) {
  await requireStaff();

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      profile: true,
      payments: {
        include: {
          installments: {
            orderBy: { sequence: "asc" },
          },
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const payment = student.payments[0];
  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center max-w-md">
          <p className="text-base font-bold text-gray-900">Ödeme Kaydı Bulunamadı</p>
          <p className="text-xs text-gray-500 mt-1">Bu öğrenci için oluşturulmuş bir ödeme planı veya dekont yok.</p>
          <Link
            href={`/students/${student.id}`}
            className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Öğrenciye Dön
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = Number(payment.totalAmount);
  const paidAmount = payment.installments
    .filter((inst) => inst.isPaid)
    .reduce((sum, inst) => sum + Number(inst.amount), 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const receiptNo = `ADV-${new Date().getFullYear()}-${student.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white text-slate-800 font-sans">
      {/* ── Screen-only Toolbar ───────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/students/${student.id}`}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Öğrenci Profiline Dön
        </Link>

        <PrintButton label="Makbuzu Yazdır / PDF İndir" />
      </div>

      {/* ── Receipt Canvas (A4 Sheet) ────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl print:shadow-none print:rounded-none border border-gray-200 print:border-none p-10 print:p-8 space-y-6">
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
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
              RESMİ TAHSİLAT MAKBUZU
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              OFFICIAL PAYMENT RECEIPT & STATEMENT
            </p>
          </div>

          <div className="text-right text-xs font-mono text-slate-500 space-y-1">
            <p className="font-bold text-slate-900 text-sm">Makbuz No: {receiptNo}</p>
            <p>Tarih: {formatDate(new Date())}</p>
            <p>Düzenleyen: Advice Muhasebe</p>
          </div>
        </div>

        {/* Öğrenci ve Program Bilgileri */}
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 block font-mono text-[10px] uppercase">Öğrenci Adı Soyadı</span>
            <span className="font-bold text-slate-900 text-sm">{student.user.fullName}</span>
            <p className="text-slate-500 text-[11px]">{student.user.email} · {student.user.phone || "-"}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-mono text-[10px] uppercase">Kayıtlı Program</span>
            <div>
              <ProgramBadge program={student.program} showIcon size="sm" />
            </div>
            <p className="text-slate-500 text-[11px]">
              T.C. Kimlik: {student.profile?.nationalId || "Girilmedi"} · Pasaport: {student.profile?.passportNumber || "Girilmedi"}
            </p>
          </div>
        </div>

        {/* Özet Tablosu */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            Ödeme ve Taksit Dökümü ({payment.description})
          </h2>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Taksit</th>
                  <th className="px-4 py-2.5 font-bold">Vade Tarihi</th>
                  <th className="px-4 py-2.5 font-bold">Tutar</th>
                  <th className="px-4 py-2.5 font-bold">Ödeme Tarihi</th>
                  <th className="px-4 py-2.5 text-right font-bold">Tahsilat Durumu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payment.installments.map((inst) => (
                  <tr key={inst.id}>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">#{inst.sequence} Taksit</td>
                    <td className="px-4 py-2.5 text-slate-600">{formatDate(inst.dueDate)}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {inst.amount.toString()} {inst.currency}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {inst.paidAt ? formatDate(inst.paidAt) : "-"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {inst.isPaid ? (
                        <span className="text-emerald-700">✓ Tahsil Edildi</span>
                      ) : (
                        <span className="text-amber-600">Beklemede</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Toplam ve Bakiye Özeti */}
        <div className="flex justify-end pt-2">
          <div className="w-64 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Toplam Sözleşme:</span>
              <span className="font-bold text-slate-900">{totalAmount} {payment.currency}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span className="font-semibold">Toplam Tahsil Edilen:</span>
              <span className="font-bold">{paidAmount} {payment.currency}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Kalan Bakiye:</span>
              <span className={remainingAmount === 0 ? "text-emerald-600" : "text-blue-700"}>
                {remainingAmount === 0 ? "0 (Borç Yoktur)" : `${remainingAmount} ${payment.currency}`}
              </span>
            </div>
          </div>
        </div>

        {/* Hukuki Beyan */}
        <div className="text-[11px] text-slate-500 leading-relaxed pt-4 border-t border-slate-100">
          İşbu makbuz, Advice Yurtdışı Eğitim & Danışmanlık bünyesinde öğrencinin seçmiş olduğu eğitim ve danışmanlık hizmeti için yapılan ödemelerin resmi belgesidir. Sözleşme maddeleri ve program iade koşulları geçerlidir.
        </div>

        {/* Kaşe ve İmza */}
        <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs text-slate-600">
          <div className="text-center w-48">
            <div className="h-16 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
              <span className="text-[10px] font-mono text-slate-400">[Öğrenci İmzası]</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-700 mt-1">Öğrenci / Veli</p>
          </div>

          <div className="text-center w-52">
            <div className="h-16 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
              <span className="text-[10px] font-mono text-slate-400">[Yetkili Kaşe & İmza]</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-700 mt-1">Advice Yurtdışı Eğitim Ltd. Şti.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
