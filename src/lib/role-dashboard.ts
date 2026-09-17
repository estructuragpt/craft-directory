import type { Role } from "./directory";

export type RoleDashboard = {
  eyebrow: string;
  title: string;
  summary: string;
  primaryAction: { label: string; view: "directory" | "requirements" | "appointments" | "manage" };
  secondaryAction?: { label: string; view: "directory" | "requirements" | "appointments" | "manage" };
  metrics: Array<{ label: string; value: string; detail: string }>;
  demoNotice: string;
};

const dashboards: Record<Exclude<Role, "visitor">, RoleDashboard> = {
  client: { eyebrow: "CLIENT WORKSPACE", title: "Keep your project brief moving.", summary: "Organize the decisions that help the right professionals understand your project.", primaryAction: { label: "Review project brief", view: "requirements" }, secondaryAction: { label: "Request a consultation", view: "appointments" }, metrics: [{ label: "Saved brief", value: "Kitchen refresh", detail: "Austin · Target start: Spring" }, { label: "Next step", value: "Match with pros", detail: "Share only after production permissions are configured." }], demoNotice: "Brief and consultation information shown here is demo-only; it is not persisted or sent to providers." },
  provider: { eyebrow: "PROVIDER WORKSPACE", title: "Keep your listing ready for the right work.", summary: "Manage the listings your account owns and review the request summary before connecting production inboxes.", primaryAction: { label: "Manage listings", view: "manage" }, metrics: [{ label: "Incoming requests", value: "0", detail: "Demo-only summary; no request inbox is connected." }, { label: "Listing health", value: "Ready to review", detail: "Keep your profile, category, and location current." }], demoNotice: "Incoming-request counts are illustrative only. This app does not persist or deliver customer requests yet." },
  admin: { eyebrow: "ADMIN OVERVIEW", title: "See the health of the directory at a glance.", summary: "Review listing activity and prepare moderation workflows without exposing private account data in the public directory.", primaryAction: { label: "Moderate listings", view: "manage" }, secondaryAction: { label: "Browse public directory", view: "directory" }, metrics: [{ label: "Listings in view", value: "Local snapshot", detail: "Live metrics require a production reporting service." }, { label: "Moderation queue", value: "Not connected", detail: "No approval or takedown workflow is persisted in this demo." }], demoNotice: "Metrics and moderation status are demo-only. Provider CRUD remains server-authorized when production services are configured." },
};

export function canAccessRoleDashboard(role: Role) { return role !== "visitor"; }
export function getRoleDashboard(role: Role): RoleDashboard | null { return role === "visitor" ? null : dashboards[role]; }

