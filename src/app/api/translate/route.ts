import { NextRequest, NextResponse } from "next/server";
import { translateTexts } from "@/lib/translate";
import type { LanguageCode } from "@/lib/language";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetLang, texts } = body as {
      targetLang?: LanguageCode;
      texts?: string[];
    };

    if (!targetLang || !Array.isArray(texts)) {
      return NextResponse.json(
        { error: "invalid_request" },
        { status: 400 }
      );
    }

    const translated = await translateTexts(texts, targetLang);
    return NextResponse.json({ data: translated });
  } catch (error: any) {
    console.error("Translate API error:", error);
    return NextResponse.json(
      { error: "translation_failed" },
      { status: 500 }
    );
  }
}
