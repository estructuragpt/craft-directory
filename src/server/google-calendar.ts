import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const FREE_BUSY_SCOPE = "https://www.googleapis.com/auth/calendar.freebusy";

export type CalendarConfigurationErrorCode =
  | "client_id_missing"
  | "client_secret_missing"
  | "state_secret_missing"
  | "encryption_key_missing"
  | "encryption_key_invalid";

export class CalendarConfigurationError extends Error {
  constructor(readonly code: CalendarConfigurationErrorCode) {
    super("Google Calendar configuration is invalid.");
    this.name = "CalendarConfigurationError";
  }
}
export class CalendarConnectionError extends Error {}
export class CalendarProviderError extends Error { constructor(message: string, readonly status?: number) { super(message); } }

const configurationCodes = {
  GOOGLE_CALENDAR_CLIENT_ID: "client_id_missing",
  GOOGLE_CALENDAR_CLIENT_SECRET: "client_secret_missing",
  GOOGLE_CALENDAR_STATE_SECRET: "state_secret_missing",
  GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY: "encryption_key_missing",
} as const satisfies Record<string, CalendarConfigurationErrorCode>;

function required(name: keyof typeof configurationCodes) {
  const value = process.env[name];
  if (!value) throw new CalendarConfigurationError(configurationCodes[name]);
  return value;
}
export function isGoogleCalendarConfigured() {
  return Boolean(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_SECRET && process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY && process.env.GOOGLE_CALENDAR_STATE_SECRET);
}
function key() {
  const encoded = required("GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
    throw new CalendarConfigurationError("encryption_key_invalid");
  }
  const value = Buffer.from(encoded, "base64");
  if (value.length !== 32) throw new CalendarConfigurationError("encryption_key_invalid");
  return value;
}
export function encryptRefreshToken(token: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}
export function decryptRefreshToken(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new CalendarConnectionError("Stored calendar credential is invalid.");
  try { const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivValue, "base64url")); decipher.setAuthTag(Buffer.from(tagValue, "base64url")); return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8"); } catch { throw new CalendarConnectionError("Stored calendar credential cannot be decrypted."); }
}
export type OAuthState = { providerId: string; userId: string; nonce: string; exp: number };
export function signOAuthState(state: OAuthState) { const encoded = Buffer.from(JSON.stringify(state)).toString("base64url"); const signature = createHmac("sha256", required("GOOGLE_CALENDAR_STATE_SECRET")).update(encoded).digest("base64url"); return `${encoded}.${signature}`; }
export function verifyOAuthState(value: string): OAuthState | null { const [encoded, signature] = value.split("."); if (!encoded || !signature || value.split(".").length !== 2) return null; const expected = createHmac("sha256", required("GOOGLE_CALENDAR_STATE_SECRET")).update(encoded).digest(); const actual = Buffer.from(signature, "base64url"); if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null; try { const state = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthState; return typeof state.providerId === "string" && typeof state.userId === "string" && typeof state.nonce === "string" && Number.isFinite(state.exp) && state.exp > Date.now() && state.providerId.length > 0 && state.userId.length > 0 && state.nonce.length >= 16 ? state : null; } catch { return null; } }
export function deterministicGoogleEventId(appointmentId: string) { return createHash("sha256").update(appointmentId).digest("hex"); }
export function createGoogleAuthorizationUrl(state: string, redirectUri: string) { const url = new URL(GOOGLE_AUTH_URL); url.search = new URLSearchParams({ client_id: required("GOOGLE_CALENDAR_CLIENT_ID"), redirect_uri: redirectUri, response_type: "code", access_type: "offline", prompt: "consent", include_granted_scopes: "true", scope: `${FREE_BUSY_SCOPE} ${CALENDAR_SCOPE}`, state }).toString(); return url.toString(); }
export async function exchangeAuthorizationCode(code: string, redirectUri: string) { const response = await fetch(GOOGLE_TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: required("GOOGLE_CALENDAR_CLIENT_ID"), client_secret: required("GOOGLE_CALENDAR_CLIENT_SECRET"), redirect_uri: redirectUri, grant_type: "authorization_code" }) }); const body = await response.json().catch(() => null) as { refresh_token?: string; scope?: string } | null; if (!response.ok || !body?.refresh_token) throw new CalendarProviderError("Google did not return a refresh token. Reconnect and grant calendar access."); return { refreshToken: body.refresh_token, scope: body.scope ?? `${FREE_BUSY_SCOPE} ${CALENDAR_SCOPE}` }; }
export async function getGoogleAccessToken(refreshToken: string) { const response = await fetch(GOOGLE_TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: required("GOOGLE_CALENDAR_CLIENT_ID"), client_secret: required("GOOGLE_CALENDAR_CLIENT_SECRET"), refresh_token: refreshToken, grant_type: "refresh_token" }) }); const body = await response.json().catch(() => null) as { access_token?: string } | null; if (!response.ok || !body?.access_token) throw new CalendarProviderError("Google calendar authorization failed. Reconnect the calendar."); return body.access_token; }
export async function googleCalendarRequest(accessToken: string, path: string, init: RequestInit = {}) { const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, { ...init, headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json", ...init.headers } }); if (!response.ok) throw new CalendarProviderError("Google Calendar request failed. Reconnect the calendar or try again.", response.status); return response; }
