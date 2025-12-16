import { NextRequest } from "next/server";
import { paymentMiddleware } from "x402-next";

const payTo = process.env.PAY_TO_ADDRESS as `0x${string}` | undefined;
const facilitatorUrl = process.env.X402_FACILITATOR_URL;
const price = process.env.PRICE ?? "0.5";
const chainId = process.env.CHAIN_ID ?? "base";
const tokenAddress = process.env.TOKEN_ADDRESS;

// If x402 is not configured, just pass-through requests (useful for local dev).
const maybePaymentMiddleware =
  payTo && facilitatorUrl && tokenAddress
    ? paymentMiddleware(payTo, {
        "/api/answer": {
          price,
          chainId,
          tokenAddress,
          config: {
            description: "Answer Book paid answer",
          },
        },
      }, {
        url: facilitatorUrl,
      })
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


