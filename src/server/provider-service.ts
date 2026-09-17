import { and, eq } from "drizzle-orm";
import { getDb, hasDatabaseUrl } from "../db";
import { auditLogs, providerProfiles } from "../db/schema";
import { canManageProvider } from "../lib/permissions";
import type { Provider, ProviderCreateInput, ProviderPatch } from "../lib/directory";
import type { AuthenticatedActor } from "./auth";

export class PersistenceUnavailableError extends Error {}
export class ProviderAuthorizationError extends Error {}
export class ProviderNotFoundError extends Error {}

export function assertCanManageProvider(actor: AuthenticatedActor, providerOwnerId: string) {
  if (!canManageProvider(actor.role, actor.id, providerOwnerId)) throw new ProviderAuthorizationError("You cannot manage this provider.");
}
export function assertCanCreateProvider(actor: AuthenticatedActor) {
  if (actor.role !== "provider" && actor.role !== "admin") throw new ProviderAuthorizationError("You cannot create a provider.");
}

type ProviderProfileRecord = { id: string; ownerId: string; name: string; category: string; location: string; description: string; image: string; rating: number; reviews: number };
export function toDirectoryProvider(provider: ProviderProfileRecord): Provider {
  return { ...provider, services: [] };
}

export interface ProviderRepository {
  list(): Promise<Provider[]>;
  create(actor: AuthenticatedActor, input: ProviderCreateInput): Promise<Provider>;
  update(actor: AuthenticatedActor, providerId: string, patch: Partial<ProviderPatch>): Promise<void>;
  delete(actor: AuthenticatedActor, providerId: string): Promise<void>;
}

class DrizzleProviderRepository implements ProviderRepository {
  async list() {
    const db = getDb();
    const rows = await db.select().from(providerProfiles);
    return rows.map(toDirectoryProvider);
  }

  async create(actor: AuthenticatedActor, input: ProviderCreateInput) {
    assertCanCreateProvider(actor);
    const provider = { id: crypto.randomUUID(), ownerId: actor.id, ...input, image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80", rating: 5, reviews: 0 };
    const db = getDb();
    await db.insert(providerProfiles).values(provider);
    await db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, action: "provider.created", entityType: "provider", entityId: provider.id });
    return toDirectoryProvider(provider);
  }
  async update(actor: AuthenticatedActor, providerId: string, patch: Partial<ProviderPatch>) {
    const db = getDb();
    const [provider] = await db.select({ ownerId: providerProfiles.ownerId }).from(providerProfiles).where(eq(providerProfiles.id, providerId)).limit(1);
    if (!provider) throw new ProviderNotFoundError("Provider not found.");
    assertCanManageProvider(actor, provider.ownerId);
    await db.update(providerProfiles).set({ ...patch, updatedAt: new Date() }).where(eq(providerProfiles.id, providerId));
    await db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, action: "provider.updated", entityType: "provider", entityId: providerId });
  }

  async delete(actor: AuthenticatedActor, providerId: string) {
    const db = getDb();
    const [provider] = await db.select({ ownerId: providerProfiles.ownerId }).from(providerProfiles).where(eq(providerProfiles.id, providerId)).limit(1);
    if (!provider) throw new ProviderNotFoundError("Provider not found.");
    assertCanManageProvider(actor, provider.ownerId);
    await db.delete(providerProfiles).where(and(eq(providerProfiles.id, providerId), eq(providerProfiles.ownerId, provider.ownerId)));
    await db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, action: "provider.deleted", entityType: "provider", entityId: providerId });
  }
}

export function getProviderRepository(): ProviderRepository {
  if (!hasDatabaseUrl()) throw new PersistenceUnavailableError("Database persistence is not configured.");
  return new DrizzleProviderRepository();
}
