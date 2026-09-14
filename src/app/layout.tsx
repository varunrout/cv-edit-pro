import type { Metadata } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant-garamond",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CV Edit Pro — AI-Powered Resume Builder",
  description: "Build, edit, and export a professional CV with smart parsing and live preview.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${cormorantGaramond.variable} ${lora.variable}`}>
      <body className="antialiased h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
