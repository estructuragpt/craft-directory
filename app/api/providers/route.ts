import { NextResponse } from "next/server";
import { validateProviderCreate } from "../../../src/lib/directory";
import { getCurrentActor } from "../../../src/server/auth";
import { PersistenceUnavailableError, ProviderAuthorizationError, getProviderRepository } from "../../../src/server/provider-service";

function errorResponse(error: unknown) {
  if (error instanceof PersistenceUnavailableError) return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });
  if (error instanceof ProviderAuthorizationError) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  return NextResponse.json({ error: "Unable to process provider request." }, { status: 500 });
}

export async function GET() {
  try { return NextResponse.json(await getProviderRepository().list()); } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  const input = validateProviderCreate(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "A complete provider listing is required." }, { status: 400 });
  let repository; try { repository = getProviderRepository(); } catch (error) { return errorResponse(error); }
  const actor = await getCurrentActor();
  if (!actor) return NextResponse.json({ error: "Production authentication is not configured." }, { status: 401 });
  try { return NextResponse.json(await repository.create(actor, input), { status: 201 }); } catch (error) { return errorResponse(error); }
}
