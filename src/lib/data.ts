// 临时内存数据，用于 Vercel 部署（SQLite 在 Vercel 上无法工作）
// 后续可以迁移到 PostgreSQL

export type AnswerData = {
  id: number;
  text: string;
  tags: string;
  tone: string;
  weight: number;
};

export type AstroHintData = {
  id: number;
  zodiacSign: string;
  category: string;
  text: string;
  weight: number;
};

// 答案库（从 seed.ts 中提取的核心数据）
export const answers: AnswerData[] = [
  // love category
  { id: 1, text: "关于感情，你的内心比你想象的更清楚答案。放轻一点期待，让一切自然展开。", tags: "love", tone: "gentle", weight: 3 },
  { id: 2, text: "关于感情，你的内心比你想象的更清楚答案。暂时保持观察，你会看到更清晰的走向。", tags: "love", tone: "neutral", weight: 3 },
  { id: 3, text: "关于感情，你的内心比你想象的更清楚答案。别再拖延，你早就知道该迈出那一步。", tags: "love", tone: "sharp", weight: 3 },
  { id: 4, text: "在感情里，真诚的倾听会打开一扇新的门。放轻一点期待，让一切自然展开。", tags: "love", tone: "gentle", weight: 2 },
  { id: 5, text: "在感情里，真诚的倾听会打开一扇新的门。暂时保持观察，你会看到更清晰的走向。", tags: "love", tone: "neutral", weight: 2 },
  
  // career category
  { id: 101, text: "在事业上，一点点稳步前进，会带来意想不到的转机。放轻一点期待，让一切自然展开。", tags: "career", tone: "gentle", weight: 3 },
  { id: 102, text: "在事业上，一点点稳步前进，会带来意想不到的转机。暂时保持观察，你会看到更清晰的走向。", tags: "career", tone: "neutral", weight: 3 },
  { id: 103, text: "在事业上，一点点稳步前进，会带来意想不到的转机。别再拖延，你早就知道该迈出那一步。", tags: "career", tone: "sharp", weight: 3 },
  { id: 104, text: "在事业上，你的独特节奏比外界的催促更值得相信。放轻一点期待，让一切自然展开。", tags: "career", tone: "gentle", weight: 2 },
  { id: 105, text: "在事业上，你的独特节奏比外界的催促更值得相信。暂时保持观察，你会看到更清晰的走向。", tags: "career", tone: "neutral", weight: 2 },
  
  // money category
  { id: 201, text: "在金钱问题上，脚踏实地的小选择正在悄悄累积力量。放轻一点期待，让一切自然展开。", tags: "money", tone: "gentle", weight: 3 },
  { id: 202, text: "在金钱问题上，脚踏实地的小选择正在悄悄累积力量。暂时保持观察，你会看到更清晰的走向。", tags: "money", tone: "neutral", weight: 3 },
  { id: 203, text: "在金钱问题上，脚踏实地的小选择正在悄悄累积力量。别再拖延，你早就知道该迈出那一步。", tags: "money", tone: "sharp", weight: 3 },
  { id: 204, text: "在金钱与资源上，你正在慢慢建立更健康的边界。放轻一点期待，让一切自然展开。", tags: "money", tone: "gentle", weight: 2 },
  
  // health category
  { id: 301, text: "你的身体在给你温柔的提醒，听一听它真正想说的话。放轻一点期待，让一切自然展开。", tags: "health", tone: "gentle", weight: 3 },
  { id: 302, text: "你的身体在给你温柔的提醒，听一听它真正想说的话。暂时保持观察，你会看到更清晰的走向。", tags: "health", tone: "neutral", weight: 3 },
  { id: 303, text: "在身心状态上，小小的日常调整会带来长期的回响。放轻一点期待，让一切自然展开。", tags: "health", tone: "gentle", weight: 2 },
  
  // relationships category
  { id: 401, text: "在人际相处中，真诚的倾听会打开一扇新的门。放轻一点期待，让一切自然展开。", tags: "relationships", tone: "gentle", weight: 3 },
  { id: 402, text: "在人际相处中，真诚的倾听会打开一扇新的门。暂时保持观察，你会看到更清晰的走向。", tags: "relationships", tone: "neutral", weight: 3 },
  { id: 403, text: "在人际关系中，你的真心会吸引同频的人靠近。放轻一点期待，让一切自然展开。", tags: "relationships", tone: "gentle", weight: 2 },
  
  // random category
  { id: 501, text: "宇宙正在轻轻推动你，朝着更适合你的方向靠近。放轻一点期待，让一切自然展开。", tags: "random", tone: "gentle", weight: 3 },
  { id: 502, text: "宇宙正在轻轻推动你，朝着更适合你的方向靠近。暂时保持观察，你会看到更清晰的走向。", tags: "random", tone: "neutral", weight: 3 },
  { id: 503, text: "宇宙正在轻轻推动你，朝着更适合你的方向靠近。别再拖延，你早就知道该迈出那一步。", tags: "random", tone: "sharp", weight: 3 },
];

// 星座提示库
export const astroHints: AstroHintData[] = [
  // Aries
  { id: 1, zodiacSign: "Aries", category: "love", text: "在感情里，你正在学习更温柔地表达真正的需求。作为Aries，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 2, zodiacSign: "Aries", category: "career", text: "在事业上，你的独特节奏比外界的催促更值得相信。作为Aries，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 3, zodiacSign: "Aries", category: "money", text: "在金钱与资源上，你正在慢慢建立更健康的边界。作为Aries，你最近的直觉特别值得信赖。", weight: 2 },
  
  // Leo
  { id: 101, zodiacSign: "Leo", category: "love", text: "在感情里，你正在学习更温柔地表达真正的需求。作为Leo，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 102, zodiacSign: "Leo", category: "career", text: "在事业上，你的独特节奏比外界的催促更值得相信。作为Leo，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 103, zodiacSign: "Leo", category: "money", text: "在金钱与资源上，你正在慢慢建立更健康的边界。作为Leo，你最近的直觉特别值得信赖。", weight: 2 },
  
  // 其他星座的通用提示
  { id: 201, zodiacSign: "Taurus", category: "love", text: "在感情里，你正在学习更温柔地表达真正的需求。作为Taurus，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 202, zodiacSign: "Gemini", category: "career", text: "在事业上，你的独特节奏比外界的催促更值得相信。作为Gemini，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 203, zodiacSign: "Cancer", category: "health", text: "在身心状态上，小小的日常调整会带来长期的回响。作为Cancer，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 204, zodiacSign: "Virgo", category: "relationships", text: "在人际关系中，你的真心会吸引同频的人靠近。作为Virgo，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 205, zodiacSign: "Libra", category: "love", text: "在感情里，你正在学习更温柔地表达真正的需求。作为Libra，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 206, zodiacSign: "Scorpio", category: "career", text: "在事业上，你的独特节奏比外界的催促更值得相信。作为Scorpio，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 207, zodiacSign: "Sagittarius", category: "money", text: "在金钱与资源上，你正在慢慢建立更健康的边界。作为Sagittarius，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 208, zodiacSign: "Capricorn", category: "health", text: "在身心状态上，小小的日常调整会带来长期的回响。作为Capricorn，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 209, zodiacSign: "Aquarius", category: "relationships", text: "在人际关系中，你的真心会吸引同频的人靠近。作为Aquarius，你最近的直觉特别值得信赖。", weight: 2 },
  { id: 210, zodiacSign: "Pisces", category: "love", text: "在感情里，你正在学习更温柔地表达真正的需求。作为Pisces，你最近的直觉特别值得信赖。", weight: 2 },
];

