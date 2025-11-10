import { NextRequest, NextResponse } from "next/server";
import type { NormalizedProductPayload } from "@/lib/fallbackStore";
import { translateTexts } from "@/lib/translate";
import { DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/language";
import { supabaseAdmin } from "lib/supabaseClient";

// 목록
export async function GET(req: NextRequest) {
  const targetLang = (req.nextUrl.searchParams.get("lang") ?? DEFAULT_LANGUAGE) as LanguageCode;

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const rows = data ?? [];
    if (targetLang !== DEFAULT_LANGUAGE) {
      await applyTranslations(rows, targetLang);
    }

    return NextResponse.json(
      {
        data: rows,
        meta: { source: "supabase", count: rows.length },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("GET /products failed:", e);
    const { serializeProductCollection } = await import("@/lib/fallbackStore");
    const payload = serializeProductCollection();
    if (targetLang !== DEFAULT_LANGUAGE && Array.isArray(payload?.data)) {
      await applyTranslations(payload.data, targetLang);
    }
    return NextResponse.json(payload, { status: 200 });
  }
}

async function applyTranslations(items: any[], targetLang: LanguageCode) {
  const names: string[] = [];
  const nameIndices: number[] = [];
  const descriptions: string[] = [];
  const descriptionIndices: number[] = [];

  items.forEach((item, idx) => {
    const attrs = item?.attributes ?? item ?? {};
    if (attrs?.name) {
      names.push(attrs.name);
      nameIndices.push(idx);
    }
    if (attrs?.description) {
      descriptions.push(attrs.description);
      descriptionIndices.push(idx);
    }
  });

  if (names.length > 0) {
    const translatedNames = await translateTexts(names, targetLang);
    translatedNames.forEach((text, i) => {
      const idx = nameIndices[i];
      if (items[idx]?.attributes) {
        items[idx].attributes.name = text;
      } else {
        items[idx].name = text;
      }
    });
  }

  if (descriptions.length > 0) {
    const translatedDescriptions = await translateTexts(descriptions, targetLang);
    translatedDescriptions.forEach((text, i) => {
      const idx = descriptionIndices[i];
      if (items[idx]?.attributes) {
        items[idx].attributes.description = text;
      } else {
        items[idx].description = text;
      }
    });
  }
}

// 생성
export async function POST(req: NextRequest) {
  let payload: NormalizedProductPayload;
  let imageUrlForSupabase: string | null = null;

  try {
    const body = await req.json();
    const { name, price, description, orderFormUrl, category, imageId, imageUrl, locale } = body;
    if (typeof imageUrl === "string" && imageUrl.length > 0) {
      imageUrlForSupabase = imageUrl;
    } else if (typeof imageId === "string" && imageId.startsWith("http")) {
      imageUrlForSupabase = imageId;
    }
    payload = {
      name: typeof name === "string" ? name : "",
      price: typeof price === "number" ? price : Number(price),
      description: description ?? null,
      orderFormUrl: orderFormUrl ?? null,
      category: category ?? null,
      imageId:
        imageId === null || imageId === undefined
          ? null
          : Number(imageId),
      locale: typeof locale === "string" && locale.length > 0 ? locale : undefined,
    };
  } catch (e: any) {
    console.error("POST /products body parse failed:", e);
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!payload.name || typeof payload.name !== "string") {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!Number.isFinite(payload.price)) {
    return NextResponse.json({ error: "invalid_price" }, { status: 400 });
  }

  const normalizedPayload: NormalizedProductPayload = {
    ...payload,
    name: payload.name.trim(),
  };
  if (!normalizedPayload.name) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();
    const insertPayload = {
      name: normalizedPayload.name,
      price: normalizedPayload.price,
      description: normalizedPayload.description,
      order_form_url: normalizedPayload.orderFormUrl,
      category: normalizedPayload.category,
      locale: normalizedPayload.locale ?? "ko",
      image_url: imageUrlForSupabase,
    };

    const { data, error } = await supabase.from("products").insert(insertPayload).select().single();
    if (error) {
      throw error;
    }

    return NextResponse.json(
      { data, meta: { source: "supabase" } },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("POST /products failed:", e);
    const { createFallbackProduct } = await import("@/lib/fallbackStore");
    const fallback = createFallbackProduct(normalizedPayload);
    return NextResponse.json(fallback, { status: 201 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
