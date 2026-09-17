// components/portal/profile/ProfileEditModal.tsx
"use client";

import { useState, useTransition } from "react";
import { X, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { CRMStudentProfile } from "@/types/crm";
import { submitProfileChangeForApproval } from "@/actions/portal/approvals";

interface Props {
  studentId: string;
  profile: CRMStudentProfile | null;
  onClose: () => void;
}

export function ProfileEditModal({ studentId, profile, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const fd = new FormData(e.currentTarget);
    
    // Construct new data object
    const newData: Record<string, unknown> = {
      addressLine1: (fd.get("addressLine1") as string) || null,
      city: (fd.get("city") as string) || null,
      district: (fd.get("district") as string) || null,
      emergencyContactName: (fd.get("emergencyContactName") as string) || null,
      emergencyContactRelationship: (fd.get("emergencyContactRelationship") as string) || null,
      emergencyContactPhone: (fd.get("emergencyContactPhone") as string) || null,
      passportNumber: (fd.get("passportNumber") as string) || null,
      passportCountry: (fd.get("passportCountry") as string) || null,
      universityName: (fd.get("universityName") as string) || null,
      universityGpa: (fd.get("universityGpa") as string) || null,
      fieldOfStudy: (fd.get("fieldOfStudy") as string) || null,
    };

    // Old data snapshot
    const oldData: Record<string, unknown> = {
      addressLine1: profile?.addressLine1 ?? null,
      city: profile?.city ?? null,
      district: profile?.district ?? null,
      emergencyContactName: profile?.emergencyContactName ?? null,
      emergencyContactRelationship: profile?.emergencyContactRelationship ?? null,
      emergencyContactPhone: profile?.emergencyContactPhone ?? null,
      passportNumber: profile?.passportNumber ?? null,
      passportCountry: profile?.passportCountry ?? null,
      universityName: profile?.universityName ?? null,
      universityGpa: profile?.universityGpa ?? null,
      fieldOfStudy: profile?.fieldOfStudy ?? null,
    };

    startTransition(async () => {
      const res = await submitProfileChangeForApproval(
        studentId,
        "STUDENT_PROFILE",
        oldData,
        newData
      );

      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Değişiklik talebiniz danışmanınızın onayına başarıyla iletildi!");
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Profil Bilgilerini Güncelle</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Değişiklikleriniz danışman kontrolünden sonra sisteme yansıtılacaktır.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security / Approval Warning Banner */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-start gap-3 text-amber-800 text-xs">
          <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>Önemli Bilgilendirme:</strong> Yaptığınız değişiklikler danışmanınızın onayına gönderilecektir. Onaylanana kadar geçerli bilgileriniz aktif kalır.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Pasaport & İkamet */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Pasaport & Adres
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup
                  label="Pasaport Numarası"
                  name="passportNumber"
                  defaultValue={profile?.passportNumber ?? ""}
                  placeholder="U12345678"
                />
                <InputGroup
                  label="Pasaport Veren Ülke"
                  name="passportCountry"
                  defaultValue={profile?.passportCountry ?? "Türkiye"}
                />
                <InputGroup
                  label="Şehir"
                  name="city"
                  defaultValue={profile?.city ?? ""}
                />
                <InputGroup
                  label="İlçe"
                  name="district"
                  defaultValue={profile?.district ?? ""}
                />
                <div className="sm:col-span-2">
                  <InputGroup
                    label="Açık Adres"
                    name="addressLine1"
                    defaultValue={profile?.addressLine1 ?? ""}
                    placeholder="Mahalle, Cadde, Sokak, No, Daire"
                  />
                </div>
              </div>
            </div>

            {/* Üniversite & Eğitim */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Eğitim Bilgileri
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup
                  label="Üniversite Adı"
                  name="universityName"
                  defaultValue={profile?.universityName ?? ""}
                />
                <InputGroup
                  label="Bölüm"
                  name="fieldOfStudy"
                  defaultValue={profile?.fieldOfStudy ?? ""}
                />
                <InputGroup
                  label="Üniversite GPA (Not Ortalaması)"
                  name="universityGpa"
                  defaultValue={profile?.universityGpa ?? ""}
                  placeholder="3.25"
                />
              </div>
            </div>

            {/* Acil Durum İletişim */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Acil Durum İletişim
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup
                  label="İletişim Kişisi Ad Soyad"
                  name="emergencyContactName"
                  defaultValue={profile?.emergencyContactName ?? ""}
                />
                <InputGroup
                  label="Yakınlık Derecesi (Anne, Baba vb.)"
                  name="emergencyContactRelationship"
                  defaultValue={profile?.emergencyContactRelationship ?? ""}
                />
                <div className="sm:col-span-2">
                  <InputGroup
                    label="Acil İletişim Telefonu"
                    name="emergencyContactPhone"
                    defaultValue={profile?.emergencyContactPhone ?? ""}
                    placeholder="0532 xxx xx xx"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Talebiniz Gönderiliyor…" : "Danışman Onayına Gönder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputGroup({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
