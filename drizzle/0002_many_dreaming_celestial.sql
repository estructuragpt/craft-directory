CREATE TABLE "provider_calendar_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"calendar_id" text DEFAULT 'primary' NOT NULL,
	"encrypted_refresh_token" text NOT NULL,
	"scope" text NOT NULL,
	"sync_token" text,
	"channel_id" text,
	"channel_token" text,
	"channel_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_calendar_connections_provider_id_unique" UNIQUE("provider_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "external_calendar_event_id" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "external_calendar_event_url" text;--> statement-breakpoint
ALTER TABLE "provider_calendar_connections" ADD CONSTRAINT "provider_calendar_connections_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_calendar_connections" ADD CONSTRAINT "provider_calendar_connections_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;