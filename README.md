# Answer Book

Answer Book is a mystical question ritual powered by x402: a fully client-side guided ceremony that lets users submit a burning question, pay a tiny onchain fee, and receive an AI-generated answer sourced from a Agent secured by ERC-8004 identity proofs. It mixes tarot-like storytelling with crypto-native payments so anyone on Base Sepolia (and Base mainnet soon) can “open” their personal book of answers.

**Live app:** https://www.answerbook.app/

## Product Highlights

- **Guided ritual:** Users progress through setup → ask → result → share screens that capture the feel of visiting an oracle. Required fields (name, birth data, birthplace) are stored only in session storage, keeping the experience private.
- **x402 micropayments:** Every reading costs 0.0001 USDC through x402 EXACT payments. The flow auto-detects the required chain, prompts RainbowKit/Wagmi to switch wallets, and retries with an `X-PAYMENT` header so the backend only serves answers after payment settles.
- **ERC-8004 registered agent:** The Bun-based agent service announces an ERC-8004 identity (Agent domain + Chain ID + registration state). This lets explorers and wallets verify the oracle they are paying is an attested onchain agent.
- **Share-ready artefacts:** The result view renders a printable/shareable card via `html2canvas`, provides an instant PNG download, and can upload the capture to the agent backend for Twitter/X sharing using the `/share` route (which emits custom OG tags for Twitterbot).
- **Base-first UX:** Wagmi + RainbowKit target Base and Base Sepolia out of the box, defaulting to Sepolia for testing while remaining mainnet-ready. Instructions link to Circle’s faucet so users can top up USDC quickly.

## Architecture & Tech Stack

| Layer | Key Tech | Notes |
| --- | --- | --- |
| Web client | Next.js 16 App Router, React 19, TailwindCSS | Pages live under `src/app` (`/setup`, `/ask`, `/result`, `/share`). UI primitives sit in `src/components`; shared logic lives in `src/lib`. |
| Wallet & network | RainbowKit + Wagmi + WalletConnect, html2canvas | Provides wallet connect, chain switching, Base/Base-Sepolia support, and client-side capture for share cards. |
| Payments | `x402` + `@coinbase/x402` | Uses `exact.evm.createPayment` to build the payment payload and `encodePayment` for the `X-PAYMENT` header that unlocks the answer. |
| Agent backend | Bun, ERC-8004 identity middleware | `agent-backend/` exposes `/entrypoints/consult/invoke` plus helper endpoints (image upload, static hosting). Payments + identity config come from environment variables so the agent can register and receive funds. |
| Data & state | Browser `sessionStorage`, optional Prisma/SQLite | Client state (`Profile`, `QuestionPayload`, `AnswerResult`) is persisted per-session to avoid storing PII on the server; Prisma is available for future persistence if needed. |

### Flow Overview

1. **Setup (`/setup`)** — Collect birth details and cache them in session storage.
2. **Ask (`/ask`)** — Capture a concise question, select category, and prepare the consult payload.
3. **Result (`/result`)** — Call `consultApi`. If the agent requests payment, create an x402 EXACT invoice, ensure the wallet is on Base (or Base Sepolia), sign the payment, then resubmit with the encoded header. Successful responses are saved locally and rendered with sharing options.
4. **Share (`/share`)** — Handles Twitterbot requests by emitting OG/Twitter card tags that point at the uploaded image so social platforms display the actual answer card preview.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) ≥ v1.1 (used for both workspaces)
- Node.js ≥ 18 (needed for some Next.js tooling)
- A Base-compatible wallet + WalletConnect Project ID for full payment testing

### 1. Install dependencies

```bash
bun install
cd agent-backend && bun install && cd ..
```

### 2. Configure environment

Copy the example env files and fill in the required values:

```bash
cp src/.env.example .env.local
cp agent-backend/.env.example agent-backend/.env
```

`NEXT_PUBLIC_API_URL` should point to the agent backend (e.g. `http://localhost:3001`).
The agent env includes OpenAI keys, Agent identifiers, `FACILITATOR_URL`, `NETWORK`, `PAYMENTS_RECEIVABLE_ADDRESS`, and ERC-8004 identity params (`AGENT_DOMAIN`, `CHAIN_ID`, `REGISTER_IDENTITY`, etc.).

### 3. Run the services locally

```bash
# Terminal 1 – Next.js client
bun run dev

# Terminal 2 – Bun agent (from agent-backend/)
cd agent-backend
bun run dev
```

Navigate to http://localhost:3000, connect a Base Sepolia wallet, and walk through the ritual.

### 4. Testing & linting

```bash
bun run lint
bun run test          # Vitest suites
bun run test -- --coverage
```

## Deploying

- **Frontend:** `bun run build` emits the Next.js bundle that can be deployed to Vercel or any Node host (`bun run start` to preview). Set `NEXT_PUBLIC_API_URL` to the deployed agent URL.
- **Agent backend:** `bun run build` compiles the Bun worker; host it on Bun-compatible infra, expose HTTPS, and make sure the ERC-8004 identity variables point to your registered Agent ID on Base mainnet.
- **x402 integration:** Keep `FACILITATOR_URL`, `NETWORK`, `PAYMENTS_RECEIVABLE_ADDRESS`, and `PRIVATE_KEY` synchronized between staging and production so EXACT invoices resolve correctly; we default to the Awe World Fun facilitator endpoint (update `FACILITATOR_URL` if you self-host). When `X-PAYMENT` headers are missing or invalid the agent responds with `accepts: [...]`, giving the client everything it needs to re-initiate payment.
- **Base mainnet rollout:** As soon as Base mainnet finalizes ERC-8004 identity support we will register the Answer Book agent on the mainnet registry and point the production frontend at that deployment so users can pay with real USDC.
