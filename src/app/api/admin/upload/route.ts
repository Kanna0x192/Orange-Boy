import { Buffer } from "buffer";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET ?? "product-images";

export async function POST(req: NextRequest) {
  let file: File | null = null;
  try {
    const formData = await req.formData();
    const entry = formData.get("files") ?? formData.get("file");
    if (entry instanceof File) {
      file = entry;
    } else {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }

    if (file) {
      const supabase = supabaseAdmin();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileExt = file.name?.split(".").pop() ?? "bin";
      const safeName = file.name?.replace(/\s+/g, "-") || "upload";
      const filePath = `${new Date().toISOString().split("T")[0]}/${randomUUID?.() ?? Date.now()}-${safeName}.${fileExt}`;
      const { error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(filePath, buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
      const url = data.publicUrl;
      return NextResponse.json([{ id: url, url }], { status: 200 });
    }
  } catch (err) {
    console.error("Supabase upload failed, falling back to base64:", err);
  }

  if (!file) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }

  const { createFallbackImage } = await import("@/lib/fallbackStore");
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mime = file.type || "application/octet-stream";
  const url = `data:${mime};base64,${base64}`;
  const stored = createFallbackImage(url);
  return NextResponse.json(
    [
      {
        id: stored.id,
        url: stored.url,
      },
    ],
    { status: 200 }
  );
}
