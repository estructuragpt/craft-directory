import { NextResponse } from "next/server";
import { getCurrentActor } from "../../../../../src/server/auth";
import { CalendarAuthorizationError, CalendarAvailabilityError, getProviderAvailability } from "../../../../../src/server/calendar-service";
import { CalendarConfigurationError, CalendarConnectionError, CalendarProviderError } from "../../../../../src/server/google-calendar";
export function availabilityErrorStatus(error: unknown) {
  if (error instanceof CalendarAuthorizationError) return 403;
  if (error instanceof CalendarConfigurationError) return 503;
  if (error instanceof CalendarConnectionError) return 409;
  if (error instanceof CalendarProviderError) return 502;
  if (error instanceof CalendarAvailabilityError) {
    if (error.message === "Provider not found.") return 404;
    if (error.message === "Persistence is not configured." || error.message === "Google Calendar is not configured.") return 503;
    if (error.message.includes("future range")) return 400;
    return 409;
  }
  return 500;
}
export async function GET(request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  const actor = await getCurrentActor(); if (!actor) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  const url = new URL(request.url); try { return NextResponse.json(await getProviderAvailability(actor, (await params).providerId, new Date(url.searchParams.get("timeMin") ?? ""), new Date(url.searchParams.get("timeMax") ?? ""))); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Availability is unavailable." }, { status: availabilityErrorStatus(error) }); }
}
