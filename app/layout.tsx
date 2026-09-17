// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Advice Yurtdışı Eğitim CRM & Öğrenci Portalı",
  description: "Work and Travel, Akademi, Dil Okulları ve Vize Danışmanlığı Yönetim Portalı",
  icons: {
    icon: "/advice-logo.svg",
    shortcut: "/advice-logo.svg",
    apple: "/advice-logo.svg",
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
