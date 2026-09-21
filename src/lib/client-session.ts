import type { Provider, ProviderCreateInput, Role } from "./directory";

export type SessionActor = { id: string; role: Role; name?: string; phone?: string; businessName?: string };
export type SessionPayload = { user: { id: string; role?: string | null; name?: string | null; email?: string | null; phone?: string | null; businessName?: string | null } | null };
export type ManagementIdentity = SessionActor & { source: "session" | "demo" };

const roles: Role[] = ["visitor", "client", "provider", "admin"];
function sessionActor(payload: SessionPayload | null): SessionActor | null {
  if (!payload?.user?.id) return null;
  const role = roles.includes(payload.user.role as Role) ? payload.user.role as Role : "client";
  return { id: payload.user.id, role, name: payload.user.name ?? undefined, phone: payload.user.phone ?? undefined, businessName: payload.user.businessName ?? undefined };
}

export function managementIdentity(payload: SessionPayload | null, demo: SessionActor): ManagementIdentity {
  const actor = sessionActor(payload);
  return actor ? { ...actor, source: "session" } : { ...demo, source: "demo" };
}

export async function fetchSession(fetcher: typeof fetch = fetch): Promise<SessionPayload | null> {
  const response = await fetcher("/api/auth/get-session", { credentials: "include" });
  if (!response.ok) return null;
  return response.json() as Promise<SessionPayload>;
}
export async function fetchProfile(fetcher: typeof fetch = fetch): Promise<SessionPayload | null> {
  const response = await fetcher("/api/profile", { credentials: "include" });
  return response.ok ? response.json() as Promise<SessionPayload> : null;
}
export type ProfilePatch = { name: string; phone?: string; businessName?: string };
export async function mutateProfile(fetcher: typeof fetch, patch: ProfilePatch) {
  return fetcher("/api/profile", { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
}

export async function fetchProviders(fetcher: typeof fetch = fetch): Promise<Provider[] | null> {
  const response = await fetcher("/api/providers", { credentials: "include" });
  if (!response.ok) return null;
  return response.json() as Promise<Provider[]>;
}

export async function createPersistedProvider(fetcher: typeof fetch, input: ProviderCreateInput) {
  return fetcher("/api/providers", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
}

export async function mutateProvider(fetcher: typeof fetch, providerId: string, method: "PATCH" | "DELETE", patch?: unknown) {
  return fetcher(`/api/providers/${providerId}`, { method, credentials: "include", headers: patch ? { "content-type": "application/json" } : undefined, body: patch ? JSON.stringify(patch) : undefined });
}

export type WorkspaceRequirement = { id: string; clientId: string; providerId: string | null; title: string; details: string; status: string };
export type WorkspaceAppointment = { id: string; clientId: string; providerId: string; availabilityId: string | null; status: string };
export async function fetchWorkspace<T>(fetcher: typeof fetch, resource: "requirements" | "appointments"): Promise<T[] | null> {
  const response = await fetcher(`/api/${resource}`, { credentials: "include" });
  return response.ok ? response.json() as Promise<T[]> : null;
}
export async function createWorkspaceRecord(fetcher: typeof fetch, resource: "requirements" | "appointments", input: unknown) {
  return fetcher(`/api/${resource}`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
}
export async function patchWorkspaceRecord(fetcher: typeof fetch, resource: "requirements" | "appointments", id: string, input: unknown) {
  return fetcher(`/api/${resource}/${id}`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
}
export async function confirmCalendarAppointment(fetcher: typeof fetch, appointmentId: string, createMeet = false) {
  return fetcher(`/api/appointments/${appointmentId}/confirm`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ createMeet }) });
}
export async function fetchProviderAvailability(fetcher: typeof fetch, providerId: string, timeMin: string, timeMax: string) {
  const response = await fetcher(`/api/providers/${providerId}/availability?${new URLSearchParams({ timeMin, timeMax })}`);
  return response.ok ? response.json() as Promise<{ busy: Array<{ start: string; end: string }> }> : null;
}
export function safeAuthCallbackURL(value: string) { return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/"; }
export async function linkGoogleAccount(fetcher: typeof fetch = fetch, callbackURL = "/?account=linked") {
  const response = await fetcher("/api/auth/link-social", { method: "POST", credentials: "include", redirect: "manual", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider: "google", callbackURL: safeAuthCallbackURL(callbackURL), errorCallbackURL: safeAuthCallbackURL("/?account=link-failed") }) });
  const payload = await response.json().catch(() => null) as { url?: string; message?: string } | null;
  return { ok: response.ok, url: payload?.url ?? (response.redirected ? response.url : undefined), message: payload?.message };
}

export function getMutationNotice(status: number) {
  if (status === 401) return "Sign in to save or manage this record.";
  if (status === 403) return "You do not have permission to manage this record.";
  if (status === 503) return "Persistence is unavailable. Try again after production services are configured.";
  return "Unable to save this change. Please try again.";
}
