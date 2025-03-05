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
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    })

    // Create the prompt
    const prompt = {
      text: `${question}\n\nInput:\n${answer}`
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
      return NextResponse.json({
        enhancedAnswer: jsonResponse
      })
    } catch (e) {
      console.error('Failed to parse JSON response:', e)
      throw new Error('Failed to generate structured content')
    }

  } catch (error: any) {
    console.error('Error in generate-structured-content:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate structured content' },
      { status: 500 }
    )
  }
}
