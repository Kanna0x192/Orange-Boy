"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import type { LanguageCode } from "@/lib/language";

const clientCache = new Map<string, string>();

export function useTranslatedText(source: string, sourceLang: LanguageCode = "ko") {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState(source);

  useEffect(() => {
    let isMounted = true;

    if (language === sourceLang) {
      setTranslated(source);
      return;
    }

    const cacheKey = `${language}:${source}`;
    if (clientCache.has(cacheKey)) {
      setTranslated(clientCache.get(cacheKey)!);
      return;
    }

    async function run() {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetLang: language,
            texts: [source],
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed translate: ${res.status}`);
        }

        const json = (await res.json()) as { data?: string[] };
        const value = json.data?.[0] ?? source;
        clientCache.set(cacheKey, value);
        if (isMounted) {
          setTranslated(value);
        }
      } catch (err) {
        console.error("Translation fetch error:", err);
        if (isMounted) {
          setTranslated(source);
        }
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [language, source, sourceLang]);

  return translated;
}
