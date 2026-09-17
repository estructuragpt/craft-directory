import { notFound, redirect } from "next/navigation";
import { getCurrentActor } from "../../src/server/auth";
import AdminUserManagement from "./user-management";

export default async function AdminPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/auth");
  if (actor.role !== "admin") notFound();
  return <AdminUserManagement />;
}
