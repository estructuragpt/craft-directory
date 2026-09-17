import { describe, expect, it } from "vitest";
import { fetchProviders, getMutationNotice, linkGoogleAccount, managementIdentity, mutateProvider, safeAuthCallbackURL, type SessionPayload } from "../src/lib/client-session";
import { assertCanCreateProvider, ProviderAuthorizationError, toDirectoryProvider } from "../src/server/provider-service";

describe("session-aware provider management", () => {
  it("uses the authenticated actor instead of the demo fallback", () => {
    const session: SessionPayload = { user: { id: "provider-1", role: "provider", name: "Provider" } };
    expect(managementIdentity(session, { id: "green-horizon", role: "provider" })).toEqual({ id: "provider-1", role: "provider", name: "Provider", source: "session" });
  });

  it("uses the clearly separate demo identity only without a session", () => {
    expect(managementIdentity(null, { id: "green-horizon", role: "provider" })).toEqual({ id: "green-horizon", role: "provider", source: "demo" });
  });
});

describe("provider mutation errors", () => {
  it("keeps social-link callbacks same-origin and forwards Better Auth redirect URLs", async () => {
    expect(safeAuthCallbackURL("/?account=linked")).toBe("/?account=linked");
    expect(safeAuthCallbackURL("https://attacker.test")).toBe("/");
    expect(safeAuthCallbackURL("//attacker.test")).toBe("/");
    const result = await linkGoogleAccount((async (_input, init) => { expect(init?.body).toBe(JSON.stringify({ provider: "google", callbackURL: "/?account=linked", errorCallbackURL: "/?account=link-failed" })); return new Response(JSON.stringify({ url: "https://accounts.google.com/authorize" }), { status: 200 }); }) as typeof fetch);
    expect(result).toEqual({ ok: true, url: "https://accounts.google.com/authorize", message: undefined });
  });
  it("maps protected API errors to actionable UI messages", () => {
    expect(getMutationNotice(401)).toContain("Sign in");
    expect(getMutationNotice(403)).toContain("permission");
    expect(getMutationNotice(503)).toContain("unavailable");
  });

  it("sends authenticated provider mutations with browser credentials", async () => {
    let init: RequestInit | undefined;
    const response = await mutateProvider((async (_input, requestInit) => { init = requestInit; return new Response(null, { status: 403 }); }) as typeof fetch, "provider-1", "DELETE");
    expect(response.status).toBe(403);
    expect(init?.credentials).toBe("include");
    expect(init?.method).toBe("DELETE");
  });

  it("loads persisted providers with authenticated ownership IDs", async () => {
    const providers = await fetchProviders((async () => new Response(JSON.stringify([{ id: "p-1", ownerId: "user-1", name: "Studio", category: "Landscape", location: "Austin", description: "Design", image: "image", rating: 5, reviews: 0, services: [] }]), { status: 200 })) as typeof fetch);
    expect(providers?.[0].ownerId).toBe("user-1");
  });

  it("only allows providers and admins to create persisted listings", () => {
    expect(() => assertCanCreateProvider({ id: "provider-1", role: "provider" })).not.toThrow();
    expect(() => assertCanCreateProvider({ id: "client-1", role: "client" })).toThrow(ProviderAuthorizationError);
    expect(toDirectoryProvider({ id: "p-1", ownerId: "user-1", name: "Studio", category: "Landscape", location: "Austin", description: "Design", image: "image", rating: 5, reviews: 0 })).toMatchObject({ ownerId: "user-1", services: [] });
  });
});
