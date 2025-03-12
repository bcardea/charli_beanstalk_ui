import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Ensure all fields are properly formatted for database
function sanitizeData(data: any) {
  const sanitized = { ...data }
  
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      // For string fields, just trim
      sanitized[key] = sanitized[key].trim()
    } else if (sanitized[key] === undefined || sanitized[key] === '') {
      sanitized[key] = null
    }
  })

  return sanitized
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.location_id) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    // Sanitize the data before saving
    const sanitizedData = sanitizeData(data)

    // First check if record exists
    const { data: existingData, error: fetchError } = await supabase
      .from('target_market')
      .select('*')
      .eq('location_id', sanitizedData.location_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    let result
    if (existingData) {
      // Update existing record
      result = await supabase
        .from('target_market')
        .update(sanitizedData)
        .eq('location_id', sanitizedData.location_id)
    } else {
      // Insert new record
      result = await supabase
        .from('target_market')
        .insert([sanitizedData])
    }

    if (result.error) {
      console.error('Database operation error:', result.error)
      throw result.error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving target market data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save data' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const locationId = url.searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('target_market')
      .select('*')
      .eq('location_id', locationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json(data || {})
  } catch (error: any) {
    console.error('Error fetching target market data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
