import { describe, expect, it } from "vitest";
import { deleteProvider, filterProviders, providers, updateProvider, validateProviderPatch } from "../src/lib/directory";

describe("filterProviders", () => {
  it("matches text, category, and location together", () => {
    expect(filterProviders(providers, { query: "green", category: "Landscape", location: "Austin" }).map((p) => p.id)).toEqual(["green-horizon"]);
  });

  it("returns all providers with empty filters", () => {
    expect(filterProviders(providers, {}).length).toBe(providers.length);
  });
});

describe("provider patch validation", () => {
  it("rejects malformed values without throwing", () => {
    expect(validateProviderPatch(null)).toBeNull();
    expect(validateProviderPatch({ description: "" })).toBeNull();
  });
});

describe("provider mutations", () => {
  it("updates a listing only for its provider owner or an administrator", () => {
    const provider = providers[0];
    expect(updateProvider(providers, provider.id, { description: "Updated description" }, "provider", provider.ownerId)?.description).toBe("Updated description");
    expect(updateProvider(providers, provider.id, { description: "Blocked" }, "provider", "northline")).toBeNull();
    expect(updateProvider(providers, provider.id, { description: "Admin update" }, "admin", "")?.description).toBe("Admin update");
  });

  it("deletes a listing only for its provider owner or an administrator", () => {
    const provider = providers[0];
    expect(deleteProvider(providers, provider.id, "provider", "northline")).toBeNull();
    expect(deleteProvider(providers, provider.id, "provider", provider.ownerId)?.some((item) => item.id === provider.id)).toBe(false);
    expect(deleteProvider(providers, provider.id, "admin", "")?.some((item) => item.id === provider.id)).toBe(false);
  });
});
