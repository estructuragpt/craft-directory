import { notFound, redirect } from "next/navigation";
import { getCurrentActor } from "../../src/server/auth";
import AdminUserManagement from "./user-management";
import { localizedPath, type Locale } from "../../src/lib/i18n";

export default async function AdminPage({ locale = "en" }: { locale?: Locale }) {
  const actor = await getCurrentActor();
  if (!actor) redirect(localizedPath("auth", locale));
  if (actor.role !== "admin") notFound();
  return <AdminUserManagement />;
}
