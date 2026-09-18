import { describe, expect, it } from "vitest";
import { canManageProvider, canViewAppointments } from "../src/lib/permissions";

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

describe("canViewAppointments", () => {
  it("allows clients, providers, and administrators to access their appointment workspace", () => {
    expect(canViewAppointments("client")).toBe(true);
    expect(canViewAppointments("provider")).toBe(true);
    expect(canViewAppointments("admin")).toBe(true);
    expect(canViewAppointments("visitor")).toBe(false);
  });
});
