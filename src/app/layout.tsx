import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { SiteHeader } from "@/components/layout/site-header";

const inter = Inter({
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "SkillBridge",
  description: "Campus Skill Exchange Platform"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen">
          <SiteHeader />
          <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

