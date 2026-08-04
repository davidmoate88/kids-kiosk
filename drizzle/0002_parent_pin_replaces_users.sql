-- Replaces per-parent email+password login with a single shared PIN.
-- /parents is LAN-only already (no port forwarding, not indexed) — the
-- login exists to keep it out of reach of the kids on the same home
-- network, not to guard against the internet, so a PIN is the right amount
-- of friction. Genuinely a drop+create, not a rename: no column maps
-- cleanly from users (email, password_hash, name) to parent_pin (pin_hash).
DROP TABLE "users";--> statement-breakpoint
CREATE TABLE "parent_pin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pin_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
