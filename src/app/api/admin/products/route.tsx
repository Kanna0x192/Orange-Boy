import { NextRequest, NextResponse } from "next/server";
import type { NormalizedProductPayload } from "@/lib/fallbackStore";
import { translateTexts } from "@/lib/translate";
import { DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/language";

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const HAS_STRAPI = Boolean(STRAPI_URL && STRAPI_TOKEN);

// 목록
export async function GET(req: NextRequest) {
  const targetLang = (req.nextUrl.searchParams.get("lang") ?? DEFAULT_LANGUAGE) as LanguageCode;

  if (!HAS_STRAPI) {
    const { serializeProductCollection } = await import("@/lib/fallbackStore");
    const payload = serializeProductCollection();
    if (targetLang !== DEFAULT_LANGUAGE && Array.isArray(payload?.data)) {
      await applyTranslations(payload.data, targetLang);
    }
    return NextResponse.json(payload, { status: 200 });
  }

  try {
    const r = await fetch(`${STRAPI_URL}/api/products?populate=*`, {
      headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
      cache: "no-store",
    });
    const text = await r.text();
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { data: [], meta: { source: "strapi", count: 0 } },
        { status: r.status }
      );
    }
    try {
      const json = JSON.parse(text);
      if (targetLang !== DEFAULT_LANGUAGE && Array.isArray(json?.data)) {
        await applyTranslations(json.data, targetLang);
      }
      if (r.ok) {
        return NextResponse.json(json, { status: r.status });
      }
      return NextResponse.json(json, { status: r.status });
    } catch {
      console.error("GET /products non-JSON:", text);
      return NextResponse.json({ error: text }, { status: r.status });
    }
  } catch (e) {
    console.error("GET /products failed:", e);
    return NextResponse.json({ error: "strapi_fetch_failed" }, { status: 502 });
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
  try {
    const body = await req.json();
    const { name, price, description, orderFormUrl, category, imageId } = body;
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

  if (!HAS_STRAPI) {
    const { createFallbackProduct } = await import("@/lib/fallbackStore");
    const fallback = createFallbackProduct(normalizedPayload);
    return NextResponse.json(fallback, { status: 201 });
  }

  try {
    const data: any = {
      name: normalizedPayload.name,
      price: normalizedPayload.price,
      description: normalizedPayload.description,
      orderFormUrl: normalizedPayload.orderFormUrl,
      category: normalizedPayload.category,
      publishedAt: new Date().toISOString(),
    };
    if (
      normalizedPayload.imageId !== null &&
      Number.isFinite(normalizedPayload.imageId)
    ) {
      data.image = normalizedPayload.imageId;
    }

    const r = await fetch(`${STRAPI_URL}/api/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });

    const text = await r.text();
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { data: null, meta: { source: "strapi" } },
        { status: r.status }
      );
    }
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: r.status });
    } catch {
      console.error("POST /products non-JSON:", text);
      return NextResponse.json({ error: text }, { status: r.status });
    }
  } catch (e: any) {
    console.error("POST /products failed:", e);
    return NextResponse.json({ error: "strapi_create_failed" }, { status: 502 });
  }
}
