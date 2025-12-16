import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <div className="mt-4 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-zinc-500">
          ANSWER BOOK
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-wide text-zinc-50">
          今天，宇宙想跟你说一句话
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          轻轻翻开答案书，为当下的你抽出一句简短指引。
          <br />
          没有对错，只有此刻最适合你的一点提示。
        </p>
      </div>

      <div className="mt-4 w-full rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-5 py-4 shadow-inner shadow-purple-900/30">
        <p className="text-xs text-zinc-400">
          使用方式：
          <br />
          1. 简单填写你的基本信息
          <br />
          2. 想好一个你此刻最在意的问题
          <br />
          3. 支付一次小额费用，翻开这次的答案书
        </p>
      </div>

      <div className="mt-4 flex w-full justify-center">
        <Link
          href="/setup"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-sky-500 px-10 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-purple-900/40 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80"
        >
          开始
        </Link>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-zinc-500 text-center">
        本服务仅供自我反思与娱乐，不构成任何情感、职业、财富或健康等方面的专业建议。
        <br />
        请在安全、理性的前提下，根据自己的判断做出任何现实中的决定。
      </p>
    </div>
  );
}

