import AuthPage from "../../auth/page";
import { isLocale, type Locale } from "../../../src/lib/i18n";
import { notFound } from "next/navigation";
export default async function EnglishAuth({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale) || locale !== "en") notFound(); return <AuthPage locale={locale as Locale} />; }
