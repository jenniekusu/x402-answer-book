import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  "love",
  "career",
  "money",
  "health",
  "relationships",
  "random",
] as const;

const TONES = ["gentle", "neutral", "sharp"] as const;

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

async function seedAnswers() {
  const answersData: {
    text: string;
    tags: string;
    tone: (typeof TONES)[number];
    weight: number;
  }[] = [];

  // 稍微程序化地产生多条中文回答，覆盖不同分类与语气。
  for (const category of CATEGORIES) {
    for (const tone of TONES) {
      for (let i = 1; i <= 10; i++) {
        const base =
          category === "love"
            ? "关于感情，你的内心比你想象的更清楚答案。"
            : category === "career"
              ? "在事业上，一点点稳步前进，会带来意想不到的转机。"
              : category === "money"
                ? "在金钱问题上，脚踏实地的小选择正在悄悄累积力量。"
                : category === "health"
                  ? "你的身体在给你温柔的提醒，听一听它真正想说的话。"
                  : category === "relationships"
                    ? "在人际相处中，真诚的倾听会打开一扇新的门。"
                    : "宇宙正在轻轻推动你，朝着更适合你的方向靠近。";

        const toneSuffix =
          tone === "gentle"
            ? "放轻一点期待，让一切自然展开。"
            : tone === "neutral"
              ? "暂时保持观察，你会看到更清晰的走向。"
              : "别再拖延，你早就知道该迈出那一步。";

        answersData.push({
          text: `${base}${toneSuffix}（${category}·${tone}·${i}）`,
          tags: category,
          tone,
          // 让前几条权重更高，后面的稍低，形成简单的权重分布
          weight: i <= 3 ? 3 : i <= 7 ? 2 : 1,
        });
      }
    }
  }

  await prisma.answer.createMany({
    data: answersData,
  });
}

async function seedAstroHints() {
  const hintsData: {
    zodiacSign: (typeof ZODIAC_SIGNS)[number];
    category: (typeof CATEGORIES)[number];
    text: string;
    weight: number;
  }[] = [];

  for (const sign of ZODIAC_SIGNS) {
    for (const category of CATEGORIES) {
      // 只为非 random 类别生成更具体的提示
      if (category === "random") continue;

      const baseForCategory =
        category === "love"
          ? "在感情里，你正在学习更温柔地表达真正的需求。"
          : category === "career"
            ? "在事业上，你的独特节奏比外界的催促更值得相信。"
            : category === "money"
              ? "在金钱与资源上，你正在慢慢建立更健康的边界。"
              : category === "health"
                ? "在身心状态上，小小的日常调整会带来长期的回响。"
                : "在人际关系中，你的真心会吸引同频的人靠近。";

      const signFlavor = `作为${sign}，你最近的直觉特别值得信赖。`;

      hintsData.push({
        zodiacSign: sign,
        category,
        text: `${baseForCategory}${signFlavor}`,
        weight: 2,
      });

      hintsData.push({
        zodiacSign: sign,
        category,
        text: `如果你愿意稍微放慢一点脚步，${sign}的能量会让你看见更深的线索。`,
        weight: 1,
      });
    }
  }

  await prisma.astroHint.createMany({
    data: hintsData,
  });
}

async function main() {
  console.log("Seeding Answer Book data...");
  await seedAnswers();
  await seedAstroHints();
  console.log("Seeding done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


