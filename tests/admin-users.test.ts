import { describe, expect, it, vi } from "vitest";
import { validateManageableRole } from "../src/lib/admin-users";
import { AdminUserAuthorizationError, AdminUserValidationError, LAST_ADMIN_LOCKING_GUARD, assertRoleChangeIsSafe, listAdminUsers, updateAdminUserRole, type AdminUserRepository } from "../src/server/admin-user-service";

describe("admin user management", () => {
  const admin = { id: "admin-1", role: "admin" as const };
  const repository: AdminUserRepository = {
    list: async () => [{ id: "user-1", email: "client@example.com", name: "Client", role: "client" }],
    updateRole: async (_actorId, id, role) => ({ id, email: "client@example.com", name: "Client", role }),
  };

  it("accepts only roles that can be assigned by an administrator", () => {
    expect(validateManageableRole("client")).toBe("client");
    expect(validateManageableRole("provider")).toBe("provider");
    expect(validateManageableRole("admin")).toBe("admin");
    expect(validateManageableRole("visitor")).toBeNull();
    expect(validateManageableRole("owner")).toBeNull();
  });

  it("rejects non-admin actors before listing or updating users", async () => {
    await expect(listAdminUsers({ id: "provider-1", role: "provider" }, repository)).rejects.toBeInstanceOf(AdminUserAuthorizationError);
    await expect(updateAdminUserRole({ id: "client-1", role: "client" }, "user-1", "provider", repository)).rejects.toBeInstanceOf(AdminUserAuthorizationError);
  });

  it("updates a user role through the authorized repository boundary", async () => {
    await expect(updateAdminUserRole(admin, "user-1", "provider", repository)).resolves.toEqual({ id: "user-1", email: "client@example.com", name: "Client", role: "provider" });
  });

  it("blocks administrator self-demotion", () => {
    expect(() => assertRoleChangeIsSafe(admin, { id: "admin-1", role: "admin" }, "provider")).toThrow(AdminUserValidationError);
    expect(() => assertRoleChangeIsSafe(admin, { id: "admin-2", role: "admin" }, "provider")).not.toThrow();
  });

  it("uses a row-locking conditional guard so concurrent admin demotions cannot both pass", () => {
    expect(LAST_ADMIN_LOCKING_GUARD).toContain("FOR UPDATE");
    expect(LAST_ADMIN_LOCKING_GUARD).toContain("count(*) FROM locked_admins) > 1");
    expect(LAST_ADMIN_LOCKING_GUARD).toContain("INSERT INTO audit_logs");
  });

  it("delegates role changes to the repository exactly once", async () => {
    const updateRole = vi.fn(async (_actorId: string, id: string, role: "client" | "provider" | "admin") => ({ id, email: "client@example.com", name: "Client", role }));
    await updateAdminUserRole(admin, "user-1", "admin", { list: repository.list, updateRole });
    expect(updateRole).toHaveBeenCalledTimes(1);
    expect(updateRole).toHaveBeenCalledWith("admin-1", "user-1", "admin");
  });
});
