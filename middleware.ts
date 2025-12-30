import { NextRequest, NextResponse } from "next/server";

// Simplified middleware; x402 handling lives in the API route now
// This avoids hitting the Edge Function bundle size limit
export function middleware(request: NextRequest) {
  // Pass everything through; the API route applies the withX402 payment wrapper
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/answer"],
};

