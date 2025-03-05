import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST() {
  try {
    // Add summary column if it doesn't exist using raw SQL
    const { error } = await supabase
      .from('company_data')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      // Table doesn't exist, create it
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS company_data (
          id SERIAL PRIMARY KEY,
          location_id TEXT NOT NULL,
          business_type TEXT,
          industry TEXT,
          target_audience TEXT,
          company_description TEXT,
          brand_voice TEXT,
          key_products TEXT[],
          competitors TEXT[],
          summary TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
        );
      `)
    } else {
      // Table exists, add summary column if it doesn't exist
      await supabase.query(`
        ALTER TABLE company_data 
        ADD COLUMN IF NOT EXISTS summary TEXT;
      `)
    }

    return NextResponse.json({ message: 'Database setup completed successfully' })
  } catch (error: any) {
    console.error('Error setting up database:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set up database' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'src', 'app', 'api', 'setup-db', 'chat-history.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.from('chat_history').select('id').limit(1);
    
    if (error?.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: setupError } = await supabase.rpc('exec_sql', { sql });
      
      if (setupError) {
        console.error('Error setting up chat_history table:', setupError);
        return NextResponse.json({ error: setupError.message }, { status: 500 });
      }
      
      return NextResponse.json({ message: 'Chat history table created successfully' });
    }
    
    return NextResponse.json({ message: 'Chat history table already exists' });

  } catch (error: any) {
    console.error('Error in setup-db:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to setup database' },
      { status: 500 }
    );
  }
}
