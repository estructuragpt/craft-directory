import type { Metadata } from "next";
import { headers } from "next/headers";
import { defaultLocale, isLocale } from "../src/lib/i18n";
import "./globals.css";
export const metadata: Metadata = { title: "CraftDirectory", description: "A local-first professional directory demo" };
export const dynamic = "force-dynamic";
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const value = (await headers()).get("x-locale");
  const locale = isLocale(value) ? value : defaultLocale;
  return <html lang={locale}><body>{children}</body></html>;
}
