-- Migration: Fix organizations_registry table schema
-- Date: 2026-01-05
-- Description: Add missing columns and fix column names for organization registration

-- Add missing columns to organizations_registry table
ALTER TABLE organizations_registry 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

ALTER TABLE organizations_registry 
ADD COLUMN IF NOT EXISTS licence_key VARCHAR(100);

ALTER TABLE organizations_registry 
ADD COLUMN IF NOT EXISTS admin_password VARCHAR(255);

ALTER TABLE organizations_registry 
ADD COLUMN IF NOT EXISTS join_code VARCHAR(20) UNIQUE;

ALTER TABLE organizations_registry 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE organizations_registry 
ADD COLUMN IF NOT EXISTS state_province VARCHAR(100);

ALTER TABLE organizations_registry 
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);

-- Copy data from organization_name to name if organization_name exists and name is empty
UPDATE organizations_registry 
SET name = organization_name 
WHERE name IS NULL AND organization_name IS NOT NULL;

-- Create index on join_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_join_code ON organizations_registry(join_code);

-- Create index on licence_key
CREATE INDEX IF NOT EXISTS idx_org_licence_key ON organizations_registry(licence_key);
