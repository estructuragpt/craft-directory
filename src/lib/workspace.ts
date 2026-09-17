import type { Role } from "./directory";

export type RequirementCreateInput = { title: string; details: string; providerId?: string };
export type RequirementClientPatch = Pick<RequirementCreateInput, "title" | "details" | "providerId">;
export type AppointmentCreateInput = { providerId: string; availabilityId?: string };
export const requirementStatuses = ["draft", "submitted", "reviewing", "accepted", "closed"] as const;
export const appointmentStatuses = ["requested", "confirmed", "declined", "cancelled"] as const;
export type RequirementStatus = (typeof requirementStatuses)[number];
export type AppointmentStatus = (typeof appointmentStatuses)[number];

function record(input: unknown): Record<string, unknown> | null {
  return input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : null;
}
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function optionalText(value: unknown) { const result = text(value); return result || undefined; }

export function validateRequirementCreate(input: unknown): RequirementCreateInput | null {
  const value = record(input); if (!value) return null;
  const title = text(value.title); const details = text(value.details); const providerId = optionalText(value.providerId);
  return title && details ? { title, details, ...(providerId ? { providerId } : {}) } : null;
}
export function validateRequirementClientPatch(input: unknown): Partial<RequirementClientPatch> | null {
  const value = record(input); if (!value) return null;
  const patch: Partial<RequirementClientPatch> = {};
  if ("title" in value) { const title = text(value.title); if (!title) return null; patch.title = title; }
  if ("details" in value) { const details = text(value.details); if (!details) return null; patch.details = details; }
  if ("providerId" in value) patch.providerId = optionalText(value.providerId);
  return Object.keys(patch).length ? patch : null;
}
export function validateRequirementStatus(input: unknown): RequirementStatus | null {
  const value = record(input); const status = text(value?.status);
  return requirementStatuses.includes(status as RequirementStatus) ? status as RequirementStatus : null;
}
export function validateAppointmentCreate(input: unknown): AppointmentCreateInput | null {
  const value = record(input); if (!value) return null;
  const providerId = text(value.providerId); const availabilityId = optionalText(value.availabilityId);
  return providerId ? { providerId, ...(availabilityId ? { availabilityId } : {}) } : null;
}
export function validateAppointmentStatus(input: unknown): AppointmentStatus | null {
  const value = record(input); const status = text(value?.status);
  return appointmentStatuses.includes(status as AppointmentStatus) ? status as AppointmentStatus : null;
}

export function canAccessOwnedRecord(role: Role, actorId: string, ownerId: string) { return role === "admin" || actorId === ownerId; }
export function canCreateRequirement(role: Role) { return role === "client"; }
export function canRequestAppointment(role: Role) { return role === "client"; }
export function canManageProviderRecord(role: Role, actorId: string, providerOwnerId: string) { return role === "admin" || (role === "provider" && actorId === providerOwnerId); }
