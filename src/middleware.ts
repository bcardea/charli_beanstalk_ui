import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Allow embedding in iframes
  response.headers.set('X-Frame-Options', 'ALLOWALL')
  
  // Add a custom header to identify requests from GoHighLevel
  if (request.headers.get('referer')?.includes('gohighlevel.com')) {
    response.headers.set('x-from-ghl', '1')
  }

  return response
}

// Apply middleware to all routes
export const config = {
  matcher: '/:path*',
}
