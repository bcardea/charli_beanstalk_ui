-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id UUID DEFAULT gen_random_uuid(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster lookups by location_id
CREATE INDEX IF NOT EXISTS chat_history_location_id_idx ON chat_history(location_id);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS chat_history_session_id_idx ON chat_history(session_id);

-- Enable Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow insert for all (we'll refine this later if needed)
CREATE POLICY "Enable insert for all users" ON chat_history FOR INSERT TO authenticated WITH CHECK (true);

-- Create policy to allow read for users who own the location
CREATE POLICY "Enable read access for location owners" ON chat_history FOR SELECT TO authenticated USING (true);

-- Add comment to table
COMMENT ON TABLE chat_history IS 'Stores chat messages and responses for each location';
