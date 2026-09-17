// components/portal/profile/ProfileOverview.tsx
"use client";

import { User, Phone, Mail, MapPin, GraduationCap, Globe, Shield, Calendar } from "lucide-react";
import type { CRMStudentProfile, CRMUser } from "@/types/crm";
import { ACADEMIC_LEVEL_LABELS } from "@/types/crm";
import { formatDate } from "@/lib/utils/date";

interface Props {
  user: CRMUser;
  profile: CRMStudentProfile | null;
  onEditClick: () => void;
}

export function ProfileOverview({ user, profile, onEditClick }: Props) {
  return (
    <div className="space-y-6">
      {/* Header bar with edit button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-bold text-white shadow-md">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{user.email} · {user.phone ?? "Telefon girilmedi"}</p>
            <span className="mt-2 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Kayıtlı Öğrenci
            </span>
          </div>
        </div>

        <button
          onClick={onEditClick}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <span>Bilgileri Düzenle / Talep Gönder</span>
        </button>
      </div>

      {/* Profile Details Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kimlik & Kişisel */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Shield className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Kimlik & Kişisel Bilgiler</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <InfoItem label="TC Kimlik No" value={profile?.nationalId} />
            <InfoItem label="Doğum Tarihi" value={profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "—"} />
            <InfoItem label="Doğum Yeri" value={profile?.placeOfBirth} />
            <InfoItem label="Uyruk" value={profile?.nationality ?? "T.C."} />
            <InfoItem label="Cinsiyet" value={profile?.gender === "MALE" ? "Erkek" : profile?.gender === "FEMALE" ? "Kadın" : profile?.gender} />
            <InfoItem label="Medeni Durum" value={profile?.maritalStatus === "SINGLE" ? "Bekar" : profile?.maritalStatus === "MARRIED" ? "Evli" : profile?.maritalStatus} />
            <InfoItem label="Anne Adı" value={profile?.motherName} />
            <InfoItem label="Baba Adı" value={profile?.fatherName} />
          </div>
        </div>

        {/* Pasaport & İletişim */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Globe className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Pasaport & İkamet</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <InfoItem label="Pasaport No" value={profile?.passportNumber} />
            <InfoItem label="Pasaport Ülkesi" value={profile?.passportCountry} />
            <InfoItem label="Geçerlilik Tarihi" value={profile?.passportExpiry ? formatDate(profile.passportExpiry) : "—"} />
            <InfoItem label="Şehir / İlçe" value={profile?.city ? `${profile.city} / ${profile.district ?? ""}` : "—"} />
            <div className="col-span-2">
              <InfoItem label="Açık Adres" value={profile?.addressLine1} />
            </div>
          </div>
        </div>

        {/* Eğitim Bilgileri */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Eğitim Bilgileri</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <InfoItem label="Üniversite" value={profile?.universityName} />
            </div>
            <InfoItem label="Bölüm" value={profile?.fieldOfStudy} />
            <InfoItem label="Öğrenim Seviyesi" value={profile?.academicLevel ? ACADEMIC_LEVEL_LABELS[profile.academicLevel] : "—"} />
            <InfoItem label="Üniversite Not Ortalaması (GPA)" value={profile?.universityGpa} />
            <InfoItem label="Lise Adı" value={profile?.highSchoolName} />
          </div>
        </div>

        {/* Acil Durum İletişim */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Phone className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Acil Durum İletişim Kişisi</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <InfoItem label="Adı Soyadı" value={profile?.emergencyContactName} />
            <InfoItem label="Yakınlık Derecesi" value={profile?.emergencyContactRelationship} />
            <div className="col-span-2">
              <InfoItem label="Acil İletişim Telefonu" value={profile?.emergencyContactPhone} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-semibold text-gray-800 text-sm">{value && value.trim() !== "" ? value : "—"}</p>
    </div>
  );
}
