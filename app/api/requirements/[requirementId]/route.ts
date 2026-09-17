import { NextResponse } from "next/server";
import { validateRequirementClientPatch, validateRequirementStatus } from "../../../../src/lib/workspace";
import { getCurrentActor } from "../../../../src/server/auth";
import { WorkspaceAuthorizationError, WorkspaceNotFoundError, WorkspacePersistenceUnavailableError, WorkspaceValidationError, getWorkspaceRepository } from "../../../../src/server/workspace-service";

function errorResponse(error: unknown) {
  if (error instanceof WorkspacePersistenceUnavailableError) return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });
  if (error instanceof WorkspaceAuthorizationError) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (error instanceof WorkspaceNotFoundError) return NextResponse.json({ error: "Requirement not found." }, { status: 404 });
  if (error instanceof WorkspaceValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: "Unable to update requirement." }, { status: 500 });
}
export async function PATCH(request: Request, { params }: { params: Promise<{ requirementId: string }> }) {
  const body: unknown = await request.json().catch(() => null);
  const patch = validateRequirementClientPatch(body); const status = validateRequirementStatus(body);
  if (!patch && !status) return NextResponse.json({ error: "A valid requirement update is required." }, { status: 400 });
  const actor = await getCurrentActor();
  if (!actor) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  try { await getWorkspaceRepository().updateRequirement(actor, (await params).requirementId, patch ?? {}, status ?? undefined); return new NextResponse(null, { status: 204 }); } catch (error) { return errorResponse(error); }
}