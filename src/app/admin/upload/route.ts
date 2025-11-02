import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN!;

/**
 * 클라이언트 → Next API로 파일 전송(FormData: file)
 * Next API → Strapi /api/upload 로 그대로 포워딩
 * 응답 형식(배열) 중 첫 항목의 { id, url } 반환
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "file 필드가 필요합니다." }, { status: 400 });
    }

    const upstream = new FormData();
    // Strapi는 "files" 키로 받습니다.
    upstream.append("files", file, file.name);

    const res = await fetch(`${STRAPI_URL}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: upstream,
      // 업로드는 캐시 금지
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ message: "Upload failed", detail: text }, { status: res.status });
    }

    const out = await res.json(); // 배열
    const first = Array.isArray(out) ? out[0] : null;
    if (!first?.id) {
      return NextResponse.json({ message: "Invalid upload response", out }, { status: 500 });
    }

    return NextResponse.json({
      id: first.id,
      url: first.url, // 보통 /uploads/.. 형태
    });
  } catch (e: any) {
    return NextResponse.json({ message: "Unexpected error", error: String(e) }, { status: 500 });
  }
}
