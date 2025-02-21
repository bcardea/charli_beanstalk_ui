import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: Request) {
  try {
    const { locationId } = await request.json();

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    // Try to get existing user
    let { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('location_id', locationId)
      .maybeSingle();

    // If user exists, return it
    if (user) {
      return NextResponse.json({ user });
    }

    // If there was an error other than not found, throw it
    if (fetchError && !fetchError.message.includes('not found')) {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Try to create new user with upsert
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .upsert([
        {
          location_id: locationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Error handling user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
