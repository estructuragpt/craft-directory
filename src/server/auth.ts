import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { getDb, hasDatabaseUrl } from "../db";
import { account, accountRelations, session, sessionRelations, users, usersRelations, verification } from "../db/schema";
import type { Role } from "../lib/directory";

export type AuthenticatedActor = { id: string; role: Role };
type SessionUser = { id: string; role?: string | null };
type AuthSession = { user: SessionUser } | null;
const supportedRoles: Role[] = ["visitor", "client", "provider", "admin"];

export function googleSocialProviderConfig(env: { GOOGLE_AUTH_CLIENT_ID?: string; GOOGLE_AUTH_CLIENT_SECRET?: string } = process.env as { GOOGLE_AUTH_CLIENT_ID?: string; GOOGLE_AUTH_CLIENT_SECRET?: string }) {
  const clientId = env.GOOGLE_AUTH_CLIENT_ID;
  const clientSecret = env.GOOGLE_AUTH_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function mapSessionToActor(session: AuthSession): AuthenticatedActor | null {
  if (!session?.user?.id) return null;
  const role = supportedRoles.includes(session.user.role as Role) ? session.user.role as Role : "client";
  return { id: session.user.id, role };
}

export function isProductionAuthConfigured() {
  return Boolean(process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_URL && hasDatabaseUrl());
}

export async function resolveSessionActor(getSession: () => Promise<AuthSession>): Promise<AuthenticatedActor | null> {
  return mapSessionToActor(await getSession());
}

let authInstance: ReturnType<typeof createAuth> | undefined;
function createAuth() {
  const google = googleSocialProviderConfig();
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDb(), { provider: "pg", schema: { user: users, session, account, verification, usersRelations, sessionRelations, accountRelations } }),
    user: {
      additionalFields: {
        role: { type: "string", required: false, defaultValue: "client", input: false },
      },
    },
    emailAndPassword: { enabled: true },
    ...(google ? { socialProviders: { google } } : {}),
  });
}

export function getAuth() {
  if (!isProductionAuthConfigured()) throw new Error("Better Auth is not configured.");
  return authInstance ??= createAuth();
}

export async function getCurrentActor(): Promise<AuthenticatedActor | null> {
  if (!isProductionAuthConfigured()) return null;
  return resolveSessionActor(async () => getAuth().api.getSession({ headers: await headers() }) as Promise<AuthSession>);
}
