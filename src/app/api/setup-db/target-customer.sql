-- Create target_customer table
CREATE TABLE IF NOT EXISTS public.target_customer (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  location_id TEXT NOT NULL,
  name TEXT NULL,
  age INTEGER NULL,
  position TEXT NULL,
  company_size TEXT NULL,
  industry TEXT NULL,
  goals TEXT[] NULL,
  challenges TEXT[] NULL,
  interests TEXT[] NULL,
  preferred_channels TEXT[] NULL,
  decision_factors TEXT[] NULL,
  budget_range TEXT NULL,
  profile_image_url TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT target_customer_location_id_fkey
    FOREIGN KEY(location_id)
    REFERENCES users(location_id)
);

-- Add any missing columns to target_customer table
DO $$ 
DECLARE
  required_columns text[] := ARRAY[
    'name',
    'age',
    'position',
    'company_size',
    'industry',
    'goals',
    'challenges',
    'interests',
    'preferred_channels',
    'decision_factors',
    'budget_range',
    'profile_image_url',
    'profile_description'
  ];
  col text;
BEGIN 
  FOREACH col IN ARRAY required_columns LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'target_customer' 
      AND column_name = col
    ) THEN
      EXECUTE format('ALTER TABLE public.target_customer ADD COLUMN %I text%s NULL',
        col,
        CASE 
          WHEN col = 'age' THEN '::integer'
          WHEN col IN ('goals', 'challenges', 'interests', 'preferred_channels', 'decision_factors') THEN '[]'
          ELSE ''
        END
      );
    END IF;
  END LOOP;
END $$;

-- Create index for faster lookups by location_id
CREATE INDEX IF NOT EXISTS target_customer_location_id_idx ON public.target_customer USING BTREE (location_id);

-- Add comment to table
COMMENT ON TABLE public.target_customer IS 'Stores target customer profiles for each business location';
