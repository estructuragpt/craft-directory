import { eq } from "drizzle-orm";
import { getDb, hasDatabaseUrl } from "../db";
import { appointments, auditLogs, availability, providerProfiles, requirements } from "../db/schema";
import { canAccessOwnedRecord, canCreateRequirement, canManageProviderRecord, canRequestAppointment, type AppointmentCreateInput, type AppointmentStatus, type RequirementClientPatch, type RequirementCreateInput, type RequirementStatus } from "../lib/workspace";
import type { AuthenticatedActor } from "./auth";

export class WorkspaceAuthorizationError extends Error {}
export class WorkspaceNotFoundError extends Error {}
export class WorkspaceValidationError extends Error {}
export class WorkspacePersistenceUnavailableError extends Error {}

export type RequirementRecord = { id: string; clientId: string; providerId: string | null; title: string; details: string; status: string; createdAt: Date; updatedAt: Date };
export type AppointmentRecord = { id: string; clientId: string; providerId: string; availabilityId: string | null; status: string; createdAt: Date; updatedAt: Date };

function assertClient(actor: AuthenticatedActor, action: "create requirements" | "request appointments") {
  const permitted = action === "create requirements" ? canCreateRequirement(actor.role) : canRequestAppointment(actor.role);
  if (!permitted) throw new WorkspaceAuthorizationError(`You cannot ${action}.`);
}
async function providerExists(providerId: string) {
  const [provider] = await getDb().select({ id: providerProfiles.id }).from(providerProfiles).where(eq(providerProfiles.id, providerId)).limit(1);
  if (!provider) throw new WorkspaceValidationError("Provider not found.");
}
async function providerOwnerId(providerId: string) {
  const [provider] = await getDb().select({ ownerId: providerProfiles.ownerId }).from(providerProfiles).where(eq(providerProfiles.id, providerId)).limit(1);
  if (!provider) throw new WorkspaceNotFoundError("Provider not found.");
  return provider.ownerId;
}

export interface WorkspaceRepository {
  listRequirements(actor: AuthenticatedActor): Promise<RequirementRecord[]>;
  createRequirement(actor: AuthenticatedActor, input: RequirementCreateInput): Promise<RequirementRecord>;
  updateRequirement(actor: AuthenticatedActor, id: string, patch: Partial<RequirementClientPatch>, status?: RequirementStatus): Promise<void>;
  listAppointments(actor: AuthenticatedActor): Promise<AppointmentRecord[]>;
  createAppointment(actor: AuthenticatedActor, input: AppointmentCreateInput): Promise<AppointmentRecord>;
  updateAppointment(actor: AuthenticatedActor, id: string, status: AppointmentStatus): Promise<void>;
}

class DrizzleWorkspaceRepository implements WorkspaceRepository {
  async listRequirements(actor: AuthenticatedActor) {
    const db = getDb();
    if (actor.role === "admin") return db.select().from(requirements);
    if (actor.role === "client") return db.select().from(requirements).where(eq(requirements.clientId, actor.id));
    if (actor.role === "provider") return db.select({ id: requirements.id, clientId: requirements.clientId, providerId: requirements.providerId, title: requirements.title, details: requirements.details, status: requirements.status, createdAt: requirements.createdAt, updatedAt: requirements.updatedAt }).from(requirements).innerJoin(providerProfiles, eq(requirements.providerId, providerProfiles.id)).where(eq(providerProfiles.ownerId, actor.id));
    throw new WorkspaceAuthorizationError("You cannot view requirements.");
  }
  async createRequirement(actor: AuthenticatedActor, input: RequirementCreateInput) {
    assertClient(actor, "create requirements");
    if (input.providerId) await providerExists(input.providerId);
    const record: RequirementRecord = { id: crypto.randomUUID(), clientId: actor.id, providerId: input.providerId ?? null, title: input.title, details: input.details, status: "submitted", createdAt: new Date(), updatedAt: new Date() };
    await getDb().insert(requirements).values(record);
    await getDb().insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, action: "requirement.created", entityType: "requirement", entityId: record.id });
    return record;
  }
  async updateRequirement(actor: AuthenticatedActor, id: string, patch: Partial<RequirementClientPatch>, status?: RequirementStatus) {
    const [requirement] = await getDb().select().from(requirements).where(eq(requirements.id, id)).limit(1);
    if (!requirement) throw new WorkspaceNotFoundError("Requirement not found.");
    const providerOwner = requirement.providerId ? await providerOwnerId(requirement.providerId) : null;
    const clientOwns = canAccessOwnedRecord(actor.role, actor.id, requirement.clientId);
    const providerManages = providerOwner ? canManageProviderRecord(actor.role, actor.id, providerOwner) : actor.role === "admin";
    if (!clientOwns && !providerManages) throw new WorkspaceAuthorizationError("You cannot manage this requirement.");
    if (status && !providerManages) throw new WorkspaceAuthorizationError("Only the addressed provider or an admin can update requirement status.");
    if (Object.keys(patch).length && !clientOwns) throw new WorkspaceAuthorizationError("Only the client or an admin can edit requirement details.");
    if (patch.providerId) await providerExists(patch.providerId);
    await getDb().update(requirements).set({ ...patch, ...(status ? { status } : {}), updatedAt: new Date() }).where(eq(requirements.id, id));
    await getDb().insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, action: "requirement.updated", entityType: "requirement", entityId: id });
  }
  async listAppointments(actor: AuthenticatedActor) {
    const db = getDb();
    if (actor.role === "admin") return db.select().from(appointments);
    if (actor.role === "client") return db.select().from(appointments).where(eq(appointments.clientId, actor.id));
    if (actor.role === "provider") return db.select({ id: appointments.id, clientId: appointments.clientId, providerId: appointments.providerId, availabilityId: appointments.availabilityId, status: appointments.status, createdAt: appointments.createdAt, updatedAt: appointments.updatedAt }).from(appointments).innerJoin(providerProfiles, eq(appointments.providerId, providerProfiles.id)).where(eq(providerProfiles.ownerId, actor.id));
    throw new WorkspaceAuthorizationError("You cannot view appointments.");
  }
  async createAppointment(actor: AuthenticatedActor, input: AppointmentCreateInput) {
    assertClient(actor, "request appointments");
    await providerExists(input.providerId);
    if (input.availabilityId) {
      const [slot] = await getDb().select({ providerId: availability.providerId }).from(availability).where(eq(availability.id, input.availabilityId)).limit(1);
      if (!slot || slot.providerId !== input.providerId) throw new WorkspaceValidationError("Availability does not belong to this provider.");
    }
    const record: AppointmentRecord = { id: crypto.randomUUID(), clientId: actor.id, providerId: input.providerId, availabilityId: input.availabilityId ?? null, status: "requested", createdAt: new Date(), updatedAt: new Date() };
    await getDb().insert(appointments).values(record);
    await getDb().insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, action: "appointment.requested", entityType: "appointment", entityId: record.id });
    return record;
  }
  async updateAppointment(actor: AuthenticatedActor, id: string, status: AppointmentStatus) {
    const [appointment] = await getDb().select().from(appointments).where(eq(appointments.id, id)).limit(1);
    if (!appointment) throw new WorkspaceNotFoundError("Appointment not found.");
    if (appointment.status === "calendar_confirming") throw new WorkspaceValidationError("Calendar confirmation is in progress and cannot be changed.");
    const providerOwner = await providerOwnerId(appointment.providerId);
    const clientCancels = actor.role === "client" && actor.id === appointment.clientId && status === "cancelled";
    if (!clientCancels && !canManageProviderRecord(actor.role, actor.id, providerOwner)) throw new WorkspaceAuthorizationError("You cannot manage this appointment.");
    await getDb().update(appointments).set({ status, updatedAt: new Date() }).where(eq(appointments.id, id));
    await getDb().insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, action: "appointment.updated", entityType: "appointment", entityId: id });
  }
}

export function getWorkspaceRepository(): WorkspaceRepository {
  if (!hasDatabaseUrl()) throw new WorkspacePersistenceUnavailableError("Database persistence is not configured.");
  return new DrizzleWorkspaceRepository();
}
