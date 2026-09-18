import { filterProviders, providers, type ProviderFilters, type Role } from "./directory";
import type { Locale } from "./i18n";

export type AssistantResult = { reply: string; filters?: ProviderFilters; open?: "requirements" | "appointments" | "directory" };
export function handleDirectoryCommand(message: string, role: Role, locale: Locale = "en"): AssistantResult {
  const text = message.toLowerCase();
  if (text.includes("appointment") || text.includes("book") || text.includes("cita") || text.includes("reserv")) return { reply: locale === "es" ? (role === "client" || role === "admin" ? "Abre las citas para solicitar una consulta." : "Cambia a Cliente o Administrador para solicitar citas.") : role === "client" || role === "admin" ? "Open appointments to request a consultation." : "Switch to Client or Admin to request appointments.", open: "appointments" };
  if (text.includes("requirement") || text.includes("brief") || text.includes("requerimiento") || text.includes("resumen")) return { reply: locale === "es" ? "Abrí el espacio de requerimientos del proyecto." : "I opened the project requirements workspace.", open: "requirements" };
  const category = providers.find((item) => text.includes(item.category.toLowerCase()))?.category;
  const location = providers.find((item) => text.includes(item.location.toLowerCase()))?.location;
  const matches = filterProviders(providers, { category, location, query: category || location ? undefined : message }).length;
  return { reply: locale === "es" ? `Encontré ${matches} profesional${matches === 1 ? "" : "es"} que puede ajustarse.` : `I found ${matches} provider${matches === 1 ? "" : "s"} that may fit.`, filters: { category, location, query: category || location ? undefined : message }, open: "directory" };
}
