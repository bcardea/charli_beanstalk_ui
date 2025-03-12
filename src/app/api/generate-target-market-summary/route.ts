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

    // Fetch target market data
    const { data: targetMarketData, error: fetchError } = await supabase
      .from('target_market')
      .select('*')
      .eq('location_id', locationId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (!targetMarketData) {
      return NextResponse.json(
        { error: 'No target market data found' },
        { status: 404 }
      )
    }

    // Fetch company name
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

    // Define schema for structured output
    const schema = {
      type: "object",
      properties: {
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["h1", "h2", "h3", "paragraph", "list"] },
                    text: { type: "string" },
                    items: { 
                      type: "array",
                      items: { type: "string" }
                    }
                  },
                  required: ["type", "text"]
                }
              }
            },
            required: ["title", "content"]
          }
        }
      },
      required: ["sections"]
    }

    // Generate summary using Gemini
    const response = await fetch(`${protocol}://${host}/api/generate-structured-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer: `
          ${companyName ? `Company Name: ${companyName}` : ''}
          Demographics: ${targetMarketData.demographics}
          Psychographics: ${targetMarketData.psychographics}
          Pain Points: ${targetMarketData.pain_points}
          Buying Behavior: ${targetMarketData.buying_behavior}
          Market Size: ${targetMarketData.market_size}
          Growth Potential: ${targetMarketData.growth_potential}
          Geographic Focus: ${targetMarketData.geographic_focus}
        `,
        question: `Using the gemini-2.0-pro-exp-02-05 model, create a detailed target market profile${companyName ? ` for ${companyName}` : ''} that will serve as rich context for marketing strategy. The profile must be structured in exactly four sections with proper formatting:

1. Ideal Customer Profile
- Create a vivid portrait of the ideal customer, including demographics, psychographics, values, and lifestyle
- Use specific details and statistics where possible
- Format this with a main heading and supporting paragraphs

2. Customer Needs & Pain Points
- Analyze the specific problems and needs this market faces
- Explain how the business can address these needs
- Format with subheadings and bullet points for key pain points

3. Market Opportunity
- Assess the market size, growth potential, and geographic considerations
- Include specific numbers and trends where possible
- Use clear headings and structured paragraphs

4. Targeting Strategy
- Provide strategic recommendations for reaching and engaging this market
- Include specific channels and approaches
- Format with clear action items and recommendations

Each section should use proper formatting with headings and structured content. ${companyName ? `Use the name "${companyName}" naturally throughout the text.` : ''}`,
        schema
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate summary')
    }

    const data = await response.json()
    
    // Validate the response structure before saving
    if (!data.enhancedAnswer || !data.enhancedAnswer.sections || !Array.isArray(data.enhancedAnswer.sections)) {
      throw new Error('Invalid summary format received from AI')
    }

    try {
      // Test that we can stringify and parse the response
      const testJson = JSON.stringify(data.enhancedAnswer)
      JSON.parse(testJson) // This will throw if invalid

      // Save the validated and stringified summary back to the database
      const { error: updateError } = await supabase
        .from('target_market')
        .update({ 
          summary: testJson,
          updated_at: new Date().toISOString()
        })
        .eq('location_id', locationId)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({ summary: data.enhancedAnswer })
    } catch (parseError) {
      console.error('Error validating summary JSON:', parseError)
      throw new Error('Failed to validate summary format')
    }
  } catch (error: any) {
    console.error('Error generating target market summary:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
