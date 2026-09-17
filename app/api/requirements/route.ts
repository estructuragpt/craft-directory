import { NextResponse } from "next/server";
import { validateRequirementCreate } from "../../../src/lib/workspace";
import { getCurrentActor } from "../../../src/server/auth";
import { WorkspaceAuthorizationError, WorkspacePersistenceUnavailableError, WorkspaceValidationError, getWorkspaceRepository } from "../../../src/server/workspace-service";

function errorResponse(error: unknown) {
  if (error instanceof WorkspacePersistenceUnavailableError) return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });
  if (error instanceof WorkspaceAuthorizationError) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (error instanceof WorkspaceValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: "Unable to process requirement request." }, { status: 500 });
}
async function actorOrUnauthorized() { return getCurrentActor(); }

export async function GET() {
  const actor = await actorOrUnauthorized();
  if (!actor) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  try { return NextResponse.json(await getWorkspaceRepository().listRequirements(actor)); } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  const input = validateRequirementCreate(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "A title and project details are required." }, { status: 400 });
  const actor = await actorOrUnauthorized();
  if (!actor) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  try { return NextResponse.json(await getWorkspaceRepository().createRequirement(actor, input), { status: 201 }); } catch (error) { return errorResponse(error); }
}