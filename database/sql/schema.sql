-- Enable pg_trgm extension for text similarity searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Staging table for raw Kaggle data
CREATE TABLE IF NOT EXISTS stg_recipe_raw (
    id BIGSERIAL PRIMARY KEY,
    payload JSONB NOT NULL,
    loaded_at TIMESTAMPTZ DEFAULT now()
);

-- Index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_stg_payload_gin
ON stg_recipe_raw USING GIN (payload);
