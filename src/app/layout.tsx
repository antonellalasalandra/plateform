import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plateform",
  description: "Gestionale SaaS multi-tenant per prenotazioni e tavoli live.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
