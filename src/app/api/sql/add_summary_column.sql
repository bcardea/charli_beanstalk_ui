CREATE OR REPLACE FUNCTION add_summary_column_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'company_data' 
    AND column_name = 'summary'
  ) THEN
    EXECUTE 'ALTER TABLE company_data ADD COLUMN summary TEXT';
  END IF;
END;
$$ LANGUAGE plpgsql;
