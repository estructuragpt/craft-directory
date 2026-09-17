import { NextResponse } from "next/server";
import { validateAppointmentCreate } from "../../../src/lib/workspace";
import { getCurrentActor } from "../../../src/server/auth";
import { WorkspaceAuthorizationError, WorkspacePersistenceUnavailableError, WorkspaceValidationError, getWorkspaceRepository } from "../../../src/server/workspace-service";

function errorResponse(error: unknown) {
  if (error instanceof WorkspacePersistenceUnavailableError) return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });
  if (error instanceof WorkspaceAuthorizationError) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (error instanceof WorkspaceValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: "Unable to process appointment request." }, { status: 500 });
}
export async function GET() {
  const actor = await getCurrentActor();
  if (!actor) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  try { return NextResponse.json(await getWorkspaceRepository().listAppointments(actor)); } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  const input = validateAppointmentCreate(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "A provider is required." }, { status: 400 });
  const actor = await getCurrentActor();
  if (!actor) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  try { return NextResponse.json(await getWorkspaceRepository().createAppointment(actor, input), { status: 201 }); } catch (error) { return errorResponse(error); }
}