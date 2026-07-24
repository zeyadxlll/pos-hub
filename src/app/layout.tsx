import "./globals.css";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "POS Hub ERP - منصة إدارة وتجارة أجهزة اللاب توب والـ POS",
  description:
    "نظام POS Hub السحابي المتكامل لإدارة محلات وتجار اللاب توب، متابعة السيريال نمبر، الكاشير، الخزينة، والمشتريات والاشتراكات.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <Providers>
          {children}
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
