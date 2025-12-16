export type AstroProfileInput = {
  birthDate: string; // ISO yyyy-mm-dd
};

export type AstroProfile = {
  sun: string;
  moon?: string | null;
  rising?: string | null;
};

// Simple Western zodiac by date range, ignoring year and time.
export function getAstroProfile(input: AstroProfileInput): AstroProfile {
  const sun = getSunSign(input.birthDate);
  return { sun, moon: null, rising: null };
}

export function getSunSign(birthDate: string): string {
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const month = date.getUTCMonth() + 1; // 1-12
  const day = date.getUTCDate();

  // Ranges are inclusive of start, exclusive of end (approximate).
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces";

  return "Unknown";
}


