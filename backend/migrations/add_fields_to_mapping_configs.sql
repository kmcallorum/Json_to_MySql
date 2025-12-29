-- Add fields column to mapping_configs table
-- This stores the analyzed fields from the JSON so they can be restored when loading a config

ALTER TABLE mapping_configs
ADD COLUMN IF NOT EXISTS fields JSON AFTER mappings;
