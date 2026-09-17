import { eq, sql } from "drizzle-orm";
import { getDb, hasDatabaseUrl } from "../db";
import { users } from "../db/schema";
import type { ManageableRole } from "../lib/admin-users";
import type { AuthenticatedActor } from "./auth";

export type AdminUser = { id: string; email: string; name: string; role: string };

export class AdminUserAuthorizationError extends Error {}
export class AdminUserValidationError extends Error {}
export class AdminUserNotFoundError extends Error {}
export class AdminUserPersistenceUnavailableError extends Error {}

export interface AdminUserRepository {
  list(): Promise<AdminUser[]>;
  updateRole(actorId: string, userId: string, role: ManageableRole): Promise<AdminUser>;
}

// The row lock serializes concurrent admin demotions; the count is evaluated after the lock is acquired.
export const LAST_ADMIN_LOCKING_GUARD = `
  WITH locked_admins AS MATERIALIZED (
    SELECT id FROM users WHERE role = 'admin' FOR UPDATE
  ),
  updated AS (
    UPDATE users
    SET role = ?, updated_at = NOW()
    WHERE id = ?
      AND (role <> 'admin' OR ? = 'admin' OR (SELECT count(*) FROM locked_admins) > 1)
    RETURNING id, email, name, role
  ),
  audit AS (
    INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata)
    SELECT ?, ?, 'user.role_updated', 'user', ?, ? FROM updated
  )
  SELECT id, email, name, role FROM updated
`;

export function assertAdmin(actor: AuthenticatedActor) {
  if (actor.role !== "admin") throw new AdminUserAuthorizationError("Only administrators can manage user roles.");
}

export function assertRoleChangeIsSafe(actor: AuthenticatedActor, target: Pick<AdminUser, "id" | "role">, role: ManageableRole) {
  if (target.role === "admin" && role !== "admin" && target.id === actor.id) throw new AdminUserValidationError("Administrators cannot remove their own administrator role.");
}

class DrizzleAdminUserRepository implements AdminUserRepository {
  async list() {
    return getDb().select({ id: users.id, email: users.email, name: users.name, role: users.role }).from(users).orderBy(users.email);
  }

  async updateRole(actorId: string, userId: string, role: ManageableRole) {
    const db = getDb();
    const [target] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!target) throw new AdminUserNotFoundError("User not found.");
    assertRoleChangeIsSafe({ id: actorId, role: "admin" }, target, role);

    // A single Neon HTTP statement atomically locks admin rows, conditionally updates, and writes its audit entry.
    const result = await db.execute<AdminUser>(sql`
      WITH locked_admins AS MATERIALIZED (
        SELECT id FROM users WHERE role = 'admin' FOR UPDATE
      ),
      updated AS (
        UPDATE users
        SET role = ${role}, updated_at = NOW()
        WHERE id = ${userId}
          AND (role <> 'admin' OR ${role} = 'admin' OR (SELECT count(*) FROM locked_admins) > 1)
        RETURNING id, email, name, role
      ),
      audit AS (
        INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata)
        SELECT ${crypto.randomUUID()}, ${actorId}, 'user.role_updated', 'user', ${userId}, ${JSON.stringify({ previousRole: target.role, role })} FROM updated
      )
      SELECT id, email, name, role FROM updated
    `);
    const user = result.rows[0];
    if (!user) throw new AdminUserValidationError("At least one administrator must remain.");
    return user;
  }
}

export function getAdminUserRepository(): AdminUserRepository {
  if (!hasDatabaseUrl()) throw new AdminUserPersistenceUnavailableError("Database persistence is not configured.");
  return new DrizzleAdminUserRepository();
}

export async function listAdminUsers(actor: AuthenticatedActor, repository = getAdminUserRepository()) {
  assertAdmin(actor);
  return repository.list();
}

export async function updateAdminUserRole(actor: AuthenticatedActor, userId: string, role: ManageableRole, repository = getAdminUserRepository()) {
  assertAdmin(actor);
  return repository.updateRole(actor.id, userId, role);
}
