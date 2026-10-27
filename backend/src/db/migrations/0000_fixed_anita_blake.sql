CREATE TABLE "saved_trips" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"origin" varchar(10) NOT NULL,
	"destination" varchar(10) NOT NULL,
	"cabin" varchar(32) DEFAULT 'economy' NOT NULL,
	"departure_date" varchar(32),
	"return_date" varchar(32),
	"carrier" varchar(128),
	"cash_price" numeric(10, 2),
	"points_cost" integer,
	"taxes" numeric(10, 2),
	"program" varchar(128),
	"estimated_savings" numeric(10, 2),
	"data_source" varchar(32) DEFAULT 'benchmark',
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
