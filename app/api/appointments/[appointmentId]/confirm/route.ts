import { NextResponse } from "next/server";
import { getCurrentActor } from "../../../../../src/server/auth";
import { CalendarAuthorizationError, CalendarAvailabilityError, confirmAppointmentWithCalendar } from "../../../../../src/server/calendar-service";
import { CalendarConfigurationError, CalendarConnectionError, CalendarProviderError, isGoogleCalendarConfigured } from "../../../../../src/server/google-calendar";

export async function POST(request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const body = await request.json().catch(() => null) as { createMeet?: unknown } | null;
  if (body && typeof body !== "object") return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  if (body?.createMeet !== undefined && typeof body.createMeet !== "boolean") return NextResponse.json({ error: "createMeet must be a boolean." }, { status: 400 });
  const actor = await getCurrentActor();
  if (!actor) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  if (actor.role !== "provider" && actor.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (!isGoogleCalendarConfigured()) return NextResponse.json({ error: "Google Calendar is not configured." }, { status: 503 });
  try {
    const event = await confirmAppointmentWithCalendar(actor, (await params).appointmentId, body?.createMeet === true);
    return NextResponse.json({ status: "confirmed", calendar: event, emailDelivery: "not-configured" });
  } catch (error) {
    if (error instanceof CalendarAuthorizationError) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if (error instanceof CalendarConnectionError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof CalendarAvailabilityError) return NextResponse.json({ error: error.message }, { status: error.message === "Appointment not found." ? 404 : 409 });
    if (error instanceof CalendarConfigurationError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (error instanceof CalendarProviderError) return NextResponse.json({ error: "Google Calendar could not create the event. Try again or reconnect the calendar." }, { status: 502 });
    return NextResponse.json({ error: "Unable to confirm the appointment." }, { status: 500 });
  }
}
