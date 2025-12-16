"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  QuestionPayload,
  loadProfile,
  saveQuestion,
} from "@/lib/clientState";

const CATEGORIES: QuestionPayload["category"][] = [
  "love",
  "career",
  "money",
  "health",
  "relationships",
  "random",
];

export default function AskPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [category, setCategory] =
    useState<QuestionPayload["category"]>("random");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      router.replace("/setup");
    }
  }, [router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!question.trim()) {
      setError("请先在心里清晰地说出你的问题，并简单写在这里。");
      return;
    }
    if (question.length > 200) {
      setError("问题请控制在 200 字以内。");
      return;
    }

    saveQuestion({ question, category: category ?? "random" });
    router.push("/result");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-50">
          现在，说出你的问题
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          你可以描述一个具体的场景，也可以只写下一个关键词。
          <br />
          重要的是：在心里诚实地对自己说一句“我想知道……？”
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs text-zinc-300">
            你的问题（最多 200 字）
          </label>
          <textarea
            className="min-h-[96px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/70"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={200}
            placeholder="此刻最在意的是什么？把它写下来……"
          />
          <div className="flex justify-between text-[11px] text-zinc-500">
            <span>请尽量用你自己的语言，而不是“我要怎么做才会幸福”这类泛泛的问题。</span>
            <span>
              {question.length}
              /200
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-xs text-zinc-300">可选分类</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c ?? "random"}
                type="button"
                onClick={() => setCategory(c)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs transition ${
                  category === c
                    ? "border-purple-400/80 bg-purple-500/20 text-purple-100"
                    : "border-zinc-700 bg-zinc-950/60 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {c === "love" && "感情"}
                {c === "career" && "事业"}
                {c === "money" && "金钱"}
                {c === "health" && "身心"}
                {c === "relationships" && "人际"}
                {c === "random" && "随缘"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-sky-500 px-8 py-2.5 text-xs font-semibold tracking-wide text-white shadow-lg shadow-purple-900/40 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80"
          >
            下一步：翻开答案书
          </button>
        </div>
      </form>
    </div>
  );
}


