import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('target_customer')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return NextResponse.json({ profile: null })
      }
      throw error
    }

    return NextResponse.json({ profile: data })
  } catch (error: any) {
    console.error('Error fetching target customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch target customer' },
      { status: 500 }
    )
  }
}
