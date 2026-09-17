import { NextResponse } from "next/server";
import { validateAppointmentStatus } from "../../../../src/lib/workspace";
import { getCurrentActor } from "../../../../src/server/auth";
import { WorkspaceAuthorizationError, WorkspaceNotFoundError, WorkspacePersistenceUnavailableError, WorkspaceValidationError, getWorkspaceRepository } from "../../../../src/server/workspace-service";
import { CalendarAuthorizationError, CalendarAvailabilityError, confirmAppointmentWithCalendar } from "../../../../src/server/calendar-service";
import { CalendarConfigurationError, CalendarConnectionError, CalendarProviderError, isGoogleCalendarConfigured } from "../../../../src/server/google-calendar";

function errorResponse(error: unknown) {
  if (error instanceof WorkspacePersistenceUnavailableError) return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });
  if (error instanceof WorkspaceAuthorizationError) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (error instanceof WorkspaceNotFoundError) return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  if (error instanceof WorkspaceValidationError) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ error: "Unable to update appointment." }, { status: 500 });
}
export async function PATCH(request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const body = await request.json().catch(() => null); const status = validateAppointmentStatus(body);
  if (!status) return NextResponse.json({ error: "A valid appointment status is required." }, { status: 400 });
  const actor = await getCurrentActor();
  if (!actor) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  try { const appointmentId = (await params).appointmentId; if (status === "confirmed" && isGoogleCalendarConfigured()) { const result = await confirmAppointmentWithCalendar(actor, appointmentId, Boolean(body?.createMeet)); return NextResponse.json({ status: "confirmed", calendar: result, emailDelivery: "not-configured" }); } await getWorkspaceRepository().updateAppointment(actor, appointmentId, status); return new NextResponse(null, { status: 204 }); } catch (error) { if (error instanceof CalendarConnectionError) return NextResponse.json({ error: error.message }, { status: 409 }); if (error instanceof CalendarConfigurationError || error instanceof CalendarAvailabilityError) return NextResponse.json({ error: error.message }, { status: 503 }); if (error instanceof CalendarAuthorizationError) return NextResponse.json({ error: "Forbidden." }, { status: 403 }); if (error instanceof CalendarProviderError) return NextResponse.json({ error: error.message }, { status: 502 }); return errorResponse(error); }
}
