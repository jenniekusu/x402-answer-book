"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AnswerResult,
  Profile,
  QuestionPayload,
  loadProfile,
  loadQuestion,
  saveResult,
} from "@/lib/clientState";

type Status = "idle" | "flipping" | "paying" | "loading" | "done" | "error";

export default function ResultPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);

  useEffect(() => {
    const p = loadProfile();
    const q = loadQuestion();
    if (!p || !q) {
      router.replace("/setup");
      return;
    }
    setProfile(p);
    setQuestion(q);
  }, [router]);

  async function callApiOnce() {
    if (!profile || !question) return;
    setError(null);

    try {
      setStatus("loading");
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          question: question.question,
          category: question.category,
        }),
      });

      if (res.status === 402) {
        setStatus("paying");
        // TODO: 在这里集成 x402 v2 前端支付逻辑：
        // 1. 解析 402 响应中的支付需求（例如 x402 header 或 JSON）
        // 2. 通过 EIP-1193 provider（window.ethereum）发起 USDC on Base 支付
        // 3. 携带支付凭证（通常是 header）重试 /api/answer
        // 目前先简单返回错误提示，方便前后端联调。
        setError("检测到需要支付。请在前端集成 x402 钱包支付逻辑后再重试。");
        setStatus("error");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          data?.error ??
            "暂时无法翻开答案书，请稍后再试，或检查网络/钱包状态。",
        );
        setStatus("error");
        return;
      }

      const data = (await res.json()) as AnswerResult;
      setResult(data);
      saveResult(data);
      setStatus("done");
    } catch (e) {
      console.error(e);
      setError("请求过程中出现问题，请检查网络后再试一次。");
      setStatus("error");
    }
  }

  async function handleFlip() {
    if (!profile || !question) return;
    setStatus("flipping");
    setError(null);

    // 做一个短暂的“翻书”过渡动画
    await new Promise((resolve) => setTimeout(resolve, 600));
    await callApiOnce();
  }

  const disabled = status === "flipping" || status === "loading" || status === "paying";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-50">
          翻开这一次的答案书
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          当你准备好时，深呼吸一下，然后点击下面的按钮。
          <br />
          无论抽到什么答案，请把它当作一次对话的起点，而不是终点。
        </p>
      </div>

      <div className="relative mt-4 flex justify-center">
        <button
          type="button"
          onClick={handleFlip}
          disabled={disabled}
          className={`group relative h-32 w-48 origin-left rounded-xl border border-purple-400/40 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-sm font-medium tracking-wide text-zinc-100 shadow-2xl shadow-purple-900/40 transition-transform duration-500 ${
            status === "flipping"
              ? "rotate-y-180"
              : "hover:-translate-y-1 hover:shadow-purple-700/40"
          } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_10%_20%,rgba(216,180,254,0.35),transparent_50%),radial-gradient(circle_at_80%_0,rgba(96,165,250,0.3),transparent_55%)] opacity-80 mix-blend-screen" />
          <span className="relative z-10">
            {status === "loading" || status === "paying"
              ? "正在翻页与结算……"
              : status === "done"
                ? "再翻一次"
                : "翻开答案书"}
          </span>
        </button>
      </div>

      {status === "loading" || status === "paying" || status === "flipping" ? (
        <p className="text-xs text-zinc-400">
          {status === "paying"
            ? "等待支付确认中……请在钱包中完成签名或交易。"
            : "宇宙正在翻动书页，请稍等几秒。"}
        </p>
      ) : null}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/20 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              ANSWER
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-50">
              {result.answer}
            </p>
          </div>

          {result.astroHint && (
            <div className="border-l border-purple-500/50 pl-3 text-xs text-zinc-300">
              <p className="text-[10px] uppercase tracking-[0.2em] text-purple-300/80">
                ASTRO HINT · {result.sunSign}
              </p>
              <p className="mt-1 leading-relaxed">
                {result.astroHint}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-500">
            <span>
              费用：{result.cost} USDC · 网络：Base
            </span>
            {result.txRef && (
              <span className="truncate">
                支付参考：{result.txRef}
              </span>
            )}
            <span>{result.disclaimer}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2 text-[11px] text-zinc-500">
        <button
          type="button"
          onClick={() => router.push("/ask")}
          className="underline-offset-4 hover:underline"
        >
          返回修改问题
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="underline-offset-4 hover:underline"
        >
          回到首页
        </button>
      </div>
    </div>
  );
}


