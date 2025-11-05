"use client";

import { useTranslatedText } from "@/hooks/useTranslatedText";

export default function Home() {
  const headline = useTranslatedText("Korea’s flavor, delivered anywhere.");
  const subHeadline = useTranslatedText("24-hour Busan delivery by Orange Boy.");

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-6 text-center">
      <h1 className="font-extrabold leading-tight text-white drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]">
        <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
          {headline}
        </span>
        <span className="mt-4 block text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          {subHeadline}
        </span>
      </h1>
    </main>
  );
}
  
