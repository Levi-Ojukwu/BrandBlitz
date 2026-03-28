import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BrandBlitz — Stellar Edition",
  description:
    "Brands deposit USDC on Stellar. Users compete in 45-second brand challenges. Top performers earn USDC instantly.",
  openGraph: {
    title: "BrandBlitz",
    description: "Earn USDC by mastering brand challenges",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen flex flex-col antialiased bg-[var(--background)] text-[var(--foreground)]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
