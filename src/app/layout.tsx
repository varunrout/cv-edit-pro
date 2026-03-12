import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <body className="antialiased h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
