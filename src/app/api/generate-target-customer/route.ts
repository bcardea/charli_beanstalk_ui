import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Replicate from 'replicate'

// Initialize the Generative AI client for text generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Initialize Replicate client for image generation
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

// Initialize Supabase client
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
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not configured')
    }

    const { locationId, marketSummary } = await request.json()

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    if (!marketSummary) {
      return NextResponse.json(
        { error: 'Market summary is required' },
        { status: 400 }
      )
    }

    // Schema for the profile generation
    const schema = {
      type: "object",
      properties: {
        profile: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
            position: { type: "string" },
            company_size: { type: "string" },
            industry: { type: "string" },
            goals: {
              type: "array",
              items: { type: "string" }
            },
            challenges: {
              type: "array",
              items: { type: "string" }
            },
            interests: {
              type: "array",
              items: { type: "string" }
            },
            preferred_channels: {
              type: "array",
              items: { type: "string" }
            },
            decision_factors: {
              type: "array",
              items: { type: "string" }
            },
            budget_range: { type: "string" },
            profile_description: { type: "string" }
          },
          required: [
            "name", "age", "position", "company_size", "industry",
            "goals", "challenges", "interests", "preferred_channels",
            "decision_factors", "budget_range", "profile_description"
          ]
        }
      },
      required: ["profile"]
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-pro-exp-02-05',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40,
        responseMimeType: 'application/json'
      }
    })

    // Generate the target customer profile
    const prompt = {
      text: `You are a specialized AI trained to generate detailed target customer profiles in JSON format.

Based on the following target market summary, create a detailed persona of a specific individual who represents the ideal customer. This should be a realistic, relatable person that embodies the key characteristics of the target market.

Market Summary:
${JSON.stringify(marketSummary)}

Create a detailed customer profile that feels like a real person, with specific traits, goals, and challenges. Make sure the profile is consistent with the market summary but adds human details that make the persona feel authentic and relatable.

The profile should include:
1. A realistic full name
2. Specific age (not a range)
3. Current job position
4. Company size they work at
5. Industry they work in
6. 3-5 specific professional/personal goals
7. 3-5 key challenges they face
8. 2-4 personal interests or hobbies
9. Preferred communication/media channels
10. Key factors in their decision-making
11. Typical budget range for solutions
12. A brief narrative description of their daily life and priorities

Make the profile specific and believable, avoiding generic descriptions. Include small details that make the persona feel real.

Format the response as a valid JSON object with this exact structure:
{
  "profile": {
    "name": string,
    "age": number,
    "position": string,
    "company_size": string,
    "industry": string,
    "goals": string[],
    "challenges": string[],
    "interests": string[],
    "preferred_channels": string[],
    "decision_factors": string[],
    "budget_range": string,
    "profile_description": string
  }
}

Remember:
1. Output must be valid JSON
2. Must include all required fields
3. Must follow the exact schema structure
4. Arrays must contain strings
5. Age must be a number, all other fields are strings

Generate the JSON response now:`
    }

    const result = await model.generateContent([prompt])
    const response = await result.response
    
    if (!response) {
      throw new Error('No response from model')
    }

    const text = response.text()
    
    if (!text) {
      throw new Error('Empty response from model')
    }

    try {
      const generatedProfile = JSON.parse(text)
      
      // Validate the response structure
      if (!generatedProfile.profile) {
        throw new Error('Response missing required profile object')
      }

      const requiredFields = [
        'name', 'age', 'position', 'company_size', 'industry',
        'goals', 'challenges', 'interests', 'preferred_channels',
        'decision_factors', 'budget_range', 'profile_description'
      ]

      for (const field of requiredFields) {
        if (!(field in generatedProfile.profile)) {
          throw new Error(`Missing required field: ${field}`)
        }
      }

      // Validate arrays
      const arrayFields = ['goals', 'challenges', 'interests', 'preferred_channels', 'decision_factors']
      for (const field of arrayFields) {
        if (!Array.isArray(generatedProfile.profile[field])) {
          throw new Error(`Field ${field} must be an array`)
        }
      }

      // Validate age is a number
      if (typeof generatedProfile.profile.age !== 'number') {
        throw new Error('Age must be a number')
      }

      // Generate profile image using Replicate
      const imagePrompt = `Professional headshot portrait of ${generatedProfile.profile.name}, a ${generatedProfile.profile.age}-year-old ${generatedProfile.profile.position}. 
Key characteristics:
- Professional business attire
- ${generatedProfile.profile.age < 35 ? 'Young professional appearance' : 'Experienced executive appearance'}
- Confident, approachable smile
- Studio lighting with soft fill
- Neutral background
- Center-framed head and shoulders composition
- Sharp focus with shallow depth of field
- High-quality professional photo
- Realistic and natural appearance`

      let imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(generatedProfile.profile.name)}&background=2563eb&color=ffffff&size=256&bold=true&rounded=true`
      
      try {
        const input = {
          raw: false,
          prompt: imagePrompt,
          aspect_ratio: "1:1",
          output_format: "jpg",
          safety_tolerance: 6,
          image_prompt_strength: 0.1
        }

        console.log('Generating image with input:', input)
        const prediction = await replicate.predictions.create({
          version: "black-forest-labs/flux-1.1-pro-ultra",
          input
        })

        // Poll for the result
        let result = prediction
        while (result.status !== 'succeeded' && result.status !== 'failed') {
          await new Promise(resolve => setTimeout(resolve, 1000))
          result = await replicate.predictions.get(prediction.id)
          console.log('Status:', result.status)
        }

        if (result.status === 'succeeded' && result.output) {
          // Download the image from Replicate
          const imageResponse = await fetch(result.output)
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

          // Upload to Supabase Storage
          const fileName = `${locationId}/target-customer-${Date.now()}.jpg`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile-images')
            .upload(fileName, imageBuffer, {
              contentType: 'image/jpeg',
              upsert: true
            })

          if (uploadError) {
            throw uploadError
          }

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(fileName)

          imageUrl = publicUrl
          console.log('Successfully generated and uploaded image:', imageUrl)
        } else {
          console.error('Image generation failed:', result.error || 'Unknown error')
        }
      } catch (error) {
        console.error('Error generating/uploading image:', error)
        // Keep using fallback avatar URL
      }

      // Save the profile to the database
      const { error: dbError } = await supabase
        .from('target_customer')
        .upsert({
          location_id: locationId,
          name: generatedProfile.profile.name,
          age: generatedProfile.profile.age,
          position: generatedProfile.profile.position,
          company_size: generatedProfile.profile.company_size,
          industry: generatedProfile.profile.industry,
          goals: generatedProfile.profile.goals,
          challenges: generatedProfile.profile.challenges,
          interests: generatedProfile.profile.interests,
          preferred_channels: generatedProfile.profile.preferred_channels,
          decision_factors: generatedProfile.profile.decision_factors,
          budget_range: generatedProfile.profile.budget_range,
          profile_description: generatedProfile.profile.profile_description,
          profile_image_url: imageUrl,
          updated_at: new Date().toISOString()
        })

      if (dbError) {
        throw dbError
      }

      return NextResponse.json({
        profile: {
          ...generatedProfile.profile,
          profile_image_url: imageUrl
        }
      })

    } catch (error: any) {
      console.error('Error processing generated profile:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to process generated profile' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Error generating target customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate target customer' },
      { status: 500 }
    )
  }
}
