import { describe, expect, it } from "vitest";
import { canManageProvider } from "../src/lib/permissions";

describe("canManageProvider", () => {
  it("allows administrators and a provider managing their own listing", () => {
    expect(canManageProvider("admin", "any", "other")).toBe(true);
    expect(canManageProvider("provider", "green-horizon", "green-horizon")).toBe(true);
  });

  it("prevents visitors, clients, and other providers from editing", () => {
    expect(canManageProvider("visitor", "green-horizon", "green-horizon")).toBe(false);
    expect(canManageProvider("client", "green-horizon", "green-horizon")).toBe(false);
    expect(canManageProvider("provider", "green-horizon", "northline")).toBe(false);
  });
});
