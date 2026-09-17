import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("client"),
  ...timestamps,
});

export const session = pgTable("session", {
  id: text("id").primaryKey(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"), userAgent: text("user_agent"), userId: text("user_id").notNull().references(() => users.id),
});
export const account = pgTable("account", {
  id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(), userId: text("user_id").notNull().references(() => users.id),
  accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"), accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }), refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }), scope: text("scope"), password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("account_provider_id_account_id_unique").on(table.providerId, table.accountId)]);
export const verification = pgTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const providerProfiles = pgTable("provider_profiles", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  rating: integer("rating").notNull().default(5),
  reviews: integer("reviews").notNull().default(0),
  ...timestamps,
});

export const services = pgTable("services", {
  id: text("id").primaryKey(), providerId: text("provider_id").notNull().references(() => providerProfiles.id),
  name: text("name").notNull(), description: text("description"), ...timestamps,
});
export const portfolioItems = pgTable("portfolio_items", {
  id: text("id").primaryKey(), providerId: text("provider_id").notNull().references(() => providerProfiles.id),
  title: text("title").notNull(), description: text("description"), imageUrl: text("image_url").notNull(), ...timestamps,
});
export const requirements = pgTable("requirements", {
  id: text("id").primaryKey(), clientId: text("client_id").notNull().references(() => users.id),
  providerId: text("provider_id").references(() => providerProfiles.id), title: text("title").notNull(), details: text("details").notNull(), status: text("status").notNull().default("draft"), ...timestamps,
});
export const availability = pgTable("availability", {
  id: text("id").primaryKey(), providerId: text("provider_id").notNull().references(() => providerProfiles.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(), endsAt: timestamp("ends_at", { withTimezone: true }).notNull(), ...timestamps,
});
export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(), clientId: text("client_id").notNull().references(() => users.id), providerId: text("provider_id").notNull().references(() => providerProfiles.id),
  availabilityId: text("availability_id").references(() => availability.id), status: text("status").notNull().default("requested"),
  externalCalendarEventId: text("external_calendar_event_id"), externalCalendarEventUrl: text("external_calendar_event_url"), ...timestamps,
});
export const providerCalendarConnections = pgTable("provider_calendar_connections", {
  id: text("id").primaryKey(), providerId: text("provider_id").notNull().unique().references(() => providerProfiles.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }), calendarId: text("calendar_id").notNull().default("primary"),
  encryptedRefreshToken: text("encrypted_refresh_token").notNull(), scope: text("scope").notNull(),
  syncToken: text("sync_token"), channelId: text("channel_id"), channelToken: text("channel_token"), channelExpiresAt: timestamp("channel_expires_at", { withTimezone: true }), ...timestamps,
});
export const calendarOAuthStates = pgTable("calendar_oauth_states", {
  nonce: text("nonce").primaryKey(), providerId: text("provider_id").notNull().references(() => providerProfiles.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(), actorId: text("actor_id").references(() => users.id), action: text("action").notNull(), entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(), metadata: text("metadata"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(users, { fields: [session.userId], references: [users.id] }),
}));
export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, { fields: [account.userId], references: [users.id] }),
}));
