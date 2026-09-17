import { describe, expect, it } from "vitest";
import { canAccessRoleDashboard, getRoleDashboard } from "../src/lib/role-dashboard";

describe("role dashboards", () => {
  it("does not expose a dashboard to visitors", () => {
    expect(canAccessRoleDashboard("visitor")).toBe(false);
    expect(getRoleDashboard("visitor")).toBeNull();
  });

  it("returns distinct workspaces for each authorized role", () => {
    expect(getRoleDashboard("client")?.primaryAction.view).toBe("requirements");
    expect(getRoleDashboard("provider")?.primaryAction.view).toBe("manage");
    expect(getRoleDashboard("admin")?.primaryAction.label).toBe("Moderate listings");
  });
});
