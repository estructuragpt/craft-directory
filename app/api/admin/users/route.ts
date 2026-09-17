import { NextResponse } from "next/server";
import { validateManageableRole } from "../../../../src/lib/admin-users";
import { getCurrentActor } from "../../../../src/server/auth";
import { AdminUserAuthorizationError, AdminUserNotFoundError, AdminUserPersistenceUnavailableError, AdminUserValidationError, listAdminUsers, updateAdminUserRole } from "../../../../src/server/admin-user-service";

function errorResponse(error: unknown) {
  if (error instanceof AdminUserAuthorizationError) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (error instanceof AdminUserValidationError) return NextResponse.json({ error: error.message }, { status: 409 });
  if (error instanceof AdminUserNotFoundError) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (error instanceof AdminUserPersistenceUnavailableError) return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });
  return NextResponse.json({ error: "Unable to manage users." }, { status: 500 });
}

async function adminActorOrResponse() {
  const actor = await getCurrentActor();
  if (!actor) return { response: NextResponse.json({ error: "Authentication is required." }, { status: 401 }) };
  if (actor.role !== "admin") return { response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  return { actor };
}

export async function GET() {
  const result = await adminActorOrResponse();
  if ("response" in result) return result.response;
  try { return NextResponse.json(await listAdminUsers(result.actor)); } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as { userId?: unknown; role?: unknown } | null;
  const role = validateManageableRole(body?.role);
  if (!body || typeof body.userId !== "string" || !body.userId || !role) return NextResponse.json({ error: "A user ID and a valid role are required." }, { status: 400 });
  const result = await adminActorOrResponse();
  if ("response" in result) return result.response;
  try { return NextResponse.json(await updateAdminUserRole(result.actor, body.userId, role)); } catch (error) { return errorResponse(error); }
}


