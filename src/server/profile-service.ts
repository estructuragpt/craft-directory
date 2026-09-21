import { eq } from "drizzle-orm";
import { getDb, hasDatabaseUrl } from "../db";
import { auditLogs, users } from "../db/schema";
import type { AuthenticatedActor } from "./auth";

export class ProfilePersistenceUnavailableError extends Error {}
export class ProfileValidationError extends Error {}
export type ProfilePatch = { name: string; phone?: string; businessName?: string };
export function validateProfilePatch(input: unknown): ProfilePatch | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (typeof value.name !== "string" || !value.name.trim() || value.name.length > 120) return null;
  if (value.phone !== undefined && (typeof value.phone !== "string" || value.phone.length > 40)) return null;
  if (value.businessName !== undefined && (typeof value.businessName !== "string" || value.businessName.length > 160)) return null;
  return { name: value.name.trim(), phone: typeof value.phone === "string" ? value.phone.trim() || undefined : undefined, businessName: typeof value.businessName === "string" ? value.businessName.trim() || undefined : undefined };
}
export function getProfileRepository() {
  if (!hasDatabaseUrl()) throw new ProfilePersistenceUnavailableError("Database persistence is not configured.");
  return {
    async get(actor: AuthenticatedActor) { const [user] = await getDb().select({ id: users.id, email: users.email, name: users.name, role: users.role, phone: users.phone, businessName: users.businessName }).from(users).where(eq(users.id, actor.id)).limit(1); return user ?? null; },
    async update(actor: AuthenticatedActor, patch: ProfilePatch) { const [user] = await getDb().update(users).set({ name: patch.name, phone: patch.phone ?? null, businessName: patch.businessName ?? null, updatedAt: new Date() }).where(eq(users.id, actor.id)).returning({ id: users.id, email: users.email, name: users.name, role: users.role, phone: users.phone, businessName: users.businessName }); if (!user) throw new ProfileValidationError("User not found."); await getDb().insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, action: "profile.updated", entityType: "user", entityId: actor.id }); return user; },
  };
}
