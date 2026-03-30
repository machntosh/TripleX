import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "Journal Sèche 60J",
  description: "Journal alimentaire et sportif pour votre sèche de 60 jours",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50">
        <main className="max-w-lg mx-auto min-h-screen pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
