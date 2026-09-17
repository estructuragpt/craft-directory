import { canManageProvider } from "./permissions";

export type Role = "visitor" | "client" | "provider" | "admin";
export type Provider = { id: string; name: string; category: string; location: string; rating: number; reviews: number; image: string; description: string; services: string[]; ownerId: string };
export type ProviderFilters = { query?: string; category?: string; location?: string };

export const providers: Provider[] = [
  { id: "green-horizon", name: "Green Horizon Studio", category: "Landscape", location: "Austin", rating: 4.9, reviews: 128, image: "https://images.unsplash.com/photo-1558521958-0a228e77e984?auto=format&fit=crop&w=900&q=80", description: "Sustainable gardens and outdoor rooms designed for everyday living.", services: ["Garden design", "Outdoor kitchens", "Planting plans"], ownerId: "green-horizon" },
  { id: "northline", name: "Northline Interiors", category: "Interior Design", location: "Chicago", rating: 4.8, reviews: 84, image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80", description: "Warm, considered interiors with a practical point of view.", services: ["Full-service design", "Renovation", "Styling"], ownerId: "northline" },
  { id: "civic-build", name: "Civic Build Co.", category: "General Contractor", location: "Denver", rating: 4.7, reviews: 61, image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80", description: "A transparent construction partner from first sketch to handover.", services: ["Remodeling", "Additions", "Project management"], ownerId: "civic-build" }
];

const includes = (value: string, term?: string) => !term || value.toLowerCase().includes(term.toLowerCase());
export function filterProviders(items: Provider[], filters: ProviderFilters): Provider[] {
  return items.filter((provider) => includes(`${provider.name} ${provider.description} ${provider.services.join(" ")}`, filters.query) && includes(provider.category, filters.category) && includes(provider.location, filters.location));
}

export function createProvider(input: Omit<Provider, "id" | "rating" | "reviews">): Provider {
  return { ...input, id: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), rating: 5, reviews: 0 };
}

export type ProviderPatch = Pick<Provider, "name" | "category" | "location" | "description">;
export type ProviderCreateInput = ProviderPatch;

export function validateProviderPatch(input: unknown): Partial<ProviderPatch> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const patch = input as Partial<ProviderPatch>;
  const fields: (keyof ProviderPatch)[] = ["name", "category", "location", "description"];
  const entries = fields.filter((field) => patch[field] !== undefined).map((field) => [field, typeof patch[field] === "string" ? patch[field]!.trim() : ""]);
  if (!entries.length || entries.some(([, value]) => !value)) return null;
  return Object.fromEntries(entries) as Partial<ProviderPatch>;
}

export function validateProviderCreate(input: unknown): ProviderCreateInput | null {
  const patch = validateProviderPatch(input);
  const fields: (keyof ProviderCreateInput)[] = ["name", "category", "location", "description"];
  if (!patch || !fields.every((field) => typeof patch[field] === "string" && patch[field])) return null;
  return patch as ProviderCreateInput;
}

export function updateProvider(items: Provider[], providerId: string, patch: Partial<ProviderPatch>, role: Role, actorId: string): Provider | null {
  const provider = items.find((item) => item.id === providerId);
  const validPatch = validateProviderPatch(patch);
  if (!provider || !validPatch || !canManageProvider(role, actorId, provider.ownerId)) return null;
  return { ...provider, ...validPatch };
}

export function deleteProvider(items: Provider[], providerId: string, role: Role, actorId: string): Provider[] | null {
  const provider = items.find((item) => item.id === providerId);
  if (!provider || !canManageProvider(role, actorId, provider.ownerId)) return null;
  return items.filter((item) => item.id !== providerId);
}
