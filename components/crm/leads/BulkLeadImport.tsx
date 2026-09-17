// components/crm/leads/BulkLeadImport.tsx
"use client";

import { useState, useTransition } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { bulkImportLeads, type BulkLeadRowInput, type BulkImportResult } from "@/actions/crm/leads";
import type { Program, LeadSource } from "@prisma/client";
import { PROGRAM_LABELS } from "@/types/crm";
import { ProgramBadge } from "@/components/crm/common/ProgramBadge";

function resolveProgramFromString(progStr?: string): Program {
  if (!progStr) return "WORK_AND_TRAVEL";
  const s = progStr.toLowerCase();
  if (s.includes("wat") || s.includes("work") || s.includes("travel")) return "WORK_AND_TRAVEL";
  if (s.includes("akademi") || s.includes("academy") || s.includes("master") || s.includes("lisans")) return "ACADEMY";
  if (s.includes("dil") || s.includes("language") || s.includes("okul")) return "LANGUAGE_SCHOOL";
  if (s.includes("yaz") || s.includes("summer") || s.includes("camp") || s.includes("kamp")) return "SUMMER_CAMP";
  if (s.includes("vize") || s.includes("visa")) return "VISA_CONSULTING";
  return "WORK_AND_TRAVEL";
}

function resolveSourceFromString(srcStr?: string): LeadSource {
  if (!srcStr) return "WALK_IN";
  const s = srcStr.toLowerCase();
  if (s.includes("web") || s.includes("site") || s.includes("google")) return "WEBSITE";
  if (s.includes("meta") || s.includes("insta") || s.includes("face") || s.includes("sosyal")) return "SOCIAL_MEDIA";
  if (s.includes("fuar") || s.includes("fair")) return "FAIR";
  if (s.includes("ref") || s.includes("tavsiye")) return "REFERRAL";
  if (s.includes("tel") || s.includes("phone") || s.includes("arama")) return "PHONE";
  return "WALK_IN";
}

export function BulkLeadImport() {
  const [parsedRows, setParsedRows] = useState<BulkLeadRowInput[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [parseError, setParseError] = useState<string>("");
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileUpload(file: File) {
    setParseError("");
    setImportResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || "";
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setParseError("Dosya en az bir başlık satırı ve bir veri satırı içermelidir.");
          return;
        }

        // Detect separator: comma or semicolon or tab
        const firstLine = lines[0];
        let sep = ",";
        if (firstLine.includes(";")) sep = ";";
        else if (firstLine.includes("\t")) sep = "\t";

        const headers = firstLine.split(sep).map((h) => h.trim().toLowerCase().replace(/"/g, ""));
        
        // Find column indices
        const nameIdx = headers.findIndex((h) => h.includes("ad") || h.includes("isim") || h.includes("name"));
        const emailIdx = headers.findIndex((h) => h.includes("mail") || h.includes("posta"));
        const phoneIdx = headers.findIndex((h) => h.includes("tel") || h.includes("phone") || h.includes("cep"));
        const programIdx = headers.findIndex((h) => h.includes("prog") || h.includes("alan"));
        const sourceIdx = headers.findIndex((h) => h.includes("kaynak") || h.includes("source"));
        const notesIdx = headers.findIndex((h) => h.includes("not") || h.includes("note") || h.includes("aciklama"));

        if (nameIdx === -1 || emailIdx === -1 || phoneIdx === -1) {
          setParseError("CSV dosyasında 'Ad Soyad', 'E-Posta' ve 'Telefon' sütunları bulunamadı. Lütfen örnek şablonu indirin.");
          return;
        }

        const rows: BulkLeadRowInput[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));
          if (cols.length < 3) continue;

          const fullName = cols[nameIdx];
          const email = cols[emailIdx];
          const phone = cols[phoneIdx];
          if (!fullName || !email || !phone) continue;

          rows.push({
            fullName,
            email,
            phone,
            program: programIdx !== -1 ? resolveProgramFromString(cols[programIdx]) : "WORK_AND_TRAVEL",
            source: sourceIdx !== -1 ? resolveSourceFromString(cols[sourceIdx]) : "WALK_IN",
            notes: notesIdx !== -1 ? cols[notesIdx] : undefined,
          });
        }

        if (rows.length === 0) {
          setParseError("Dosyadan geçerli satır okunamadı.");
          return;
        }

        setParsedRows(rows);
      } catch (err: any) {
        setParseError("Dosya okunurken hata oluştu: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  function downloadTemplate() {
    const csvContent =
      "Ad Soyad,E-Posta,Telefon,Program,Kaynak,Notlar\n" +
      "Mert Yılmaz,mert.yilmaz@example.com,05321112233,Work and Travel,Ofis Ziyareti,New York veya Boston düşünüyor\n" +
      "Ayşe Demir,ayse.demir@example.com,05423334455,Dil Okulu,Instagram,Malta veya Londra 12 hafta\n" +
      "Burak Şahin,burak.sahin@example.com,05556667788,Akademi,Tavsiye,İngiltere Yüksek Lisans başvurusu\n";

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "advice_ornek_lead_listesi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleImport() {
    if (parsedRows.length === 0) return;
    startTransition(async () => {
      const res = await bulkImportLeads(parsedRows);
      setImportResult(res);
      if (res.success && res.errors.length === 0) {
        setParsedRows([]);
        setFileName("");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Instructions & Template Download ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-blue-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-gray-900">Excel / CSV Toplu Aday Aktarımı</h4>
            <p className="text-xs text-gray-600">
              Fuar, seminer veya önceki dönemlerden kalan aday listelerini tek seferde CRM veritabanına aktarın.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-colors"
        >
          <Download className="h-4 w-4" />
          Örnek Şablonu İndir (.CSV)
        </button>
      </div>

      {/* ── Upload Box ─────────────────────────────────────────────────────── */}
      {parsedRows.length === 0 && (
        <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all">
          <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm font-semibold text-gray-700">
            CSV veya Excel dosyanızı buraya sürükleyin ya da tıklayın
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Desteklenen formatlar: .csv, .tsv (Virgül veya noktalı virgül ayrılmış)
          </p>
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }}
          />
        </label>
      )}

      {/* ── Parse Error ────────────────────────────────────────────────────── */}
      {parseError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{parseError}</span>
        </div>
      )}

      {/* ── Import Success Result ──────────────────────────────────────────── */}
      {importResult && (
        <div
          className={`rounded-2xl border p-5 ${
            importResult.success
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <div className="flex items-center gap-3">
            {importResult.success ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
            )}
            <div>
              <h5 className="text-sm font-bold">
                {importResult.success ? "Toplu Aktarım Başarıyla Tamamlandı" : "Aktarım Sırasında Hatalar Oluştu"}
              </h5>
              <p className="text-xs mt-0.5 opacity-90">
                Toplam: <strong>{importResult.total}</strong> | Yeni Eklenen: <strong>{importResult.imported}</strong> | Güncellenen: <strong>{importResult.updated}</strong> | Atlanan: <strong>{importResult.skipped}</strong>
              </p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mt-4 rounded-xl bg-white/80 p-3 text-xs text-gray-700 max-h-40 overflow-y-auto space-y-1">
              <p className="font-semibold text-red-700 mb-1">Uyarılar & Hatalar:</p>
              {importResult.errors.map((err, idx) => (
                <p key={idx} className="text-[11px] text-red-600 font-mono">
                  • {err}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Preview Table ──────────────────────────────────────────────────── */}
      {parsedRows.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-bold text-gray-800">
                Önizleme ({parsedRows.length} Aday Okundu)
              </span>
              <span className="text-xs text-gray-400">· {fileName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setFileName("");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    İçe Aktarılıyor…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {parsedRows.length} Adayı Sisteme Aktar
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 font-semibold text-gray-600">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Ad Soyad</th>
                    <th className="px-4 py-3">E-Posta</th>
                    <th className="px-4 py-3">Telefon</th>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Kaynak</th>
                    <th className="px-4 py-3">Not</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{r.fullName}</td>
                      <td className="px-4 py-2.5">{r.email}</td>
                      <td className="px-4 py-2.5 font-mono">{r.phone}</td>
                      <td className="px-4 py-2.5">
                        <ProgramBadge program={r.program} showIcon />
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{r.source}</td>
                      <td className="px-4 py-2.5 text-gray-400 truncate max-w-xs">{r.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
