import { strapiFetch } from "@/lib/strapi";

const CATEGORY_PARAM_MAP: Record<string, string> = {
  food: "Food",
  snack: "Snack",
  tea: "Tea",
  juice: "Juice",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requested = searchParams.get("category")?.toLowerCase();
  const qs = new URLSearchParams();
  const mappedCategory = requested ? CATEGORY_PARAM_MAP[requested] : undefined;
  if (mappedCategory) qs.set("filters[category][$eq]", mappedCategory);
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
