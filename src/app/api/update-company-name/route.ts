import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { locationId, companyName } = await request.json()

    if (!locationId || !companyName) {
      return NextResponse.json(
        { error: 'Location ID and company name are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('users')
      .update({ company_name: companyName })
      .eq('location_id', locationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating company name:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update company name' },
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
      .from('users')
      .select('company_name')
      .eq('location_id', locationId)
      .single()

    if (error) throw error

    return NextResponse.json({ companyName: data?.company_name || null })
  } catch (error: any) {
    console.error('Error fetching company name:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company name' },
      { status: 500 }
    )
  }
}
