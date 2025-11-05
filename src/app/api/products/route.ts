import { strapiFetch } from "@/lib/strapi";
import { translateTexts } from "@/lib/translate";
import { DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/language";

const CATEGORY_PARAM_MAP: Record<string, string> = {
  food: "Food",
  snack: "Snack",
  tea: "Tea",
  juice: "Juice",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requested = searchParams.get("category")?.toLowerCase();
  const targetLang = (searchParams.get("lang") ?? DEFAULT_LANGUAGE) as LanguageCode;
  const qs = new URLSearchParams();
  const mappedCategory = requested ? CATEGORY_PARAM_MAP[requested] : undefined;
  if (mappedCategory) qs.set("filters[category][$eq]", mappedCategory);
  qs.set("populate", "*");
  const data = (await strapiFetch(`/api/products?${qs.toString()}`)) as any;

  if (targetLang !== DEFAULT_LANGUAGE && Array.isArray(data?.data)) {
    const items: any[] = data.data;

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
        if (data.data[idx]?.attributes) {
          data.data[idx].attributes.name = text;
        } else {
          data.data[idx].name = text;
        }
      });
    }

    if (descriptions.length > 0) {
      const translatedDescriptions = await translateTexts(descriptions, targetLang);
      translatedDescriptions.forEach((text, i) => {
        const idx = descriptionIndices[i];
        if (data.data[idx]?.attributes) {
          data.data[idx].attributes.description = text;
        } else {
          data.data[idx].description = text;
        }
      });
    }
  }

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
