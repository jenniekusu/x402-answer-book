"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Profile, saveProfile } from "@/lib/clientState";

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState<Profile>({
    name: "",
    birthDate: "",
    birthTime: "",
    gender: "",
    birthPlace: "",
  });
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    field: keyof Profile,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.birthDate || !form.birthPlace.trim()) {
      setError("请填写姓名、出生日期和出生城市/国家。");
      return;
    }

    saveProfile(form);
    router.push("/ask");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-50">
          填写你的基本信息
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          信息仅在本次会话中使用，不会被长期存储。我们只会在服务器上保留你的星座与抽到的答案，用于 24 小时内避免重复。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs text-zinc-300">
            姓名<span className="text-red-400">*</span>
          </label>
          <input
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/70"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="可以使用昵称"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs text-zinc-300">
              出生日期<span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/70"
              value={form.birthDate}
              onChange={(e) => handleChange("birthDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-zinc-300">
              出生时间（可选）
            </label>
            <input
              type="time"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/70"
              value={form.birthTime ?? ""}
              onChange={(e) => handleChange("birthTime", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs text-zinc-300">
              性别（可选）
            </label>
            <select
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/70"
              value={form.gender ?? ""}
              onChange={(e) => handleChange("gender", e.target.value)}
            >
              <option value="">不选择</option>
              <option value="F">女性</option>
              <option value="M">男性</option>
              <option value="O">其他 / 不便说明</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-zinc-300">
              出生地点（城市 + 国家）<span className="text-red-400">*</span>
            </label>
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/70"
              value={form.birthPlace}
              onChange={(e) => handleChange("birthPlace", e.target.value)}
              placeholder="例如：Shanghai, China"
            />
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
            下一步：提问
          </button>
        </div>
      </form>
    </div>
  );
}


