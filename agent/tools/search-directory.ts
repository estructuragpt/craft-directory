import { defineTool } from "eve/tools";
import { z } from "zod";
import { filterProviders, providers } from "../../src/lib/directory";
export default defineTool({ description: "Search the local provider directory by text, category, and location.", inputSchema: z.object({ query: z.string().optional(), category: z.string().optional(), location: z.string().optional() }), async execute(input) { return filterProviders(providers, input); } });
