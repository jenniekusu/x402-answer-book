import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAstroProfile } from "@/lib/astro";
import { pickWeightedRandom } from "@/lib/selection";

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

export async function POST(request: NextRequest) {
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

    const now = new Date();
    const since = new Date(now.getTime() - ONE_DAY_MS);

    const recentSessionAnswers = await prisma.sessionAnswer.findMany({
      where: {
        sessionId,
        createdAt: { gte: since },
      },
      select: { answerId: true },
    });

    const usedAnswerIds = recentSessionAnswers.map((s) => s.answerId);

    const baseWhere: { tags?: { contains: string } } = {};
    if (category && category !== "random") {
      baseWhere.tags = { contains: category };
    }

    let candidates = await prisma.answer.findMany({
      where: {
        ...baseWhere,
        id: usedAnswerIds.length ? { notIn: usedAnswerIds } : undefined,
      },
    });

    // If everything was filtered out by 24h rule, fall back to full pool.
    if (!candidates.length) {
      candidates = await prisma.answer.findMany({
        where: baseWhere,
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

    const hintCandidates = await prisma.astroHint.findMany({
      where: {
        zodiacSign: astroProfile.sun,
        category: category && category !== "random" ? category : undefined,
      },
    });

    const hint = pickWeightedRandom(hintCandidates ?? []);

    await prisma.sessionAnswer.create({
      data: {
        sessionId,
        answerId: answer.id,
        zodiacSign: astroProfile.sun,
      },
    });

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


