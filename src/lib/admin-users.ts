import type { Role } from "./directory";

export const manageableRoles = ["client", "provider", "admin"] as const satisfies readonly Exclude<Role, "visitor">[];
export type ManageableRole = (typeof manageableRoles)[number];

export function validateManageableRole(input: unknown): ManageableRole | null {
  return typeof input === "string" && (manageableRoles as readonly string[]).includes(input) ? input as ManageableRole : null;
}
