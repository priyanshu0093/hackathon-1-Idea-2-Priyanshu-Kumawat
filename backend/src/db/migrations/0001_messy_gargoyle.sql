CREATE TABLE "external_bookings" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"booking_reference" varchar(32) NOT NULL,
	"airline" varchar(128) NOT NULL,
	"flight_number" varchar(32),
	"origin" varchar(10) NOT NULL,
	"destination" varchar(10) NOT NULL,
	"departure_date" varchar(32) NOT NULL,
	"return_date" varchar(32),
	"cabin" varchar(32) DEFAULT 'economy',
	"points_redeemed" integer DEFAULT 0,
	"taxes_paid" numeric(10, 2) DEFAULT '0',
	"cash_saved_estimate" numeric(10, 2) DEFAULT '0',
	"status" varchar(32) DEFAULT 'confirmed',
	"is_verified_confirmation" boolean DEFAULT false,
	"record_source" varchar(64) DEFAULT 'user_entered_external',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_balances" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"program" varchar(128) NOT NULL,
	"program_type" varchar(32) DEFAULT 'airline',
	"balance" integer DEFAULT 0 NOT NULL,
	"currency_name" varchar(64) DEFAULT 'points',
	"source" varchar(32) DEFAULT 'manual_entry',
	"notes" text,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_forecasts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"monthly_spend" numeric(10, 2) NOT NULL,
	"reward_program" varchar(128) NOT NULL,
	"earning_rate" numeric(5, 2) DEFAULT '1.5',
	"target_destination" varchar(10),
	"target_points" integer,
	"travel_date" varchar(32),
	"assumptions" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "saved_trips" ADD COLUMN "user_id" varchar(64);