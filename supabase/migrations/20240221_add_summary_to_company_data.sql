-- Add summary column to company_data table
ALTER TABLE company_data
ADD COLUMN IF NOT EXISTS summary TEXT;
