"use client";

import { useTransition } from "react";
import { Save, Briefcase, GraduationCap, Languages, Sun, Stamp } from "lucide-react";
import type { CRMWatDetail, CRMAcademyDetail, Program } from "@/types/crm";
import {
  updateWatDetail,
  updateAcademyDetail,
  updateLanguageDetail,
  updateSummerCampDetail,
  updateVisaDetail,
} from "@/actions/crm/students";

const WAT_SPONSORS = ["CIEE", "AWA", "AYUSA", "InterExchange", "Camp America", "BUNAC", "Diğer"] as const;
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"] as const;

interface Props {
  watDetail: CRMWatDetail | null;
  academyDetail?: CRMAcademyDetail | null;
  languageDetail?: any;
  summerCampDetail?: any;
  visaDetail?: any;
  studentId: string;
  program: Program;
}

export function JobPlacementTab({
  watDetail,
  academyDetail,
  languageDetail,
  summerCampDetail,
  visaDetail,
  studentId,
  program,
}: Props) {
  const [isPending, startTransition] = useTransition();

  // 1. WORK AND TRAVEL FORM
  if (program === "WORK_AND_TRAVEL") {
    function handleSaveWat(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      startTransition(() => {
        updateWatDetail(studentId, {
          sponsorName: fd.get("sponsorName") as string,
          sponsorDsNumber: fd.get("sponsorDsNumber") as string,
          sevisId: fd.get("sevisId") as string,
          jobTitle: fd.get("jobTitle") as string,
          employerName: fd.get("employerName") as string,
          employerState: fd.get("employerState") as string,
          insuranceProvider: fd.get("insuranceProvider") as string,
          insurancePolicyNo: fd.get("insurancePolicyNo") as string,
        });
      });
    }

    return (
      <form onSubmit={handleSaveWat} className="space-y-6">
        <Section title="Sponsor & DS-2019 Bilgileri">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sponsorName" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Sponsor Kuruluş</label>
              <select id="sponsorName" name="sponsorName" defaultValue={watDetail?.sponsorName ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                <option value="">Seçiniz</option>
                {WAT_SPONSORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <FormField label="DS-2019 Numara" name="sponsorDsNumber" defaultValue={watDetail?.sponsorDsNumber ?? ""} placeholder="Örn: DS-1234567" />
            <FormField label="SEVIS ID" name="sevisId" defaultValue={watDetail?.sevisId ?? ""} placeholder="N000000000" />
            <FormField label="İş Pozisyonu" name="jobTitle" defaultValue={watDetail?.jobTitle ?? ""} placeholder="Örn: Lifeguard / Server" />
          </div>
        </Section>

        <Section title="İşveren & Lokasyon">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="İşveren / Tesis Adı" name="employerName" defaultValue={watDetail?.employerName ?? ""} placeholder="Örn: Wilderness Resort" />
            <div>
              <label htmlFor="employerState" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">ABD Eyaleti</label>
              <select id="employerState" name="employerState" defaultValue={watDetail?.employerState ?? ""} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                <option value="">Seçiniz</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Sigorta Bilgileri">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Sigorta Şirketi" name="insuranceProvider" defaultValue={watDetail?.insuranceProvider ?? ""} placeholder="Örn: Aetna / Seven Corners" />
            <FormField label="Poliçe Numarası" name="insurancePolicyNo" defaultValue={watDetail?.insurancePolicyNo ?? ""} />
          </div>
        </Section>

        <SubmitButton isPending={isPending} />
      </form>
    );
  }

  // 2. ACADEMY FORM
  if (program === "ACADEMY") {
    function handleSaveAcademy(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      startTransition(() => {
        updateAcademyDetail(studentId, {
          targetCountry: fd.get("targetCountry") as string,
          targetUniversity: fd.get("targetUniversity") as string,
          targetProgram: fd.get("targetProgram") as string,
          applicationStatus: fd.get("applicationStatus") as string,
          notes: fd.get("notes") as string,
        });
      });
    }

    return (
      <form onSubmit={handleSaveAcademy} className="space-y-6">
        <Section title="Hedef Üniversite & Başvuru Tercihleri">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Hedef Ülke" name="targetCountry" defaultValue={academyDetail?.targetCountry ?? ""} placeholder="Örn: Almanya, İngiltere, Hollanda" />
            <FormField label="Hedef Üniversite" name="targetUniversity" defaultValue={academyDetail?.targetUniversity ?? ""} placeholder="Örn: TU Munich / King's College" />
            <FormField label="Hedef Bölüm / Program" name="targetProgram" defaultValue={academyDetail?.targetProgram ?? ""} placeholder="Örn: Computer Science MSc" />
            <div>
              <label htmlFor="applicationStatus" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Başvuru Durumu</label>
              <select id="applicationStatus" name="applicationStatus" defaultValue={academyDetail?.applicationStatus ?? "Hazırlanıyor"} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                <option value="Hazırlanıyor">Hazırlanıyor</option>
                <option value="Gönderildi">Gönderildi</option>
                <option value="Şartlı Kabul">Şartlı Kabul (Conditional Offer)</option>
                <option value="Şartsız Kabul">Şartsız Kabul (Unconditional Offer)</option>
                <option value="Red">Red</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Akademik Notlar & Takip">
          <div className="space-y-3">
            <div>
              <label htmlFor="notes" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Başvuru & Mülakat Notları</label>
              <textarea id="notes" name="notes" rows={3} defaultValue={academyDetail?.notes ?? ""} placeholder="Uni-Assist başvuru numarası, niyet mektubu revizyonları vb." className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-blue-400 focus:outline-none" />
            </div>
          </div>
        </Section>

        <SubmitButton isPending={isPending} />
      </form>
    );
  }

  // 3. LANGUAGE SCHOOL FORM
  if (program === "LANGUAGE_SCHOOL") {
    function handleSaveLanguage(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      startTransition(() => {
        updateLanguageDetail(studentId, {
          targetCountry: fd.get("targetCountry") as string,
          targetCity: fd.get("targetCity") as string,
          schoolName: fd.get("schoolName") as string,
          courseType: fd.get("courseType") as string,
          accommodationType: fd.get("accommodationType") as string,
          currentLanguageLevel: fd.get("currentLanguageLevel") as string,
        });
      });
    }

    return (
      <form onSubmit={handleSaveLanguage} className="space-y-6">
        <Section title="Okul & Kurs Tercihleri">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Hedef Ülke" name="targetCountry" defaultValue={languageDetail?.targetCountry ?? ""} placeholder="Örn: Malta, İrlanda, İngiltere" />
            <FormField label="Şehir / Kampüs" name="targetCity" defaultValue={languageDetail?.targetCity ?? ""} placeholder="Örn: Dublin, Londra, St. Julians" />
            <FormField label="Okul Adı" name="schoolName" defaultValue={languageDetail?.schoolName ?? ""} placeholder="Örn: EC English / Kaplan" />
            <div>
              <label htmlFor="courseType" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Kurs Türü</label>
              <select id="courseType" name="courseType" defaultValue={languageDetail?.courseType ?? "Genel İngilizce (20 Ders)"} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                <option value="Genel İngilizce (20 Ders)">Genel İngilizce (20 Ders)</option>
                <option value="Yoğun İngilizce (30 Ders)">Yoğun İngilizce (30 Ders)</option>
                <option value="İş İngilizcesi">İş İngilizcesi</option>
                <option value="IELTS / Sınav Hazırlık">IELTS / Sınav Hazırlık</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Konaklama & Seviye">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="accommodationType" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Konaklama Tipi</label>
              <select id="accommodationType" name="accommodationType" defaultValue={languageDetail?.accommodationType ?? "Aile Yanı (Homestay)"} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                <option value="Aile Yanı (Homestay)">Aile Yanı (Homestay)</option>
                <option value="Öğrenci Yurdu (Residence)">Öğrenci Yurdu (Residence)</option>
                <option value="Paylaşımlı Daire">Paylaşımlı Daire</option>
                <option value="Konaklama İstemiyor">Konaklama İstemiyor</option>
              </select>
            </div>
            <FormField label="Mevcut Dil Seviyesi" name="currentLanguageLevel" defaultValue={languageDetail?.currentLanguageLevel ?? ""} placeholder="Örn: B1 Intermediate" />
          </div>
        </Section>

        <SubmitButton isPending={isPending} />
      </form>
    );
  }

  // 4. SUMMER CAMP FORM
  if (program === "SUMMER_CAMP") {
    function handleSaveCamp(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      startTransition(() => {
        updateSummerCampDetail(studentId, {
          targetCountry: fd.get("targetCountry") as string,
          campName: fd.get("campName") as string,
          campProvider: fd.get("campProvider") as string,
          ageGroup: fd.get("ageGroup") as string,
          guardianName: fd.get("guardianName") as string,
          guardianPhone: fd.get("guardianPhone") as string,
          notes: fd.get("notes") as string,
        });
      });
    }

    return (
      <form onSubmit={handleSaveCamp} className="space-y-6">
        <Section title="Yaz Okulu & Kampüs Bilgileri">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Hedef Ülke" name="targetCountry" defaultValue={summerCampDetail?.targetCountry ?? ""} placeholder="Örn: İngiltere, İrlanda, İsviçre" />
            <FormField label="Kamp / Organizasyon" name="campName" defaultValue={summerCampDetail?.campName ?? ""} placeholder="Örn: London Uxbridge Summer Camp" />
            <FormField label="Tedarikçi / Partner" name="campProvider" defaultValue={summerCampDetail?.campProvider ?? ""} placeholder="Örn: Kings / Bayswater / Samiad" />
            <FormField label="Yaş Grubu" name="ageGroup" defaultValue={summerCampDetail?.ageGroup ?? ""} placeholder="Örn: 10-14 Yaş Junior" />
          </div>
        </Section>

        <Section title="Veli & Muvafakatname Bilgileri">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Yetkili Veli Ad Soyad" name="guardianName" defaultValue={summerCampDetail?.guardianName ?? ""} />
            <FormField label="Veli Telefonu" name="guardianPhone" defaultValue={summerCampDetail?.guardianPhone ?? ""} />
          </div>
        </Section>

        <Section title="Sağlık, Alerji & Özel İstekler">
          <div>
            <textarea name="notes" rows={3} defaultValue={summerCampDetail?.notes ?? ""} placeholder="Kronik rahatsızlık, gıda alerjisi, oda arkadaşı tercihi vb." className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
        </Section>

        <SubmitButton isPending={isPending} />
      </form>
    );
  }

  // 5. VISA CONSULTING FORM
  if (program === "VISA_CONSULTING") {
    function handleSaveVisa(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      startTransition(() => {
        updateVisaDetail(studentId, {
          destinationCountry: (fd.get("destinationCountry") as string) || "Almanya",
          visaType: (fd.get("visaType") as any) || "TOURIST",
          targetConsulate: fd.get("targetConsulate") as string,
          notes: fd.get("notes") as string,
        });
      });
    }

    return (
      <form onSubmit={handleSaveVisa} className="space-y-6">
        <Section title="Hedef Vize & Başvuru Merkezi">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Hedef Ülke" name="destinationCountry" defaultValue={visaDetail?.destinationCountry ?? ""} placeholder="Örn: Almanya, İtalya, İngiltere, ABD" />
            <div>
              <label htmlFor="visaType" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Vize Kategorisi</label>
              <select id="visaType" name="visaType" defaultValue={visaDetail?.visaType ?? "TOURIST"} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                <option value="TOURIST">Turistik Vize</option>
                <option value="STUDENT">Öğrenci Vizesi</option>
                <option value="WORK">Ticari / Çalışma Vizesi</option>
                <option value="TRANSIT">Transit Vize</option>
              </select>
            </div>
            <FormField label="Başvuru Merkezi / Konsolosluk" name="targetConsulate" defaultValue={visaDetail?.targetConsulate ?? ""} placeholder="Örn: VFS Global / İstanbul" />
          </div>
        </Section>

        <Section title="Vize Danışmanı Notları & Randevu Takibi">
          <div>
            <textarea name="notes" rows={3} defaultValue={visaDetail?.notes ?? ""} placeholder="Randevu slotu takibi, sponsor mektubu incelemesi vb." className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
        </Section>

        <SubmitButton isPending={isPending} />
      </form>
    );
  }

  return null;
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <button type="submit" disabled={isPending} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
        <Save className="h-4 w-4" />
        {isPending ? "Kaydediliyor…" : "Kaydet & Güncelle"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormField({ label, name, defaultValue, type = "text", step, placeholder }: { label: string; name: string; defaultValue?: string; type?: string; step?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} step={step} placeholder={placeholder} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200" />
    </div>
  );
}
