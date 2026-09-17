import { filterProviders, providers, type ProviderFilters, type Role } from "./directory";

export type AssistantResult = { reply: string; filters?: ProviderFilters; open?: "requirements" | "appointments" | "directory" };
export function handleDirectoryCommand(message: string, role: Role): AssistantResult {
  const text = message.toLowerCase();
  if (text.includes("appointment") || text.includes("book")) return { reply: role === "client" || role === "admin" ? "Open appointments to request a consultation." : "Switch to Client or Admin to request appointments.", open: "appointments" };
  if (text.includes("requirement") || text.includes("brief")) return { reply: "I opened the project requirements workspace.", open: "requirements" };
  const category = providers.find((item) => text.includes(item.category.toLowerCase()))?.category;
  const location = providers.find((item) => text.includes(item.location.toLowerCase()))?.location;
  const matches = filterProviders(providers, { category, location, query: category || location ? undefined : message }).length;
  return { reply: `I found ${matches} provider${matches === 1 ? "" : "s"} that may fit.`, filters: { category, location, query: category || location ? undefined : message }, open: "directory" };
}
