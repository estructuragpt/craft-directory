import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, supportedLocales } from "../../src/lib/i18n";

export function generateStaticParams() { return supportedLocales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: value } = await params; const locale = isLocale(value) ? value : "en";
  const title = locale === "es" ? "CraftDirectory — Directorio profesional" : "CraftDirectory — Professional directory";
  const description = locale === "es" ? "Encuentra profesionales confiables para tu hogar." : "Find trusted professionals for your home.";
  return { title, description, alternates: { canonical: `/${locale}`, languages: { en: "/en", es: "/es" } }, openGraph: { title, description, locale } };
}
export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale: value } = await params; if (!isLocale(value)) notFound();
  return children;
}
