import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedFlow-AI | Urológico Valencia",
  description: "Sistema ERP Médico para el Urológico Valencia",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
