import AdminPage from "../../admin/page";
import { notFound } from "next/navigation";
import type { Locale } from "../../../src/lib/i18n";
export default async function SpanishAdmin({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (locale !== "es") notFound(); return <AdminPage locale={locale as Locale} />; }
