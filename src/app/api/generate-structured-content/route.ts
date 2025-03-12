import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables')
    }

    const { answer, question, schema } = await request.json()

    if (!schema) {
      throw new Error('Schema is required for structured content generation')
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-pro-exp-02-05',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40,
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    })

    // Create a more explicit prompt to ensure JSON structure
    const prompt = {
      text: `You are a specialized AI trained to generate structured content in JSON format.
Your task is to analyze the following input and generate a response that EXACTLY matches this JSON schema:

${JSON.stringify(schema, null, 2)}

The response must be valid JSON and match the schema exactly. Each section must have a title and properly formatted content array.

Question:
${question}

Input:
${answer}

Remember:
1. Output must be valid JSON
2. Must include all required fields
3. Must follow the exact schema structure
4. Content types must be one of: "h1", "h2", "h3", "paragraph", or "list"
5. Lists must include the items array

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
      const jsonResponse = JSON.parse(text)
      
      // Validate the response structure matches our schema
      if (!jsonResponse.sections || !Array.isArray(jsonResponse.sections)) {
        throw new Error('Response missing required sections array')
      }

      // Validate each section
      for (const section of jsonResponse.sections) {
        if (!section.title || !section.content || !Array.isArray(section.content)) {
          throw new Error('Invalid section structure')
        }

        // Validate each content item
        for (const content of section.content) {
          if (!content.type || !content.text) {
            throw new Error('Invalid content structure')
          }

          if (!['h1', 'h2', 'h3', 'paragraph', 'list'].includes(content.type)) {
            throw new Error(`Invalid content type: ${content.type}`)
          }

          if (content.type === 'list' && (!content.items || !Array.isArray(content.items))) {
            throw new Error('List type must include items array')
          }
        }
      }

      return NextResponse.json({
        enhancedAnswer: jsonResponse
      })
    } catch (e) {
      console.error('Failed to parse or validate JSON response:', e)
      throw new Error('Failed to generate valid structured content')
    }

  } catch (error: any) {
    console.error('Error in generate-structured-content:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate structured content' },
      { status: 500 }
    )
  }
}
