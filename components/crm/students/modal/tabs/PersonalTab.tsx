// components/crm/students/modal/tabs/PersonalTab.tsx
"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import type { CRMStudentDetail } from "@/types/crm";
import { updateStudentProfile } from "@/actions/crm/students";
import { formatDate } from "@/lib/utils/date";

type SocialAccount = { platform: string; handle: string };
type TravelCompanion = { name: string; phone: string };

interface Props {
  student: CRMStudentDetail;
}

export function PersonalTab({ student }: Props) {
  const profile = student.profile;
  const [isPending, startTransition] = useTransition();
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [companions, setCompanions] = useState<TravelCompanion[]>([]);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      placeOfBirth: fd.get("placeOfBirth") as string,
      city: fd.get("city") as string,
      district: fd.get("district") as string,
      addressLine1: fd.get("addressLine1") as string,
      gender: fd.get("gender") as string,
      maritalStatus: fd.get("maritalStatus") as string,
      motherName: fd.get("motherName") as string,
      fatherName: fd.get("fatherName") as string,
    };
    startTransition(() => {
      updateStudentProfile(student.id, data);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* ── Kimlik Bilgileri ─────────────────────────────────────── */}
      <Section title="Kimlik Bilgileri">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ad Soyad" value={student.user.fullName} readOnly />
          <Field label="TC Kimlik No" value={profile?.nationalId} readOnly />
          <Field
            label="Doğum Tarihi"
            value={profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : undefined}
            readOnly
          />
          <FormField label="Doğum Yeri" name="placeOfBirth" defaultValue={profile?.placeOfBirth} />
          <FormSelect
            label="Cinsiyet"
            name="gender"
            defaultValue={profile?.gender ?? ""}
            options={[
              { value: "", label: "Seçiniz" },
              { value: "MALE", label: "Erkek" },
              { value: "FEMALE", label: "Kadın" },
              { value: "OTHER", label: "Diğer" },
            ]}
          />
          <FormSelect
            label="Medeni Durum"
            name="maritalStatus"
            defaultValue={profile?.maritalStatus ?? ""}
            options={[
              { value: "", label: "Seçiniz" },
              { value: "SINGLE", label: "Bekar" },
              { value: "MARRIED", label: "Evli" },
              { value: "DIVORCED", label: "Boşanmış" },
            ]}
          />
          <FormField label="Anne Adı" name="motherName" defaultValue={profile?.motherName ?? ""} />
          <FormField label="Baba Adı" name="fatherName" defaultValue={profile?.fatherName ?? ""} />
        </div>
      </Section>

      {/* ── İletişim & Adres ─────────────────────────────────────── */}
      <Section title="İletişim & Adres">
        <div className="grid grid-cols-2 gap-4">
          <Field label="E-Posta" value={student.user.email} readOnly />
          <Field label="Telefon" value={student.user.phone ?? "—"} readOnly />
          <FormField label="İlçe" name="district" defaultValue={profile?.district ?? ""} />
          <FormField label="Şehir" name="city" defaultValue={profile?.city ?? ""} />
          <div className="col-span-2">
            <FormField
              label="Adres"
              name="addressLine1"
              defaultValue={profile?.addressLine1 ?? ""}
            />
          </div>
        </div>
      </Section>

      {/* ── Sosyal Medya Hesapları ─────────────────────────────────── */}
      <Section
        title="Sosyal Medya Hesapları"
        action={
          <button
            type="button"
            onClick={() =>
              setSocialAccounts((prev) => [
                ...prev,
                { platform: "Instagram", handle: "" },
              ])
            }
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-3.5 w-3.5" /> Ekle
          </button>
        }
      >
        {socialAccounts.length === 0 && (
          <p className="text-xs text-gray-400">Henüz hesap eklenmemiş.</p>
        )}
        {socialAccounts.map((acc, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={acc.platform}
              onChange={(e) => {
                const next = [...socialAccounts];
                next[i].platform = e.target.value;
                setSocialAccounts(next);
              }}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            >
              {["Instagram", "Facebook", "LinkedIn", "Twitter", "TikTok"].map(
                (p) => <option key={p}>{p}</option>,
              )}
            </select>
            <input
              type="text"
              placeholder="@kullanici_adi"
              value={acc.handle}
              onChange={(e) => {
                const next = [...socialAccounts];
                next[i].handle = e.target.value;
                setSocialAccounts(next);
              }}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() =>
                setSocialAccounts((prev) => prev.filter((_, j) => j !== i))
              }
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </Section>

      {/* ── Seyahat Arkadaşları ─────────────────────────────────────── */}
      <Section
        title="Seyahat Arkadaşları"
        action={
          <button
            type="button"
            onClick={() =>
              setCompanions((prev) => [...prev, { name: "", phone: "" }])
            }
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-3.5 w-3.5" /> Arkadaş Ekle
          </button>
        }
      >
        {companions.length === 0 && (
          <p className="text-xs text-gray-400">Kayıtlı arkadaş yok.</p>
        )}
        {companions.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ad Soyad"
              value={c.name}
              onChange={(e) => {
                const next = [...companions];
                next[i].name = e.target.value;
                setCompanions(next);
              }}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Telefon"
              value={c.phone}
              onChange={(e) => {
                const next = [...companions];
                next[i].phone = e.target.value;
                setCompanions(next);
              }}
              className="w-40 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() =>
                setCompanions((prev) => prev.filter((_, j) => j !== i))
              }
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </Section>

      {/* ── Yaşam Tarzı Soruları ─────────────────────────────────────── */}
      <Section title="Yaşam Tarzı">
        <div className="flex flex-wrap gap-6">
          <CheckboxField label="Sigara Kullanıyor" name="isSmoker" />
          <CheckboxField label="Yüzme Biliyor" name="canSwim" />
          <CheckboxField label="Ehliyet Var" name="hasDrivingLicense" />
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  readOnly,
}: {
  label: string;
  value?: string | null;
  readOnly?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
        {value ?? "—"}
      </p>
    </div>
  );
}

function FormField({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
      />
    </div>
  );
}

function FormSelect({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
