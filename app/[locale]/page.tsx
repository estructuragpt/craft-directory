import DirectoryApp from "../directory-app";
import { isLocale, type Locale } from "../../src/lib/i18n";
import { notFound } from "next/navigation";

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  return <DirectoryApp locale={locale as Locale} />;
}
