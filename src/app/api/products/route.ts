import { strapiFetch } from "@/lib/strapi";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const qs = new URLSearchParams();
  if (category && category !== "all") qs.set("filters[category][$eq]", category);
  qs.set("populate", "*");
  const data = await strapiFetch(`/api/products?${qs.toString()}`);
  return Response.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = await strapiFetch(`/api/products`, {
    method: "POST",
    body: JSON.stringify({ data: body }),
  });
  return Response.json(data, { status: 201 });
}
