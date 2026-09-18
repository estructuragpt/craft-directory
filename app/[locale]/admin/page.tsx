import AdminPage from "../../admin/page";
import { isLocale, type Locale } from "../../../src/lib/i18n";
import { notFound } from "next/navigation";
export default async function LocalizedAdmin({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <AdminPage locale={locale as Locale} />; }
