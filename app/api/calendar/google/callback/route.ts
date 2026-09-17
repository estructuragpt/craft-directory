import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentActor } from "../../../../../src/server/auth";
import { getDb } from "../../../../../src/db";
import { calendarOAuthStates, providerCalendarConnections, providerProfiles } from "../../../../../src/db/schema";
import { encryptRefreshToken, exchangeAuthorizationCode, verifyOAuthState } from "../../../../../src/server/google-calendar";
import { logCalendarCallbackFailure, type CalendarCallbackStage } from "../../../../../src/server/calendar-callback-logging";

export async function GET(request: Request) {
  let stage: CalendarCallbackStage = "database";
  try {
    const url = new URL(request.url); const code = url.searchParams.get("code"); const state = url.searchParams.get("state"); const actor = await getCurrentActor();
    stage = "state_validation"; const verified = state ? verifyOAuthState(state) : null;
    if (!actor || !code || !verified || verified.userId !== actor.id || request.headers.get("cookie")?.match(/(?:^|; )google_calendar_oauth=([^;]+)/)?.[1] !== verified.nonce) return NextResponse.json({ error: "The calendar authorization request is invalid or expired." }, { status: 400 });
    stage = "database";
    const db = getDb(); const consumed = await db.delete(calendarOAuthStates).where(and(eq(calendarOAuthStates.nonce, verified.nonce), eq(calendarOAuthStates.providerId, verified.providerId), eq(calendarOAuthStates.userId, actor.id), gt(calendarOAuthStates.expiresAt, new Date()))).returning({ nonce: calendarOAuthStates.nonce });
    if (!consumed.length) return NextResponse.json({ error: "The calendar authorization request is invalid or expired." }, { status: 400 });
    const [provider] = await db.select({ ownerId: providerProfiles.ownerId }).from(providerProfiles).where(eq(providerProfiles.id, verified.providerId)).limit(1); if (!provider || provider.ownerId !== actor.id) return NextResponse.json({ error: "You cannot connect this provider calendar." }, { status: 403 });
    stage = "token_exchange"; const redirectUri = new URL("/api/calendar/google/callback", process.env.BETTER_AUTH_URL).toString(); const token = await exchangeAuthorizationCode(code, redirectUri);
    stage = "encryption"; const encryptedRefreshToken = encryptRefreshToken(token.refreshToken);
    stage = "database"; await db.insert(providerCalendarConnections).values({ id: crypto.randomUUID(), providerId: verified.providerId, ownerId: actor.id, encryptedRefreshToken, scope: token.scope }).onConflictDoUpdate({ target: providerCalendarConnections.providerId, set: { encryptedRefreshToken, scope: token.scope, ownerId: actor.id, updatedAt: new Date() } });
    const response = NextResponse.redirect(new URL("/?calendar=connected", process.env.BETTER_AUTH_URL)); response.cookies.set("google_calendar_oauth", "", { httpOnly: true, path: "/api/calendar/google", maxAge: 0 }); return response;
  } catch (error) { logCalendarCallbackFailure(error, stage); return NextResponse.json({ error: "Google Calendar connection failed. Try again." }, { status: 502 }); }
}
