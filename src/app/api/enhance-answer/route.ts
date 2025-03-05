import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables')
    }

    const { answer, question, schema } = await request.json()

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-pro-exp-02-05',
      ...(schema && {
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      })
    })

    // Create the prompt
    const prompt = {
      text: `You are a professional business writer. Your task is to enhance and rephrase the given answer to be more professional, concise, and business-oriented. Keep the same meaning but make it more polished and impactful. Avoid lengthy explanations or bullet points. Focus on creating a single, powerful statement that captures the essence of the business or answer.

Question: ${question}

Original Answer: ${answer}

Please provide a concise, professional enhancement of this answer in a single paragraph.`
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

    return NextResponse.json({
      enhancedAnswer: text
    })
  } catch (error: any) {
    console.error('Error enhancing answer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to enhance answer' },
      { status: 500 }
    )
  }
}
