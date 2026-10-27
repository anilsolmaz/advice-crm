// components/crm/common/GenderAvatar.tsx
"use client";

import React from "react";

interface GenderAvatarProps {
  avatarUrl?: string | null;
  gender?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
};

export function GenderAvatar({
  avatarUrl,
  gender,
  name,
  size = "md",
  className = "",
}: GenderAvatarProps) {
  const sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const normalizedGender = (gender || "").trim().toUpperCase();
  const isFemale =
    normalizedGender === "FEMALE" ||
    normalizedGender === "KADIN" ||
    normalizedGender === "F";
  const isMale =
    normalizedGender === "MALE" ||
    normalizedGender === "ERKEK" ||
    normalizedGender === "M";

  if (avatarUrl) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-xs ${sizeCls} ${className}`}
      >
        <img
          src={avatarUrl}
          alt={name ? `${name} profil` : "Profil resmi"}
          className="h-full w-full object-cover"
          onError={(e) => {
            // fallback if broken image
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  // Classic Facebook-style silhouette SVG placeholders
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs flex items-end justify-center ${
        isFemale
          ? "bg-gradient-to-b from-rose-50/80 to-slate-200/90 text-rose-300"
          : isMale
          ? "bg-gradient-to-b from-sky-50/80 to-slate-200/90 text-sky-400"
          : "bg-gradient-to-b from-slate-100 to-slate-200/90 text-slate-400"
      } ${sizeCls} ${className}`}
      title={gender ? `Cinsiyet: ${gender}` : "Profil Resmi"}
    >
      {isFemale ? (
        // Classic Female Silhouette (Facebook-style)
        <svg
          viewBox="0 0 100 100"
          fill="currentColor"
          className="w-[82%] h-[82%] text-slate-500 drop-shadow-xs"
        >
          {/* Head & Female Hair Silhouette */}
          <path d="M50 16 C39 16 31 25 31 37 C31 43 33 48 37 53 C33 55 25 61 22 68 C19 74 18 83 18 96 L82 96 C82 83 81 74 78 68 C75 61 67 55 63 53 C67 48 69 43 69 37 C69 25 61 16 50 16 Z M50 20 C58 20 64 26 64 35 C64 42 58 48 50 48 C42 48 36 42 36 35 C36 26 42 20 50 20 Z" />
          {/* Hair sides & ponytail suggestion */}
          <path
            d="M36 31 C36 22 42 17 50 17 C58 17 64 22 64 31 C63 38 61 44 65 52 C59 50 56 46 54 42 C53 45 47 45 46 42 C44 46 41 50 35 52 C39 44 37 38 36 31 Z"
            fill="currentColor"
          />
        </svg>
      ) : isMale ? (
        // Classic Male Silhouette (Facebook-style)
        <svg
          viewBox="0 0 100 100"
          fill="currentColor"
          className="w-[84%] h-[84%] text-slate-500 drop-shadow-xs"
        >
          {/* Head */}
          <circle cx="50" cy="34" r="17" />
          {/* Shoulders & Torso */}
          <path d="M50 55 C35 55 18 63 15 76 C13 83 13 90 13 98 L87 98 C87 90 87 83 85 76 C82 63 65 55 50 55 Z" />
        </svg>
      ) : (
        // Classic Neutral Unisex Silhouette
        <svg
          viewBox="0 0 100 100"
          fill="currentColor"
          className="w-[84%] h-[84%] text-slate-400 drop-shadow-xs"
        >
          {/* Head */}
          <circle cx="50" cy="34" r="16" />
          {/* Shoulders */}
          <path d="M50 56 C36 56 20 64 17 77 C15 84 15 91 15 98 L85 98 C85 91 85 84 83 77 C80 64 64 56 50 56 Z" />
        </svg>
      )}
    </div>
  );
}
