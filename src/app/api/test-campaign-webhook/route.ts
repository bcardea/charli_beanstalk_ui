import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const response = searchParams.get('response')

    if (!locationId || !response) {
      return NextResponse.json(
        { error: 'Location ID and response are required' },
        { status: 400 }
      )
    }

    // Send webhook to n8n
    const webhookUrl = new URL('https://charli.app.n8n.cloud/webhook-test/1369daba-b3d8-4067-8239-f3df5208276c')
    webhookUrl.searchParams.set('locationId', locationId)
    webhookUrl.searchParams.set('response', response)
    webhookUrl.searchParams.set('timestamp', new Date().toISOString())

    const webhookResponse = await fetch(webhookUrl)

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.statusText}`)
    }

    const webhookData = await webhookResponse.json()
    
    return NextResponse.json({
      success: true,
      data: webhookData
    })
  } catch (error: any) {
    console.error('Error sending webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send webhook' },
      { status: 500 }
    )
  }
}
