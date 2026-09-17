CREATE TABLE "calendar_oauth_states" (
	"nonce" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_calendar_connections" DROP CONSTRAINT "provider_calendar_connections_provider_id_provider_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "provider_calendar_connections" DROP CONSTRAINT "provider_calendar_connections_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "calendar_oauth_states" ADD CONSTRAINT "calendar_oauth_states_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_oauth_states" ADD CONSTRAINT "calendar_oauth_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_calendar_connections" ADD CONSTRAINT "provider_calendar_connections_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_calendar_connections" ADD CONSTRAINT "provider_calendar_connections_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;