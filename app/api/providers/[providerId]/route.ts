import { NextResponse } from "next/server";
import { validateProviderPatch } from "../../../../src/lib/directory";
import { getCurrentActor } from "../../../../src/server/auth";
import { PersistenceUnavailableError, ProviderAuthorizationError, ProviderNotFoundError, getProviderRepository } from "../../../../src/server/provider-service";

async function actorOrResponse() {
  const actor = await getCurrentActor();
  return actor;
}

function errorResponse(error: unknown) {
  if (error instanceof PersistenceUnavailableError) return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });
  if (error instanceof ProviderAuthorizationError) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (error instanceof ProviderNotFoundError) return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  return NextResponse.json({ error: "Unable to process provider mutation." }, { status: 500 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  const body: unknown = await request.json().catch(() => null);
  const patch = validateProviderPatch(body);
  if (!patch) return NextResponse.json({ error: "A complete provider patch is required." }, { status: 400 });
  let repository; try { repository = getProviderRepository(); } catch (error) { return errorResponse(error); }
  const actor = await actorOrResponse();
  if (!actor) return NextResponse.json({ error: "Production authentication is not configured." }, { status: 401 });
  try { await repository.update(actor, (await params).providerId, patch); return new NextResponse(null, { status: 204 }); } catch (error) { return errorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ providerId: string }> }) {
  let repository; try { repository = getProviderRepository(); } catch (error) { return errorResponse(error); }
  const actor = await actorOrResponse();
  if (!actor) return NextResponse.json({ error: "Production authentication is not configured." }, { status: 401 });
  try { await repository.delete(actor, (await params).providerId); return new NextResponse(null, { status: 204 }); } catch (error) { return errorResponse(error); }
}
