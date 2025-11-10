import { NextRequest, NextResponse } from "next/server";
import type { NormalizedProductPayload } from "@/lib/fallbackStore";
import { supabaseAdmin } from "lib/supabaseClient";

// 단건 조회
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from("products").select("*").eq("id", params.id).single();
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    console.error("GET /products/:id failed:", e);
    return NextResponse.json({ error: "supabase_fetch_failed" }, { status: 500 });
  }
}

// 수정
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  let payload: NormalizedProductPayload;
  let imageUrlForSupabase: string | null = null;
  const paramId = params.id;
  const numericId = Number(paramId);
  const hasNumericId = Number.isFinite(numericId);

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

  try {
    const supabase = supabaseAdmin();
    const data: any = {
      name: normalizedPayload.name,
      price: normalizedPayload.price,
      description: normalizedPayload.description,
      order_form_url: normalizedPayload.orderFormUrl,
      category: normalizedPayload.category,
      locale: normalizedPayload.locale ?? "ko",
      image_url: imageUrlForSupabase,
    };

    const { data: updated, error } = await supabase
      .from("products")
      .update(data)
      .eq("id", paramId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (e: any) {
    console.error("PUT /products failed:", e);
    if (!hasNumericId) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }
    const { updateFallbackProduct } = await import("@/lib/fallbackStore");
    const updated = updateFallbackProduct(numericId, normalizedPayload);
    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(updated, { status: 200 });
  }
}

// 삭제
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const paramId = params.id;
  const numericId = Number(paramId);
  const hasNumericId = Number.isFinite(numericId);

  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("products").delete().eq("id", paramId);
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      throw error;
    }

    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    console.error("DELETE /products failed:", e);
    if (!hasNumericId) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }
    const { deleteFallbackProduct } = await import("@/lib/fallbackStore");
    const removed = deleteFallbackProduct(numericId);
    if (!removed) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  }
}
