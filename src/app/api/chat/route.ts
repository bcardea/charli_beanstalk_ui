import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { message, locationId } = await request.json();

    if (!message || !locationId) {
      return NextResponse.json(
        { error: 'Message and location ID are required' },
        { status: 400 }
      );
    }

    // For now, just echo back the message
    // TODO: Implement actual chat functionality
    const response = `You said: ${message}`;

    // Store the message in Supabase
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert([
        {
          location_id: locationId,
          message,
          response,
          created_at: new Date().toISOString()
        }
      ]);

    if (insertError) {
      console.error('Error storing message:', insertError);
      return NextResponse.json(
        { error: 'Failed to store message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error handling chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
