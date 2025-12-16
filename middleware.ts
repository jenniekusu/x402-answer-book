import { NextRequest } from "next/server";
import { paymentMiddleware } from "x402-next";

const payTo = process.env.PAY_TO_ADDRESS as `0x${string}` | undefined;
const facilitatorUrl = process.env.X402_FACILITATOR_URL as
  | `http://${string}`
  | `https://${string}`
  | undefined;
const price = process.env.PRICE ?? "0.5";
const network = process.env.CHAIN_ID === "base" ? "base" : "base-sepolia"; // 默认使用 base-sepolia 测试网

// If x402 is not configured, just pass-through requests (useful for local dev).
const maybePaymentMiddleware =
  payTo && facilitatorUrl
    ? paymentMiddleware(
        payTo,
        {
          "/api/answer": {
            price: `$${price}`, // x402-next 需要 $ 前缀
            network,
            config: {
              description: "Answer Book paid answer",
            },
          },
        },
        {
          url: facilitatorUrl,
        },
      )
    : null;

export function middleware(request: NextRequest) {
  if (!maybePaymentMiddleware) {
    return;
  }
  return maybePaymentMiddleware(request);
}

export const config = {
  matcher: ["/api/answer"],
};


