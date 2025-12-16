import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withX402 } from "x402-next";
import { getAstroProfile } from "@/lib/astro";
import { pickWeightedRandom } from "@/lib/selection";
import { answers, astroHints, type AnswerData, type AstroHintData } from "@/lib/data";

const profileSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().min(1),
  birthTime: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  birthPlace: z.string().min(1),
});

const bodySchema = z.object({
  profile: profileSchema,
  question: z.string().min(1).max(200),
  category: z
    .enum(["love", "career", "money", "health", "relationships", "random"])
    .optional()
    .nullable(),
});

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getOrCreateSessionId(request: NextRequest): {
  sessionId: string;
  headers: Headers;
} {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const [k, ...rest] = c.split("=");
        return [decodeURIComponent(k), decodeURIComponent(rest.join("="))];
      }),
  );

  let sessionId = cookies["ab_session"];
  const headers = new Headers();

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    headers.append(
      "Set-Cookie",
      `ab_session=${sessionId}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; HttpOnly`,
    );
  }

  return { sessionId, headers };
}

async function handler(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { profile, question, category } = parsed.data;
    const astroProfile = getAstroProfile({ birthDate: profile.birthDate });
    const { sessionId, headers } = getOrCreateSessionId(request);

    // 使用内存数据而不是数据库（SQLite 在 Vercel 上无法工作）
    // TODO: 迁移到 PostgreSQL 以获得完整的数据库功能
    
    // 简单的 24 小时去重：从 cookie 中读取已使用的答案 ID
    const cookieHeader = request.headers.get("cookie") ?? "";
    const usedAnswerIdsCookie = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("ab_used_answers="))
      ?.split("=")[1];
    
    const usedAnswerIds = usedAnswerIdsCookie
      ? JSON.parse(decodeURIComponent(usedAnswerIdsCookie))
      : [];

    // 过滤答案：按分类和已使用的 ID
    let candidates = answers.filter((a) => {
      if (category && category !== "random" && a.tags !== category) {
        return false;
      }
      if (usedAnswerIds.includes(a.id)) {
        return false;
      }
      return true;
    });

    // 如果所有答案都被过滤掉了，重置已使用的列表
    if (!candidates.length) {
      candidates = answers.filter((a) => {
        if (category && category !== "random" && a.tags !== category) {
          return false;
        }
        return true;
      });
    }

    if (!candidates.length) {
      return NextResponse.json(
        { error: "No answers available" },
        { status: 500, headers },
      );
    }

    const answer = pickWeightedRandom(candidates);
    if (!answer) {
      return NextResponse.json(
        { error: "Failed to select answer" },
        { status: 500, headers },
      );
    }

    // 选择星座提示
    const hintCandidates = astroHints.filter((h) => {
      if (h.zodiacSign !== astroProfile.sun) return false;
      if (category && category !== "random" && h.category !== category) {
        return false;
      }
      return true;
    });

    const hint = pickWeightedRandom(hintCandidates.length > 0 ? hintCandidates : astroHints.filter((h) => h.zodiacSign === astroProfile.sun));

    // 更新已使用的答案 ID（存储在 cookie 中，24 小时过期）
    const newUsedIds = [...usedAnswerIds, answer.id].slice(-10); // 只保留最近 10 个
    headers.append(
      "Set-Cookie",
      `ab_used_answers=${encodeURIComponent(JSON.stringify(newUsedIds))}; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax; HttpOnly`,
    );

    const txRef =
      request.headers.get("x-402-payment-reference") ??
      request.headers.get("x-402-payment-id") ??
      null;

    const responseBody = {
      answer: answer.text,
      astroHint: hint?.text ?? null,
      cost: process.env.PRICE ?? "0.5",
      txRef,
      sunSign: astroProfile.sun,
      disclaimer: "仅供自我反思与娱乐使用，不构成任何专业建议。",
    };

    return new NextResponse(JSON.stringify(responseBody), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[/api/answer] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// x402 支付配置
const payTo = process.env.PAY_TO_ADDRESS as `0x${string}` | undefined;
const facilitatorUrl = process.env.X402_FACILITATOR_URL as
  | `http://${string}`
  | `https://${string}`
  | undefined;
const price = process.env.PRICE ?? "0.5";
const network = process.env.CHAIN_ID === "base" ? "base" : "base-sepolia";

// 如果配置了 x402，使用 withX402 wrapper；否则直接导出 handler
export const POST =
  payTo && facilitatorUrl
    ? withX402(
        handler,
        payTo,
        {
          price: `$${price}`,
          network,
          config: {
            description: "Answer Book paid answer",
          },
        },
        {
          url: facilitatorUrl,
        },
      )
    : handler;


