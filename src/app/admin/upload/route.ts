import { Buffer } from "buffer";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET ?? "product-images";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "file 필드가 필요합니다." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name?.split(".").pop() ?? "bin";
    const safeName = file.name?.replace(/\s+/g, "-") || "upload";
    const filePath = `${new Date().toISOString().split("T")[0]}/${randomUUID?.() ?? Date.now()}-${safeName}.${ext}`;

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
    return NextResponse.json({
      id: data.publicUrl,
      url: data.publicUrl,
    });
  } catch (e: any) {
    console.error("Supabase upload failed:", e);
    return NextResponse.json({ message: "Unexpected error", error: String(e) }, { status: 500 });
  }
}
