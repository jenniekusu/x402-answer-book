import { z } from "zod";
import OpenAI from "openai";
import { cors } from "hono/cors";
import { mkdir } from "fs/promises";

import { createAgentApp } from "@aweto-agent/hono";
import { createAgent } from "@lucid-agents/core";
import { http } from "@lucid-agents/http";
import { payments, paymentsFromEnv } from "@lucid-agents/payments";
import { identity, identityFromEnv } from "@lucid-agents/identity";

// ============================================================================
// Agent Configuration
// ============================================================================

/**
 * ERC-8004 Identity Configuration
 *
 * 配置环境变量：
 * - AGENT_DOMAIN: 你的 Agent 域名
 * - CHAIN_ID: 链 ID（Base 主网: 8453）
 * - RPC_URL: 区块链 RPC 端点
 * - REGISTER_IDENTITY: 是否自动注册（true/false）
 */
const identityConfig = identityFromEnv();

// ============================================================================
// Build Agent Runtime
// ============================================================================

const agentBuilder = createAgent({
  name: process.env.AGENT_NAME ?? "answer-book",
  version: process.env.AGENT_VERSION ?? "0.0.1",
  description:
    process.env.AGENT_DESCRIPTION ??
    "The Book of Answers - A mystical AI oracle that offers philosophical wisdom to illuminate your questions",
  // Open Graph 标签，用于社交分享和 x402scan 发现
  image: process.env.AGENT_IMAGE,
  url: process.env.AGENT_URL,
}).use(http());

// 添加支付功能（如果配置了完整的支付环境变量）
const paymentsConfig = paymentsFromEnv();
const hasRequiredPaymentsConfig =
  process.env.FACILITATOR_URL &&
  process.env.NETWORK &&
  process.env.PAYMENTS_RECEIVABLE_ADDRESS;

if (paymentsConfig && hasRequiredPaymentsConfig) {
  agentBuilder.use(payments({ config: paymentsConfig }));
} else if (process.env.PRIVATE_KEY && !hasRequiredPaymentsConfig) {
  console.warn(
    "[answer-book] PRIVATE_KEY is set but payment configuration is incomplete. Skipping payments setup.",
  );
  console.warn(
    "[answer-book] Required: FACILITATOR_URL, NETWORK, PAYMENTS_RECEIVABLE_ADDRESS",
  );
}

// 添加 ERC-8004 身份认证
agentBuilder.use(identity({ config: identityConfig }));

const agent = await agentBuilder.build();

// ============================================================================
// OpenAI Client Setup
// ============================================================================

const LLM_MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL; // 可选，支持自定义 API 端点

let openai: OpenAI | null = null;

if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL, // 如果设置了自定义端点，会使用它
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

const { app, addEntrypoint } = await createAgentApp(agent);

// ============================================================================
// CORS Configuration
// ============================================================================

app.use(
  "*",
  cors({
    origin: [
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
// Answer Book - 预设的神秘回答（当 LLM 不可用时使用）
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
// Entrypoint: consult - 主要占卜 API (Jennie Demo 格式)
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

    // 计算星座
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

    const prompt = `You are a mystical astrologer and the guardian of the Book of Answers.

Seeker's Profile:
- A ${nameText}${genderText} seeker
- Zodiac Sign: ${sunSignCN} (${sunSign})
- Birth Date: ${profile.birthDate}${timeText}${placeText}

The seeker asks ${categoryDesc}: "${question}"

Your task:
1. Answer the question in a mystical and poetic manner (answer, 40-60 words)
2. Provide an astrological insight based on the seeker's zodiac sign (astroHint, include the sign name, 40-60 words)

Respond in JSON format:
{
  "answer": "Your mystical answer...",
  "astroHint": "As a ${sunSign}, your celestial guidance..."
}

Return only the JSON, with no additional content. Maintain a mystical, poetic, and enlightening tone.`;

    let answer =
      "The pages of destiny are slowly unfolding. Keep your heart calm, and the answer shall reveal itself at the appointed moment.";
    let astroHint = `As a ${sunSign}, your intuition is especially trustworthy at this time. The universe is guiding your path.`;

    const result = await generateWithLLM(prompt);

    if (result) {
      try {
        const parsed = JSON.parse(result.text);
        if (parsed.answer) answer = parsed.answer;
        if (parsed.astroHint) astroHint = parsed.astroHint;
      } catch {
        // 如果 JSON 解析失败，使用 LLM 原始输出作为 answer
        if (result.text && result.text.length > 10) {
          answer = result.text.slice(0, 100);
        }
      }
    }

    return {
      output: {
        answer,
        astroHint,
        cost: CONSULT_PRICE,
        txRef: null, // 交易引用，由支付层处理
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

    // 计算星座
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

    // Generate response using LLM streaming
    const prompt = `You are a mystical astrologer and guardian of the Book of Answers.

User Profile:
- A ${nameText}${genderText} seeker
- Zodiac Sign: ${sunSignCN} (${sunSign})
- Birth Date: ${profile.birthDate}${timeText}${placeText}

The seeker asks ${categoryDesc}: "${question}"

Please respond in a mystical and poetic manner:
1. First, provide your main answer (40-60 words, mystical, poetic, and enlightening)
2. Then, after a line break, give an astrological insight beginning with "🌟 As a ${sunSign}, " (40-60 words)

Output the text directly without JSON format. Maintain a mystical and poetic style.`;

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
// Entrypoint: fortune - 获取今日运势
// ============================================================================

const fortuneInputSchema = z.object({
  name: z.string().optional(),
  birthDate: z.string().optional(), // YYYY-MM-DD 格式
});

const fortuneOutputSchema = z.object({
  fortune: z.string(),
  luckyNumber: z.number(),
  luckyColor: z.string(),
  advice: z.string(),
});

const colors = [
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Blue",
  "Purple",
  "Pink",
  "White",
  "Gold",
  "Silver",
];

addEntrypoint({
  key: "fortune",
  description: "Receive your daily fortune and guidance from the stars",
  input: fortuneInputSchema,
  output: fortuneOutputSchema,
  handler: async (ctx) => {
    const input = ctx.input as z.infer<typeof fortuneInputSchema>;
    const today = new Date().toLocaleDateString("en-US");

    const nameInfo = input.name ? `Seeker's name: ${input.name}` : "";
    const birthInfo = input.birthDate ? `Birth date: ${input.birthDate}` : "";

    const prompt = `You are a mystical fortune teller, keeper of ancient secrets. Provide the seeker with their fortune for today (${today}).

${nameInfo}
${birthInfo}

Return your divination in JSON format:
{
  "fortune": "Today's fortune overview (30-50 words, mystical and poetic)",
  "luckyNumber": A lucky number (integer between 1-99),
  "luckyColor": "A lucky color",
  "advice": "Guidance for today (20-30 words)"
}

Return only the JSON, nothing else.`;

    const result = await generateWithLLM(prompt);

    if (result) {
      try {
        const parsed = JSON.parse(result.text);
        return {
          output: {
            fortune:
              parsed.fortune ||
              "The mists of fate swirl with mystery today. Keep an open heart and mind.",
            luckyNumber:
              parsed.luckyNumber || Math.floor(Math.random() * 99) + 1,
            luckyColor:
              parsed.luckyColor ||
              colors[Math.floor(Math.random() * colors.length)],
            advice:
              parsed.advice ||
              "Let the river of destiny flow; fortune shall find its way.",
          },
          usage: result.usage
            ? {
                total_tokens: result.usage.totalTokens,
              }
            : undefined,
        };
      } catch {
        // JSON parsing failed, return preset content
      }
    }

    // Preset fortune when LLM is unavailable
    const luckyNumber = Math.floor(Math.random() * 99) + 1;
    const luckyColor = colors[Math.floor(Math.random() * colors.length)];
    return {
      output: {
        fortune:
          "Today favors the patient observer. Move not in haste, but let serenity guide your steps. Fortune smiles upon the tranquil heart.",
        luckyNumber,
        luckyColor,
        advice:
          "Drink deeply of life's waters, wear your smile as armor, and blessings shall unfold.",
      },
    };
  },
});

// ============================================================================
// Entrypoint: ask-stream - 流式响应版本
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
// Entrypoint: echo - 测试端点
// ============================================================================

addEntrypoint({
  key: "echo",
  description: "Echo input text (for testing)",
  input: z.object({
    text: z.string().min(1, "Please provide some text."),
  }),
  handler: async (ctx) => {
    const input = ctx.input as { text: string };
    return {
      output: {
        text: input.text,
      },
    };
  },
});

// ============================================================================
// API: GET /share - Twitter 分享 HTML 模板接口
// ============================================================================

/**
 * HTML 转义函数，防止 XSS 攻击
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
 * 解析 meta 参数数组
 * 格式: "key1,value1,key2,value2,..."
 * 返回: { "key1": "value1", "key2": "value2", ... }
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
 * 根据 meta 参数生成 HTML 模板
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
    // 解码 meta 参数（可能是双重编码）
    let decodedMeta = decodeURIComponent(metaParam);
    // 尝试再次解码（处理双重编码的情况）
    try {
      decodedMeta = decodeURIComponent(decodedMeta);
    } catch {
      // 如果第二次解码失败，使用第一次解码的结果
    }

    // 解析为数组
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
