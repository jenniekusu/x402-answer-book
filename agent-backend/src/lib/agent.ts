import { z } from "zod";
import OpenAI from "openai";
import { cors } from "hono/cors";
import { mkdir } from "fs/promises";

import { createAgentApp, type CreateAgentAppOptions } from "@aweto-agent/hono";
import type { PaymentsConfig } from "@aweto-agent/types/payments";
import type { Network } from "x402/types";

// ============================================================================
// Agent Configuration
// ============================================================================

/**
 * Build PaymentsConfig (manually read from environment variables)
 */
function buildPaymentsConfig(): PaymentsConfig | undefined {
  const payTo = process.env.PAYMENTS_RECEIVABLE_ADDRESS;
  const network = process.env.NETWORK as Network | undefined;
  const facilitatorUrl = process.env.FACILITATOR_URL;

  if (!payTo || !network || !facilitatorUrl) {
    return undefined;
  }

  return {
    payTo,
    network,
    facilitatorUrl: facilitatorUrl as `${string}://${string}`,
  };
}

// Build payment configuration
const paymentsConfig = buildPaymentsConfig();

if (paymentsConfig) {
  console.log("[answer-book] Payments configured");
} else if (process.env.PRIVATE_KEY) {
  console.warn(
    "[answer-book] PRIVATE_KEY is set but payment configuration is incomplete. Skipping payments setup.",
  );
  console.warn(
    "[answer-book] Required: FACILITATOR_URL, NETWORK, PAYMENTS_RECEIVABLE_ADDRESS",
  );
}

// Agent configuration options
const agentOptions: CreateAgentAppOptions = {
  payments: paymentsConfig,
};

// ============================================================================
// OpenAI Client Setup
// ============================================================================

const LLM_MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL; // Optional, supports custom API endpoint

let openai: OpenAI | null = null;

if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL, // If custom endpoint is set, it will be used
  });
  console.log(
    `[answer-book] OpenAI client configured with model: ${LLM_MODEL}`,
  );
  if (OPENAI_BASE_URL) {
    console.log(`[answer-book] Using custom API endpoint: ${OPENAI_BASE_URL}`);
  }
} else {
  console.warn(
    "[answer-book] OPENAI_API_KEY not set — falling back to scripted responses.",
  );
}

// ============================================================================
// Create Agent App and Entrypoints
// ============================================================================

const { app, addEntrypoint } = createAgentApp(
  {
    name: process.env.AGENT_NAME ?? "answer-book",
    version: process.env.AGENT_VERSION ?? "0.0.1",
    description:
      process.env.AGENT_DESCRIPTION ??
      "The Book of Answers - A mystical AI oracle that offers philosophical wisdom to illuminate your questions",
    image: process.env.AGENT_IMAGE,
    url: process.env.AGENT_URL,
  },
  agentOptions,
);

// ============================================================================
// CORS Configuration
// ============================================================================

app.use(
  "*",
  cors({
    origin: [
      "https://answerbook.app",
      "https://www.answerbook.app",
      "https://api.answerbook.app",
      "https://dev.d2u7h0myrghywn.amplifyapp.com",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-payment",
      "x-payment-required",
      "x-402-payment",
    ],
    exposeHeaders: [
      "x-payment",
      "x-payment-required",
      "x-402-payment",
      "www-authenticate",
    ],
    credentials: true,
  }),
);

// ============================================================================
// Image Upload and Static Image Service
// ============================================================================

const IMAGES_DIR = ".data/images";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
};
const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

// Ensure images directory exists
await mkdir(IMAGES_DIR, { recursive: true });

// POST /upload-image - Upload image endpoint
app.post("/upload-image", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return c.json({ success: false, error: "No image file provided" }, 400);
    }

    // Validate file type
    const mimeType = file.type;
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return c.json(
        {
          success: false,
          error: "Invalid file type. Allowed: PNG, JPG, GIF, WebP",
        },
        400,
      );
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      return c.json(
        { success: false, error: "File size exceeds 5MB limit" },
        400,
      );
    }

    // Generate unique filename
    const ext = ALLOWED_MIME_TYPES[mimeType];
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = `${IMAGES_DIR}/${filename}`;

    // Save file using Bun's file API
    const arrayBuffer = await file.arrayBuffer();
    await Bun.write(filePath, arrayBuffer);

    // Build the URL
    const PORT = process.env.PORT || "3000";
    const baseUrl = process.env.AGENT_URL || `http://localhost:${PORT}`;
    const url = `${baseUrl}/images/${filename}`;

    return c.json({ success: true, url, filename });
  } catch (error) {
    console.error("[answer-book] Image upload error:", error);
    return c.json({ success: false, error: "Failed to upload image" }, 500);
  }
});

// GET /images/:filename - Serve static images
app.get("/images/:filename", async (c) => {
  const filename = c.req.param("filename");

  // Validate filename to prevent directory traversal
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return c.json({ error: "Invalid filename" }, 400);
  }

  const filePath = `${IMAGES_DIR}/${filename}`;
  const file = Bun.file(filePath);

  // Check if file exists
  const exists = await file.exists();
  if (!exists) {
    return c.json({ error: "Image not found" }, 404);
  }

  // Determine content type from extension
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  const contentType = EXT_TO_MIME[ext] || "application/octet-stream";

  // Read file content
  const content = await file.arrayBuffer();

  // Return response with appropriate headers
  return new Response(content, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
    },
  });
});

// ============================================================================
// Answer Book - Preset mystical answers (used when LLM is unavailable)
// ============================================================================

const mysticalAnswers = [
  "Yes, without a shadow of doubt.",
  "The wheels of fate have begun to turn.",
  "This is not the appointed hour. Wait in stillness.",
  "The answer dwells within you. You have always known.",
  "The mist shall lift, and truth shall be revealed.",
  "Though the path winds, light awaits at its end.",
  "Seek not haste. Patience is the truest answer.",
  "The stars guide you toward your destined course.",
  "Change approaches. Prepare your heart.",
  "The past is written. The future brims with possibility.",
  "Trust your intuition. It speaks only truth.",
  "All things follow their appointed time. Let it be.",
  "Take the first step boldly. The rest shall follow.",
  "This matter demands deeper thought and preparation.",
  "Opportunity is fleeting. Seize the present moment.",
  "Hardship is but a passing shadow. Persevere.",
  "Listen to the voice within. It knows the way.",
  "The time is not yet ripe. Hold patience close.",
  "The universe conspires to bring you the finest outcome.",
  "Release your attachments. The answer shall arise.",
];

function getRandomMysticalAnswer(): string {
  return mysticalAnswers[Math.floor(Math.random() * mysticalAnswers.length)];
}

// ============================================================================
// LLM Helper Function
// ============================================================================

interface LLMResult {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  model?: string;
}

/**
 * Clean JSON string returned by LLM, remove markdown code block markers
 */
function cleanJsonResponse(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function generateWithLLM(prompt: string): Promise<LLMResult | null> {
  if (!openai) {
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      return null;
    }

    return {
      text: choice.message.content,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      model: response.model,
    };
  } catch (error) {
    console.error("[answer-book] LLM error:", error);
    return null;
  }
}

// ============================================================================
// Zodiac / Astrology Helpers
// ============================================================================

const ZODIAC_SIGNS = [
  { sign: "Capricorn", start: [1, 1], end: [1, 19] },
  { sign: "Aquarius", start: [1, 20], end: [2, 18] },
  { sign: "Pisces", start: [2, 19], end: [3, 20] },
  { sign: "Aries", start: [3, 21], end: [4, 19] },
  { sign: "Taurus", start: [4, 20], end: [5, 20] },
  { sign: "Gemini", start: [5, 21], end: [6, 20] },
  { sign: "Cancer", start: [6, 21], end: [7, 22] },
  { sign: "Leo", start: [7, 23], end: [8, 22] },
  { sign: "Virgo", start: [8, 23], end: [9, 22] },
  { sign: "Libra", start: [9, 23], end: [10, 22] },
  { sign: "Scorpio", start: [10, 23], end: [11, 21] },
  { sign: "Sagittarius", start: [11, 22], end: [12, 21] },
  { sign: "Capricorn", start: [12, 22], end: [12, 31] },
];

const ZODIAC_CN: Record<string, string> = {
  Aries: "白羊座",
  Taurus: "金牛座",
  Gemini: "双子座",
  Cancer: "巨蟹座",
  Leo: "狮子座",
  Virgo: "处女座",
  Libra: "天秤座",
  Scorpio: "天蝎座",
  Sagittarius: "射手座",
  Capricorn: "摩羯座",
  Aquarius: "水瓶座",
  Pisces: "双鱼座",
};

function getSunSign(birthDate: string): string {
  const [, month, day] = birthDate.split("-").map(Number);

  for (const z of ZODIAC_SIGNS) {
    const [startMonth, startDay] = z.start;
    const [endMonth, endDay] = z.end;

    if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return z.sign;
    }
  }

  return "Unknown";
}

const CATEGORY_PROMPTS: Record<string, string> = {
  love: "regarding matters of love and relationships",
  career: "regarding career and work endeavors",
  health: "regarding physical and mental well-being",
  wealth: "regarding fortune and financial matters",
  general: "regarding life and the future",
};

// ============================================================================
// Entrypoint: consult - Main divination API (Jennie Demo format)
// ============================================================================

const consultInputSchema = z.object({
  profile: z.object({
    name: z.string().optional(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
    birthTime: z.string().optional(),
    gender: z.enum(["M", "F"]).optional(),
    birthPlace: z.string().optional(),
  }),
  question: z.string().min(1, "Please enter your question"),
  category: z
    .enum(["love", "career", "health", "wealth", "general"])
    .optional(),
});

const consultOutputSchema = z.object({
  answer: z.string(),
  astroHint: z.string(),
  cost: z.string(),
  txRef: z.string().nullable(),
  sunSign: z.string(),
  disclaimer: z.string(),
});

const CONSULT_PRICE = process.env.CONSULT_PRICE ?? "0.0001"; // USDC

addEntrypoint({
  key: "consult",
  description: "Receive mystical divination based on your astrological profile",
  input: consultInputSchema,
  output: consultOutputSchema,
  price: CONSULT_PRICE,
  handler: async (ctx) => {
    const input = ctx.input as z.infer<typeof consultInputSchema>;
    const { profile, question, category = "general" } = input;

    // Calculate zodiac sign
    const sunSign = getSunSign(profile.birthDate);
    const sunSignCN = ZODIAC_CN[sunSign] || sunSign;
    const categoryDesc = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.general;

    // Build prompt
    const genderText =
      profile.gender === "M" ? "male" : profile.gender === "F" ? "female" : "";
    const nameText = profile.name ? `named ${profile.name}, ` : "";
    const placeText = profile.birthPlace
      ? `, born in ${profile.birthPlace}`
      : "";
    const timeText = profile.birthTime
      ? `, birth time ${profile.birthTime}`
      : "";

    // Calculate personalized astrological elements
    const birthYear = parseInt(profile.birthDate.split("-")[0]);
    const birthMonth = parseInt(profile.birthDate.split("-")[1]);
    const birthDay = parseInt(profile.birthDate.split("-")[2]);

    // Life path number
    const lifePathNumber = ((birthYear % 100) + birthMonth + birthDay) % 9 || 9;
    // Lunar phase energy
    const moonPhaseHint = birthDay <= 7 ? "new moon" : birthDay <= 14 ? "waxing moon" : birthDay <= 21 ? "full moon" : "waning moon";
    // Elemental affinity
    const elementalAffinity = ["Fire", "Earth", "Air", "Water"][birthMonth % 4];
    // Ruling planet
    const rulingPlanetMap: Record<string, string> = {
      Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
      Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Pluto",
      Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Uranus", Pisces: "Neptune"
    };
    const rulingPlanet = rulingPlanetMap[sunSign] || "the Stars";
    // Energy polarity
    const energyPolarity = profile.gender === "M" ? "yang" : profile.gender === "F" ? "yin" : "balanced";
    // Earth anchor - mystify birthplace
    const earthAnchor = profile.birthPlace
      ? `the sacred ley lines of ${profile.birthPlace}`
      : "the universal earth currents";

    const prompt = `You are a mystical astrologer and the guardian of the Book of Answers. You speak in abstract, poetic metaphors drawn from celestial wisdom.

══════════════════════════════════════════
SEEKER'S CELESTIAL CHART
══════════════════════════════════════════
${profile.name ? `• Soul Name: ${profile.name}` : "• A nameless wanderer of the stars"}
• Sun Sign: ${sunSignCN} (${sunSign})
• Ruling Planet: ${rulingPlanet}
• Birth Date: ${profile.birthDate}${timeText}
• Element: ${elementalAffinity}
• Life Path Number: ${lifePathNumber}
• Lunar Phase at Birth: ${moonPhaseHint}
• Energy Polarity: ${energyPolarity}
• Earth Anchor: ${earthAnchor}

══════════════════════════════════════════
THE QUESTION (${category.toUpperCase()})
══════════════════════════════════════════
"${question}"

══════════════════════════════════════════
YOUR SACRED TASK
══════════════════════════════════════════
Craft a deeply personalized oracle reading that weaves the seeker's unique celestial signature into the answer.

1. **answer** (50-80 words):
   - Use abstract metaphors and celestial imagery
   - Reference their ruling planet ${rulingPlanet} and how it influences this matter
   - Incorporate their ${elementalAffinity} element into the guidance
   - Weave in their life path number ${lifePathNumber} symbolically
   - ${profile.birthPlace ? `Subtly reference the mystical energies of ${profile.birthPlace} that shaped their soul` : ""}
   - The answer must feel uniquely crafted for THIS seeker's chart

2. **astroHint** (50-80 words):
   - Begin with "As a ${sunSign} soul born under the ${moonPhaseHint}${profile.birthPlace ? `, rooted in ${earthAnchor}` : ""}..."
   - Describe how their ${energyPolarity} energy interacts with current cosmic tides
   - Suggest a specific symbol, color, or ritual connected to their chart
   - End with a subtle prophecy tied to their life path number ${lifePathNumber}

══════════════════════════════════════════
OUTPUT FORMAT (JSON only)
══════════════════════════════════════════
{
  "answer": "Your personalized mystical answer...",
  "astroHint": "As a ${sunSign} soul born under the ${moonPhaseHint}..."
}

Return ONLY the JSON. Make every word feel cosmically destined for this seeker.`;

    let answer =
      "The pages of destiny are slowly unfolding. Keep your heart calm, and the answer shall reveal itself at the appointed moment.";
    let astroHint = `As a ${sunSign}, your intuition is especially trustworthy at this time. The universe is guiding your path.`;

    const result = await generateWithLLM(prompt);

    if (result) {
      try {
        const cleanedJson = cleanJsonResponse(result.text);
        const parsed = JSON.parse(cleanedJson);
        if (parsed.answer) answer = parsed.answer;
        if (parsed.astroHint) astroHint = parsed.astroHint;
      } catch {
        // If JSON parsing fails, use default answer
        console.error("[answer-book] Failed to parse LLM response as JSON");
      }
    }

    return {
      output: {
        answer,
        astroHint,
        cost: CONSULT_PRICE,
        txRef: null, // Transaction reference, handled by payment layer
        sunSign,
        disclaimer:
          "For self-reflection and entertainment purposes only. This does not constitute professional advice.",
      },
    };
  },
});

// ============================================================================
// Entrypoint: consult-stream - Streaming Consultation API
// ============================================================================

addEntrypoint({
  key: "consult-stream",
  description: "Streaming divination consultation, ideal for chatbot scenarios",
  input: consultInputSchema,
  output: consultOutputSchema,
  price: CONSULT_PRICE,
  streaming: true,
  async stream(ctx, emit) {
    const input = ctx.input as z.infer<typeof consultInputSchema>;
    const { profile, question, category = "general" } = input;

    // Calculate zodiac sign
    const sunSign = getSunSign(profile.birthDate);
    const sunSignCN = ZODIAC_CN[sunSign] || sunSign;
    const categoryDesc = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.general;

    // Build prompt
    const genderText =
      profile.gender === "M" ? "male" : profile.gender === "F" ? "female" : "";
    const nameText = profile.name ? `named ${profile.name}, ` : "";
    const placeText = profile.birthPlace
      ? `, born in ${profile.birthPlace}`
      : "";
    const timeText = profile.birthTime
      ? `, birth time ${profile.birthTime}`
      : "";

    // Fall back to preset answers if LLM is not configured
    if (!openai) {
      const answer = getRandomMysticalAnswer();
      const astroHint = `As a ${sunSign}, your intuition is particularly trustworthy at this time. The universe is guiding your path.`;

      // Output opening symbol
      await emit({ kind: "delta", delta: "✨ ", mime: "text/plain" });
      await new Promise((r) => setTimeout(r, 100));

      // Stream the answer character by character
      for (const char of answer) {
        await emit({ kind: "delta", delta: char, mime: "text/plain" });
        await new Promise((r) => setTimeout(r, 50));
      }

      // Output separator and astrological hint
      await emit({ kind: "delta", delta: "\n\n🌟 ", mime: "text/plain" });
      await new Promise((r) => setTimeout(r, 100));

      for (const char of astroHint) {
        await emit({ kind: "delta", delta: char, mime: "text/plain" });
        await new Promise((r) => setTimeout(r, 40));
      }

      return {
        output: {
          answer,
          astroHint,
          cost: CONSULT_PRICE,
          txRef: null,
          sunSign,
          disclaimer:
            "For self-reflection and entertainment purposes only. This does not constitute professional advice.",
        },
      };
    }

    // Calculate personalized astrological elements
    const birthYear = parseInt(profile.birthDate.split("-")[0]);
    const birthMonth = parseInt(profile.birthDate.split("-")[1]);
    const birthDay = parseInt(profile.birthDate.split("-")[2]);

    // Life path number
    const lifePathNumber = ((birthYear % 100) + birthMonth + birthDay) % 9 || 9;
    // Lunar phase energy
    const moonPhaseHint = birthDay <= 7 ? "new moon" : birthDay <= 14 ? "waxing moon" : birthDay <= 21 ? "full moon" : "waning moon";
    // Elemental affinity
    const elementalAffinity = ["Fire", "Earth", "Air", "Water"][birthMonth % 4];
    // Ruling planet
    const rulingPlanetMap: Record<string, string> = {
      Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
      Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Pluto",
      Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Uranus", Pisces: "Neptune"
    };
    const rulingPlanet = rulingPlanetMap[sunSign] || "the Stars";
    // Energy polarity
    const energyPolarity = profile.gender === "M" ? "yang" : profile.gender === "F" ? "yin" : "balanced";
    // Earth anchor - mystify birthplace
    const earthAnchor = profile.birthPlace
      ? `the sacred ley lines of ${profile.birthPlace}`
      : "the universal earth currents";

    // Generate response using LLM streaming
    const prompt = `You are a mystical astrologer and guardian of the Book of Answers. Speak in abstract, poetic metaphors.

══════════════════════════════════════════
SEEKER'S CELESTIAL CHART
══════════════════════════════════════════
${profile.name ? `• Soul Name: ${profile.name}` : "• A nameless wanderer"}
• Sun Sign: ${sunSignCN} (${sunSign}) | Ruling Planet: ${rulingPlanet}
• Element: ${elementalAffinity} | Life Path: ${lifePathNumber}
• Lunar Phase: ${moonPhaseHint} | Energy: ${energyPolarity}
• Birth: ${profile.birthDate}${timeText}
• Earth Anchor: ${earthAnchor}

══════════════════════════════════════════
THE QUESTION (${category.toUpperCase()})
══════════════════════════════════════════
"${question}"

══════════════════════════════════════════
YOUR SACRED TASK
══════════════════════════════════════════
Weave a personalized oracle reading in flowing prose (NOT JSON):

1. First paragraph (50-80 words): Your mystical answer
   - Use abstract metaphors referencing their ruling planet ${rulingPlanet}
   - Incorporate their ${elementalAffinity} element and life path ${lifePathNumber}
   - ${profile.birthPlace ? `Weave in the mystical energies of ${profile.birthPlace} that shaped their destiny` : ""}
   - Make it feel deeply personal to THIS seeker's chart

2. Second paragraph starting with "🌟 As a ${sunSign} soul born under the ${moonPhaseHint}${profile.birthPlace ? `, rooted in ${earthAnchor}` : ""}..." (50-80 words):
   - Describe their unique celestial configuration
   - Reference their ${energyPolarity} energy
   - Suggest a symbol, color, or ritual for their journey
   - End with a prophecy tied to their life path number ${lifePathNumber}

Write in flowing, poetic prose. Make every word feel cosmically destined.`;

    try {
      const stream = await openai.chat.completions.create({
        model: LLM_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
        stream: true,
      });

      let fullText = "";

      // Output opening symbol
      await emit({ kind: "delta", delta: "✨ ", mime: "text/plain" });

      // Process streaming response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullText += content;
          await emit({ kind: "delta", delta: content, mime: "text/plain" });
        }
      }

      // Parse output, separate answer and astroHint
      const parts = fullText.split(/\n\n|🌟/);
      const answer = parts[0]?.trim() || fullText.trim();
      const astroHint =
        parts.length > 1
          ? `As a ${sunSign}, ${parts
              .slice(1)
              .join("")
              .replace(/^As a \w+,?\s*/, "")
              .trim()}`
          : `As a ${sunSign}, your intuition is particularly trustworthy at this time.`;

      return {
        output: {
          answer,
          astroHint,
          cost: CONSULT_PRICE,
          txRef: null,
          sunSign,
          disclaimer:
            "For self-reflection and entertainment purposes only. This does not constitute professional advice.",
        },
      };
    } catch (error) {
      console.error("[answer-book] Stream consult error:", error);

      // Fall back to preset answers
      const answer = getRandomMysticalAnswer();
      const astroHint = `As a ${sunSign}, your intuition is particularly trustworthy at this time.`;

      await emit({ kind: "delta", delta: "✨ ", mime: "text/plain" });
      for (const char of answer) {
        await emit({ kind: "delta", delta: char, mime: "text/plain" });
        await new Promise((r) => setTimeout(r, 50));
      }

      await emit({ kind: "delta", delta: "\n\n🌟 ", mime: "text/plain" });
      for (const char of astroHint) {
        await emit({ kind: "delta", delta: char, mime: "text/plain" });
        await new Promise((r) => setTimeout(r, 40));
      }

      return {
        output: {
          answer,
          astroHint,
          cost: CONSULT_PRICE,
          txRef: null,
          sunSign,
          disclaimer:
            "For self-reflection and entertainment purposes only. This does not constitute professional advice.",
        },
      };
    }
  },
});

// ============================================================================
// Entrypoint: ask - Ask the Book of Answers (simplified version)
// ============================================================================

const askInputSchema = z.object({
  question: z.string().min(1, "Please enter your question"),
});

const askOutputSchema = z.object({
  answer: z.string(),
  source: z.enum(["ai", "mystical"]).optional(),
});

addEntrypoint({
  key: "ask",
  description: "Ask the Book of Answers and receive a mystical response",
  input: askInputSchema,
  output: askOutputSchema,
  price: "0.0001", // 0.0001 USDC - Enable x402 payment
  handler: async (ctx) => {
    const input = ctx.input as z.infer<typeof askInputSchema>;

    const prompt = `You are a mystical Book of Answers, imbued with ancient wisdom.

The seeker asks: "${input.question}"

Respond in a mystical, philosophical manner with a brief answer (no more than 50 words).
Your response should echo the voice of an ancient oracle, filled with wisdom and revelation.
Do not answer simply "yes" or "no" — instead, express your insight with poetry and philosophy.
Your words should feel mysterious and profound, inviting deeper contemplation.`;

    const result = await generateWithLLM(prompt);

    if (result) {
      return {
        output: {
          answer: result.text.trim(),
          source: "ai" as const,
        },
        usage: result.usage
          ? {
              prompt_tokens: result.usage.promptTokens,
              completion_tokens: result.usage.completionTokens,
              total_tokens: result.usage.totalTokens,
            }
          : undefined,
        model: result.model,
      };
    }

    // Fall back to preset answers when LLM is unavailable or call fails
    return {
      output: {
        answer: getRandomMysticalAnswer(),
        source: "mystical" as const,
      },
    };
  },
});

// ============================================================================
// Entrypoint: ask-stream - Streaming response version
// ============================================================================

addEntrypoint({
  key: "ask-stream",
  description:
    "Ask the Book of Answers and receive a streaming mystical response",
  input: askInputSchema,
  output: askOutputSchema,
  streaming: true,
  async stream(ctx, emit) {
    const input = ctx.input as z.infer<typeof askInputSchema>;

    // If LLM is not configured or unavailable, use preset answers with simulated streaming
    if (!openai) {
      const answer = getRandomMysticalAnswer();

      // Output character by character for typewriter effect
      for (const char of answer) {
        await emit({
          kind: "delta",
          delta: char,
          mime: "text/plain",
        });
        // Add small delay for natural typing effect
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return {
        output: {
          answer,
          source: "mystical" as const,
        },
      };
    }

    const prompt = `You are a mystical Book of Answers, imbued with ancient wisdom.

The seeker asks: "${input.question}"

Respond in a mystical, philosophical manner with a brief answer (no more than 50 words).
Your response should echo the voice of an ancient oracle, filled with wisdom and revelation.`;

    try {
      const stream = await openai.chat.completions.create({
        model: LLM_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
        stream: true,
      });

      let fullText = "";

      // Process streaming response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullText += content;
          await emit({
            kind: "delta",
            delta: content,
            mime: "text/plain",
          });
        }
      }

      return {
        output: {
          answer: fullText.trim(),
          source: "ai" as const,
        },
      };
    } catch (error) {
      console.error("[answer-book] Stream LLM error:", error);

      // Fall back to preset answers
      const answer = getRandomMysticalAnswer();
      for (const char of answer) {
        await emit({
          kind: "delta",
          delta: char,
          mime: "text/plain",
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return {
        output: {
          answer,
          source: "mystical" as const,
        },
      };
    }
  },
});

// ============================================================================
// API: GET /share - Twitter share HTML template endpoint
// ============================================================================

/**
 * HTML escape function to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Parse meta parameter array
 * Format: "key1,value1,key2,value2,..."
 * Returns: { "key1": "value1", "key2": "value2", ... }
 */
function parseMetaArray(metaArray: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < metaArray.length; i += 2) {
    const key = metaArray[i];
    const value = metaArray[i + 1];
    if (key && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Generate HTML template based on meta parameters
 */
function generateShareHtml(meta: Record<string, string>): string {
  const title = escapeHtml(meta["twitter:title"] || "Answer Book");
  const description = escapeHtml(meta["twitter:description"] || "");
  const image = meta["twitter:image"] || "";
  const site = meta["twitter:site"] || "@AnswerBookAI";
  const card = meta["twitter:card"] || "summary_large_image";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <title>${title}</title>

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${escapeHtml(card)}" />
  <meta name="twitter:site" content="${escapeHtml(site)}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${escapeHtml(image)}" />

</head>
<body>
  <p>Twitter Card test page</p>
</body>
</html>`;
}

app.get("/share", async (c) => {
  const metaParam = c.req.query("meta");

  if (!metaParam) {
    return c.text("Missing meta parameter", 400);
  }

  try {
    // Decode meta parameter (may be double-encoded)
    let decodedMeta = decodeURIComponent(metaParam);
    // Try decoding again (handle double-encoding case)
    try {
      decodedMeta = decodeURIComponent(decodedMeta);
    } catch {
      // If second decode fails, use first decode result
    }

    // Parse as array
    const metaArray = decodedMeta.split(",");
    const meta = parseMetaArray(metaArray);

    const html = generateShareHtml(meta);
    return c.html(html, 200);
  } catch (error) {
    console.error("[answer-book] Share meta parse error:", error);
    return c.text("Invalid meta parameter", 400);
  }
});

export { app };
