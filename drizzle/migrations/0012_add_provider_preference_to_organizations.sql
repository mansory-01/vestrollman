DO $$ BEGIN
 CREATE TYPE "public"."fiat_provider" AS ENUM('monnify', 'flutterwave');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "organizations"
ADD COLUMN IF NOT EXISTS "provider_preference" "fiat_provider" DEFAULT 'monnify' NOT NULL;