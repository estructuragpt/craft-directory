import type { Role } from "./directory";

export function canManageProvider(role: Role, actorId: string, providerOwnerId: string) {
  return role === "admin" || (role === "provider" && actorId === providerOwnerId);
}
export function canViewRequirements(role: Role) { return role === "client" || role === "provider" || role === "admin"; }
export function canBookAppointment(role: Role) { return role === "client" || role === "admin"; }
