import { NextRequest, NextResponse } from "next/server";

// 简化的 middleware，不再处理 x402（已移到 API route）
// 这样可以避免 Edge Function 大小限制
export function middleware(request: NextRequest) {
  // 直接放行，x402 支付逻辑在 API route 中使用 withX402 wrapper
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/answer"],
};


