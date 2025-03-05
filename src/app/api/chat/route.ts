import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { message, locationId } = await req.json();

    if (!message || !locationId) {
      console.error('Missing required fields:', { message, locationId });
      return NextResponse.json(
        { error: 'Message and location ID are required' },
        { status: 400 }
      );
    }

    // Create a new session ID for this chat
    const sessionId = crypto.randomUUID();

    // Store the user's message
    const { error: userMsgError } = await supabase
      .from('chat_history')
      .insert([
        {
          location_id: locationId,
          role: 'user',
          content: message,
          session_id: sessionId
        }
      ]);

    if (userMsgError) {
      console.error('Error storing user message:', userMsgError);
    }

    // Forward the message to the webhook using GET
    const params = new URLSearchParams({
      locationId,
      message,
      type: 'chat_message',
      timestamp: new Date().toISOString()
    });

    const webhookUrl = `https://charli.app.n8n.cloud/webhook/bfd6a457-8a76-4be2-9473-719a38fff40c?${params.toString()}`;
    console.log('Sending to webhook:', webhookUrl);

    const webhookResponse = await fetch(webhookUrl);
    console.log('Webhook response status:', webhookResponse.status);

    // Get the webhook response content
    const webhookData = await webhookResponse.json();
    const assistantResponse = webhookData.output || webhookData.message || 'No response received';

    // Store the actual response from the webhook
    const { error: assistantMsgError } = await supabase
      .from('chat_history')
      .insert([
        {
          location_id: locationId,
          role: 'assistant',
          content: assistantResponse,
          session_id: sessionId
        }
      ]);

    if (assistantMsgError) {
      console.error('Error storing assistant message:', assistantMsgError);
    }

    return NextResponse.json({
      message: "Message sent to Charli successfully!",
      response: assistantResponse,
      sessionId
    });

  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process message' },
      { status: 500 }
    );
  }
}
