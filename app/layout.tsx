// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BackPax CRM & Öğrenci Portalı",
  description: "BackPax Global Education & Travel — Work and Travel, Akademi, Dil Okulları, Yaz Okulu ve Vize Danışmanlığı Yönetim Portalı",
  icons: {
    icon: "/backpax-logo.svg",
    shortcut: "/backpax-logo.svg",
    apple: "/backpax-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="antialiased min-h-screen bg-slate-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
