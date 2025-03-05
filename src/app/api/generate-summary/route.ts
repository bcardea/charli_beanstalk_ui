import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

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

export async function POST(request: Request) {
  try {
    const { locationId } = await request.json()

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    // Get the host from headers
    const headersList = headers()
    const host = headersList.get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

    // Fetch company data
    const { data: companyData, error: fetchError } = await supabase
      .from('company_data')
      .select('*')
      .eq('location_id', locationId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (!companyData) {
      return NextResponse.json(
        { error: 'No company data found' },
        { status: 404 }
      )
    }

    // Fetch company name
    console.log('Fetching company name for location:', locationId)
    
    const { data: userData, error: nameError } = await supabase
      .from('users')
      .select('company_name')
      .eq('location_id', locationId)
      .single()

    if (nameError) {
      console.error('Error fetching company name:', { error: nameError, locationId })
      // Continue without company name
    }

    const companyName = userData?.company_name
    console.log('Company name fetch result:', { 
      locationId, 
      userData, 
      companyName,
      hasName: !!companyName,
      nameType: typeof companyName
    })

    // Define schema for structured output
    const schema = {
      type: "object",
      properties: {
        overview: {
          type: "string",
          description: "Company overview paragraph introducing the company, its core business, industry position, and key differentiators"
        },
        targetMarket: {
          type: "string",
          description: "Detailed paragraph about target audience, their needs, and comprehensive list of products/services with value propositions"
        },
        marketPosition: {
          type: "string",
          description: "Analysis of competitive landscape, key advantages, and market differentiation strategy"
        },
        brandCommunication: {
          type: "string",
          description: "Description of brand voice, company values, culture, and approach to customer relationships"
        }
      },
      required: ["overview", "targetMarket", "marketPosition", "brandCommunication"]
    }

    // Generate summary using Gemini
    const response = await fetch(`${protocol}://${host}/api/generate-structured-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer: `
          ${companyName ? `Company Name: ${companyName}` : ''}
          Business Type: ${companyData.business_type}
          Industry: ${companyData.industry}
          Target Audience: ${companyData.target_audience}
          Company Description: ${companyData.company_description}
          Brand Voice: ${companyData.brand_voice}
          Key Products/Services: ${Array.isArray(companyData.key_products) ? companyData.key_products.join(', ') : companyData.key_products}
          Competitors: ${Array.isArray(companyData.competitors) ? companyData.competitors.join(', ') : companyData.competitors}
        `,
        question: `Using the gemini-2.0-pro-exp-02-05 model, create a detailed company profile${companyName ? ` for ${companyName}` : ''} that will serve as rich context for AI systems. The profile must be structured in exactly four detailed paragraphs, following this specific format:

1. Overview: Introduce ${companyName || 'the company'}, its core business focus, industry position, and key differentiators.
2. Target Market & Services: Detail the target audience, their needs, and provide a comprehensive list of products/services with their unique value propositions.
3. Market Position: Analyze the competitive landscape, key advantages over competitors, and market differentiation strategy.
4. Brand & Communication: Describe the brand voice, company values, culture, and approach to customer relationships.

Each paragraph must be detailed and thorough, incorporating specific information from the provided data. ${companyName ? `Use the name "${companyName}" naturally 2-3 times throughout the text.` : ''}`,
        schema
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate summary')
    }

    const data = await response.json()
    
    // Combine structured output into final summary
    const summary = `${data.enhancedAnswer.overview}\n\n${data.enhancedAnswer.targetMarket}\n\n${data.enhancedAnswer.marketPosition}\n\n${data.enhancedAnswer.brandCommunication}`

    // Save the summary back to the database
    const { error: updateError } = await supabase
      .from('company_data')
      .update({ summary })
      .eq('location_id', locationId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
