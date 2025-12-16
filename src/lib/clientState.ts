export type Profile = {
  name: string;
  birthDate: string;
  birthTime?: string | null;
  gender?: string | null;
  birthPlace: string;
};

export type QuestionPayload = {
  question: string;
  category:
    | "love"
    | "career"
    | "money"
    | "health"
    | "relationships"
    | "random"
    | null;
};

const PROFILE_KEY = "ab_profile_v1";
const QUESTION_KEY = "ab_question_v1";
const RESULT_KEY = "ab_result_v1";

export type AnswerResult = {
  answer: string;
  astroHint: string | null;
  cost: string;
  txRef: string | null;
  sunSign: string;
  disclaimer: string;
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  return safeParse<Profile>(sessionStorage.getItem(PROFILE_KEY));
}

export function saveQuestion(payload: QuestionPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(QUESTION_KEY, JSON.stringify(payload));
}

export function loadQuestion(): QuestionPayload | null {
  if (typeof window === "undefined") return null;
  return safeParse<QuestionPayload>(sessionStorage.getItem(QUESTION_KEY));
}

export function saveResult(result: AnswerResult) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

export function loadResult(): AnswerResult | null {
  if (typeof window === "undefined") return null;
  return safeParse<AnswerResult>(sessionStorage.getItem(RESULT_KEY));
}


