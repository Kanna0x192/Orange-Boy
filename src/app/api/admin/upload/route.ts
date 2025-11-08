import { Buffer } from "buffer";
import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const HAS_STRAPI = Boolean(STRAPI_URL && STRAPI_TOKEN);

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

    if (HAS_STRAPI) {
      try {
        const res = await fetch(`${STRAPI_URL}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
          body: formData,
        });

        const text = await res.text();
        try {
          const json = JSON.parse(text);
          return NextResponse.json(json, { status: res.status });
        } catch {
          console.error("Upload non-JSON:", text);
          return NextResponse.json({ error: text }, { status: res.status });
        }
      } catch (err) {
        console.error("Upload proxy failed:", err);
        return NextResponse.json({ error: "strapi_upload_failed" }, { status: 502 });
      }
    }
  } catch (err: any) {
    console.error("Upload handling failed:", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
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
