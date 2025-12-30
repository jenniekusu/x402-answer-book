// Temporary in-memory data for Vercel deployments (SQLite cannot run on Vercel)
// Later we can migrate to PostgreSQL

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

// Answer catalog (core data extracted from seed.ts)
export const answers: AnswerData[] = [
  // love category
  { id: 1, text: "Deep down you already know the answer about love. Soften your expectations and let everything unfold naturally.", tags: "love", tone: "gentle", weight: 3 },
  { id: 2, text: "Deep down you already know the answer about love. Stay observant for now and you'll see a clearer direction soon.", tags: "love", tone: "neutral", weight: 3 },
  { id: 3, text: "Deep down you already know the answer about love. Stop delaying—you already know which step to take.", tags: "love", tone: "sharp", weight: 3 },
  { id: 4, text: "In relationships, sincere listening opens a new door. Soften your expectations and let everything unfold naturally.", tags: "love", tone: "gentle", weight: 2 },
  { id: 5, text: "In relationships, sincere listening opens a new door. Stay observant for now and you'll see a clearer direction soon.", tags: "love", tone: "neutral", weight: 2 },
  
  // career category
  { id: 101, text: "In career matters, steady steps forward can bring unexpected turns. Soften your expectations and let everything unfold naturally.", tags: "career", tone: "gentle", weight: 3 },
  { id: 102, text: "In career matters, steady steps forward can bring unexpected turns. Stay observant for now and you'll see a clearer direction soon.", tags: "career", tone: "neutral", weight: 3 },
  { id: 103, text: "In career matters, steady steps forward can bring unexpected turns. Stop delaying—you already know which step to take.", tags: "career", tone: "sharp", weight: 3 },
  { id: 104, text: "In career, your own rhythm is more trustworthy than outside pressure. Soften your expectations and let everything unfold naturally.", tags: "career", tone: "gentle", weight: 2 },
  { id: 105, text: "In career, your own rhythm is more trustworthy than outside pressure. Stay observant for now and you'll see a clearer direction soon.", tags: "career", tone: "neutral", weight: 2 },
  
  // money category
  { id: 201, text: "With money matters, grounded choices are quietly building momentum. Soften your expectations and let everything unfold naturally.", tags: "money", tone: "gentle", weight: 3 },
  { id: 202, text: "With money matters, grounded choices are quietly building momentum. Stay observant for now and you'll see a clearer direction soon.", tags: "money", tone: "neutral", weight: 3 },
  { id: 203, text: "With money matters, grounded choices are quietly building momentum. Stop delaying—you already know which step to take.", tags: "money", tone: "sharp", weight: 3 },
  { id: 204, text: "With money and resources, you're slowly creating healthier boundaries. Soften your expectations and let everything unfold naturally.", tags: "money", tone: "gentle", weight: 2 },
  
  // health category
  { id: 301, text: "Your body is gently reminding you—listen to what it truly wants to say. Soften your expectations and let everything unfold naturally.", tags: "health", tone: "gentle", weight: 3 },
  { id: 302, text: "Your body is gently reminding you—listen to what it truly wants to say. Stay observant for now and you'll see a clearer direction soon.", tags: "health", tone: "neutral", weight: 3 },
  { id: 303, text: "For your mind and body, small daily adjustments create lasting echoes. Soften your expectations and let everything unfold naturally.", tags: "health", tone: "gentle", weight: 2 },
  
  // relationships category
  { id: 401, text: "In relationships, sincere listening opens a new door. Soften your expectations and let everything unfold naturally.", tags: "relationships", tone: "gentle", weight: 3 },
  { id: 402, text: "In relationships, sincere listening opens a new door. Stay observant for now and you'll see a clearer direction soon.", tags: "relationships", tone: "neutral", weight: 3 },
  { id: 403, text: "In relationships, your sincerity draws like-minded people close. Soften your expectations and let everything unfold naturally.", tags: "relationships", tone: "gentle", weight: 2 },
  
  // random category
  { id: 501, text: "The universe is nudging you toward what suits you better. Soften your expectations and let everything unfold naturally.", tags: "random", tone: "gentle", weight: 3 },
  { id: 502, text: "The universe is nudging you toward what suits you better. Stay observant for now and you'll see a clearer direction soon.", tags: "random", tone: "neutral", weight: 3 },
  { id: 503, text: "The universe is nudging you toward what suits you better. Stop delaying—you already know which step to take.", tags: "random", tone: "sharp", weight: 3 },
];

// Zodiac hint catalog
export const astroHints: AstroHintData[] = [
  // Aries
  { id: 1, zodiacSign: "Aries", category: "love", text: "In love, you're learning to express your true needs more gently. As Aries, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 2, zodiacSign: "Aries", category: "career", text: "In career, your own rhythm is more trustworthy than outside pressure. As Aries, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 3, zodiacSign: "Aries", category: "money", text: "With money and resources, you're slowly creating healthier boundaries. As Aries, your intuition is especially trustworthy right now.", weight: 2 },
  
  // Leo
  { id: 101, zodiacSign: "Leo", category: "love", text: "In love, you're learning to express your true needs more gently. As Leo, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 102, zodiacSign: "Leo", category: "career", text: "In career, your own rhythm is more trustworthy than outside pressure. As Leo, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 103, zodiacSign: "Leo", category: "money", text: "With money and resources, you're slowly creating healthier boundaries. As Leo, your intuition is especially trustworthy right now.", weight: 2 },
  
  // General hints for the remaining signs
  { id: 201, zodiacSign: "Taurus", category: "love", text: "In love, you're learning to express your true needs more gently. As Taurus, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 202, zodiacSign: "Gemini", category: "career", text: "In career, your own rhythm is more trustworthy than outside pressure. As Gemini, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 203, zodiacSign: "Cancer", category: "health", text: "For your mind and body, small daily adjustments create lasting echoes. As Cancer, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 204, zodiacSign: "Virgo", category: "relationships", text: "In relationships, your sincerity draws like-minded people close. As Virgo, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 205, zodiacSign: "Libra", category: "love", text: "In love, you're learning to express your true needs more gently. As Libra, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 206, zodiacSign: "Scorpio", category: "career", text: "In career, your own rhythm is more trustworthy than outside pressure. As Scorpio, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 207, zodiacSign: "Sagittarius", category: "money", text: "With money and resources, you're slowly creating healthier boundaries. As Sagittarius, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 208, zodiacSign: "Capricorn", category: "health", text: "For your mind and body, small daily adjustments create lasting echoes. As Capricorn, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 209, zodiacSign: "Aquarius", category: "relationships", text: "In relationships, your sincerity draws like-minded people close. As Aquarius, your intuition is especially trustworthy right now.", weight: 2 },
  { id: 210, zodiacSign: "Pisces", category: "love", text: "In love, you're learning to express your true needs more gently. As Pisces, your intuition is especially trustworthy right now.", weight: 2 },
];
