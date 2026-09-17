import { toNextJsHandler } from "better-auth/next-js";
import { getAuth, isProductionAuthConfigured } from "../../../../src/server/auth";

async function handle(request: Request, method: "GET" | "POST") {
  if (!isProductionAuthConfigured()) return Response.json({ error: "Authentication is not configured." }, { status: 503 });
  return toNextJsHandler(getAuth())[method](request);
}

export const GET = (request: Request) => handle(request, "GET");
export const POST = (request: Request) => handle(request, "POST");
