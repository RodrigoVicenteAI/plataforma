import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Platform",
  description: "A tua loja privada",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body style={{ background: '#0A0A0B', color: '#F2F2F0', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}