import { NextRequest, NextResponse } from "next/server";
import type { NormalizedProductPayload } from "@/lib/fallbackStore";

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const HAS_STRAPI = Boolean(STRAPI_URL && STRAPI_TOKEN);

// 수정
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  let payload: NormalizedProductPayload;
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

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
    console.error("PUT /products body parse failed:", e);
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!payload.name) {
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
    const { updateFallbackProduct } = await import("@/lib/fallbackStore");
    const updated = updateFallbackProduct(id, normalizedPayload);
    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(updated, { status: 200 });
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

    const r = await fetch(`${STRAPI_URL}/api/products/${params.id}`, {
      method: "PUT",
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
      console.error("PUT /products non-JSON:", text);
      return NextResponse.json({ error: text }, { status: r.status });
    }
  } catch (e: any) {
    console.error("PUT /products failed:", e);
    return NextResponse.json({ error: "strapi_update_failed" }, { status: 502 });
  }
}

// 삭제
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  if (!HAS_STRAPI) {
    const { deleteFallbackProduct } = await import("@/lib/fallbackStore");
    const removed = deleteFallbackProduct(id);
    if (!removed) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  }

  try {
    const r = await fetch(`${STRAPI_URL}/api/products/${params.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
    });

    const text = await r.text();
    if (!text || text.trim().length === 0) {
      return new NextResponse(null, { status: r.status });
    }
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: r.status });
    } catch {
      console.error("DELETE /products non-JSON:", text);
      return NextResponse.json({ error: text }, { status: r.status });
    }
  } catch (e: any) {
    console.error("DELETE /products failed:", e);
    return NextResponse.json({ error: "strapi_delete_failed" }, { status: 502 });
  }
}
