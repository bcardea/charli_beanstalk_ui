-- Create target_market table
CREATE TABLE IF NOT EXISTS target_market (
  id SERIAL PRIMARY KEY,
  location_id TEXT NOT NULL,
  demographics TEXT,
  psychographics TEXT,
  pain_points TEXT,
  buying_behavior TEXT,
  market_size TEXT,
  growth_potential TEXT,
  geographic_focus TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT fk_location
    FOREIGN KEY(location_id)
    REFERENCES users(location_id)
    ON DELETE CASCADE
);

-- Create index for faster lookups by location_id
CREATE INDEX IF NOT EXISTS target_market_location_id_idx ON target_market(location_id);

-- Enable Row Level Security
ALTER TABLE target_market ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY target_market_select ON target_market
  FOR SELECT
  USING (location_id IN (
    SELECT location_id FROM users WHERE auth.uid() = users.auth_id
  ));

-- Insert policy
CREATE POLICY target_market_insert ON target_market
  FOR INSERT
  WITH CHECK (location_id IN (
    SELECT location_id FROM users WHERE auth.uid() = users.auth_id
  ));

-- Update policy
CREATE POLICY target_market_update ON target_market
  FOR UPDATE
  USING (location_id IN (
    SELECT location_id FROM users WHERE auth.uid() = users.auth_id
  ));

-- Delete policy
CREATE POLICY target_market_delete ON target_market
  FOR DELETE
  USING (location_id IN (
    SELECT location_id FROM users WHERE auth.uid() = users.auth_id
  ));

-- Add comment to table
COMMENT ON TABLE target_market IS 'Stores target market information for each business location';
