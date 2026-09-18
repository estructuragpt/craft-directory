export const supportedLocales = ["en", "es"] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = "en";

export const routeMap = {
  home: { internal: "home", en: "", es: "" },
  directory: { internal: "directory", en: "directory", es: "directorio" },
  provider: { internal: "provider", en: "providers", es: "proveedores" },
  requirements: { internal: "requirements", en: "requirements", es: "requerimientos" },
  appointments: { internal: "appointments", en: "appointments", es: "citas" },
  auth: { internal: "auth", en: "sign-in", es: "iniciar-sesion" },
  admin: { internal: "admin", en: "admin", es: "administracion" },
} as const;
export type RouteKey = keyof typeof routeMap;

const catalogs = {
  en: {
    navigation: { directory: "Directory", requirements: "Requirements", appointments: "Appointments", manage: "Manage listing", signIn: "Sign in", signOut: "Sign out" },
    hero: { eyebrow: "LOCAL PROS, BETTER PROJECTS", title: "Find the right people\nfor your home.", description: "Explore trusted professionals, organize your project brief, and request a conversation—without leaving the plan." },
    search: { query: "What are you planning?", category: "All categories", location: "All locations", submit: "Search professionals", result: "professionals to explore", curated: "Curated for project fit" },
    assistant: { eyebrow: "EVE-READY ASSISTANT", title: "Project concierge", placeholder: "Try: find landscape pros in Austin", restore: "Open assistant", minimize: "Minimize", send: "Send message", initial: "Ask me to find a specialist, shape a brief, or open appointments." },
  },
  es: {
    navigation: { directory: "Directorio", requirements: "Requerimientos", appointments: "Citas", manage: "Gestionar anuncio", signIn: "Iniciar sesión", signOut: "Cerrar sesión" },
    hero: { eyebrow: "PROFESIONALES LOCALES, MEJORES PROYECTOS", title: "Encuentra las personas ideales\npara tu hogar.", description: "Explora profesionales confiables, organiza tu proyecto y solicita una conversación sin salir del plan." },
    search: { query: "¿Qué estás planeando?", category: "Todas las categorías", location: "Todas las ubicaciones", submit: "Buscar profesionales", result: "profesionales para explorar", curated: "Seleccionados para tu proyecto" },
    assistant: { eyebrow: "ASISTENTE LISTO PARA EVE", title: "Asistente de proyectos", placeholder: "Prueba: busca profesionales de paisajismo en Austin", restore: "Abrir asistente", minimize: "Minimizar", send: "Enviar mensaje", initial: "Pídeme encontrar un especialista, preparar un resumen o abrir las citas." },
  },
} as const;
export type TranslationKey = "navigation.directory" | "navigation.requirements" | "navigation.appointments" | "navigation.manage" | "navigation.signIn" | "navigation.signOut" | "hero.eyebrow" | "hero.title" | "hero.description" | "search.query" | "search.category" | "search.location" | "search.submit" | "search.result" | "search.curated" | "assistant.eyebrow" | "assistant.title" | "assistant.placeholder" | "assistant.restore" | "assistant.minimize" | "assistant.send" | "assistant.initial";

export function isLocale(value: string | undefined | null): value is Locale { return !!value && (supportedLocales as readonly string[]).includes(value); }
export function getLocaleFromPathname(pathname: string): Locale | null { const value = pathname.split("/")[1]; return isLocale(value) ? value : null; }
export function getPreferredLocale(acceptLanguage?: string | null): Locale {
  const languages = (acceptLanguage ?? "").toLowerCase().split(",").map((part) => part.trim().split(";")[0]);
  return languages.some((value) => value === "es" || value.startsWith("es-")) ? "es" : defaultLocale;
}
export function localizedPath(route: RouteKey, locale: Locale, suffix = ""): string { const segment = routeMap[route][locale]; return `/${locale}${segment ? `/${segment}` : ""}${suffix ? `/${suffix.replace(/^\//, "")}` : ""}`; }

export function translate(locale: Locale, key: TranslationKey): string {
  const [group, name] = key.split(".") as [keyof typeof catalogs.en, string];
  return (catalogs[locale][group] as Record<string, string>)[name] ?? (catalogs.en[group] as Record<string, string>)[name] ?? key;
}
export function catalog(locale: Locale) { return catalogs[locale]; }
