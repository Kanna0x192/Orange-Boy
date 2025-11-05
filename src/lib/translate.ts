import { LANGUAGE_OPTIONS, type LanguageCode } from "./language";

const BASE_ENDPOINT =
  process.env.DEEPL_API_ENDPOINT ?? "https://api-free.deepl.com/v2/translate";
const API_KEY = process.env.DEEPL_API_KEY;

type CacheKey = `${LanguageCode}:${string}`;
const translationCache = new Map<CacheKey, string>();

function getDeepLLanguage(code: LanguageCode) {
  const option = LANGUAGE_OPTIONS.find((opt) => opt.code === code);
  return option?.deeplCode;
}

export async function translateTexts(
  texts: string[],
  target: LanguageCode,
  source: LanguageCode = "ko"
): Promise<string[]> {
  if (target === source) {
    return texts;
  }

  const deeplTarget = getDeepLLanguage(target);
  const deeplSource = getDeepLLanguage(source);

  if (!API_KEY || !deeplTarget) {
    // DeepL key missing or unsupported language; fall back to original text.
    return texts;
  }

  const results: string[] = [];
  const uncachedTexts: string[] = [];
  const uncachedIndices: number[] = [];

  texts.forEach((text, idx) => {
    const key: CacheKey = `${target}:${text}`;
    if (translationCache.has(key)) {
      results[idx] = translationCache.get(key)!;
    } else {
      results[idx] = text; // temporary placeholder; will be replaced.
      uncachedTexts.push(text);
      uncachedIndices.push(idx);
    }
  });

  if (uncachedTexts.length === 0) {
    return results;
  }

  const params = new URLSearchParams();
  params.append("auth_key", API_KEY);
  params.append("target_lang", deeplTarget);
  if (deeplSource) {
    params.append("source_lang", deeplSource);
  }
  for (const text of uncachedTexts) {
    params.append("text", text);
  }

  try {
    const response = await fetch(BASE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error("DeepL translation failed:", response.status, await response.text());
      return texts;
    }

    const json = (await response.json()) as {
      translations: Array<{ text: string }>;
    };

    json.translations.forEach((item, idx) => {
      const originalIndex = uncachedIndices[idx];
      const translated = item.text ?? uncachedTexts[idx];
      const originalText = uncachedTexts[idx];
      results[originalIndex] = translated;
      translationCache.set(`${target}:${originalText}`, translated);
    });

    return results;
  } catch (error) {
    console.error("DeepL translation error:", error);
    return texts;
  }
}

export function translateText(
  text: string,
  target: LanguageCode,
  source: LanguageCode = "ko"
) {
  return translateTexts([text], target, source).then(([result]) => result);
}
