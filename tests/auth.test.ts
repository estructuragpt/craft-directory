import { describe, expect, it } from "vitest";
import { googleSocialProviderConfig, mapSessionToActor, resolveSessionActor } from "../src/server/auth";
import { accountRelations, sessionRelations, usersRelations } from "../src/db/schema";
import { PATCH } from "../app/api/providers/[providerId]/route";
import { assertCanManageProvider, ProviderAuthorizationError } from "../src/server/provider-service";
import { PATCH as PATCH_PROFILE } from "../app/api/profile/route";
import { validateProfilePatch } from "../src/server/profile-service";

describe("session role mapping", () => {
  it("maps a Better Auth session user to a supported application role", () => {
    expect(mapSessionToActor({ user: { id: "provider-1", role: "provider" } })).toEqual({ id: "provider-1", role: "provider" });
    expect(mapSessionToActor({ user: { id: "admin-1", role: "admin" } })).toEqual({ id: "admin-1", role: "admin" });
    expect(mapSessionToActor({ user: { id: "client-1", role: "unsupported" } })).toEqual({ id: "client-1", role: "client" });
    expect(mapSessionToActor(null)).toBeNull();
  });
});

describe("Better Auth integration boundaries", () => {
  it("enables Google social login only when both server-only credentials are present", () => {
    expect(googleSocialProviderConfig({ GOOGLE_AUTH_CLIENT_ID: "id", GOOGLE_AUTH_CLIENT_SECRET: "secret" })).toEqual({ clientId: "id", clientSecret: "secret" });
    expect(googleSocialProviderConfig({ GOOGLE_AUTH_CLIENT_ID: "id" })).toBeNull();
    expect(googleSocialProviderConfig({ GOOGLE_AUTH_CLIENT_SECRET: "secret" })).toBeNull();
  });
  it("exposes Drizzle relations for session and account user lookups", () => {
    expect(usersRelations).toBeDefined();
    expect(sessionRelations).toBeDefined();
    expect(accountRelations).toBeDefined();
  });

  it("maps a real session lookup result", async () => {
    await expect(resolveSessionActor(async () => ({ user: { id: "provider-1", role: "provider" } }))).resolves.toEqual({ id: "provider-1", role: "provider" });
  });

  it("returns bad request for a null provider PATCH body before auth lookup", async () => {
    const response = await PATCH(new Request("http://localhost/api/providers/p-1", { method: "PATCH", headers: { "content-type": "application/json" }, body: "null" }), { params: Promise.resolve({ providerId: "p-1" }) });
    expect(response.status).toBe(400);
  });
});

describe("protected provider mutations", () => {
  it("rejects a provider mutating another owner's listing", () => {
    expect(() => assertCanManageProvider({ id: "provider-1", role: "provider" }, "provider-2")).toThrow(ProviderAuthorizationError);
    expect(() => assertCanManageProvider({ id: "admin-1", role: "admin" }, "provider-2")).not.toThrow();
  });
});

describe("profile editing", () => {
  it("validates profile fields without permitting role or email changes", () => {
    expect(validateProfilePatch({ name: " Alex ", phone: "555", businessName: "Studio" })).toEqual({ name: "Alex", phone: "555", businessName: "Studio" });
    expect(validateProfilePatch({ name: "" })).toBeNull();
    expect(validateProfilePatch({ name: "Alex", role: "admin", email: "x@example.com" })).toEqual({ name: "Alex", phone: undefined, businessName: undefined });
  });
  it("rejects malformed profile PATCH before auth lookup", async () => {
    const response = await PATCH_PROFILE(new Request("http://localhost/api/profile", { method: "PATCH", body: JSON.stringify({ role: "admin" }) }));
    expect(response.status).toBe(400);
  });
});
