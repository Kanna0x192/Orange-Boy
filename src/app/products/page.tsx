import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/types/product";
import { translateTexts } from "@/lib/translate";
import { DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/language";

type StrapiItem = {
  id: number;
  attributes?: {
    name?: string;
    price?: number;
    description?: string | null;
    category?: string | null;
    orderFormUrl?: string | null;
    image?: { data?: { attributes?: { url?: string } } | null };
  };
  name?: string;
  price?: number;
  description?: string | null;
  category?: string | null;
  orderFormUrl?: string | null;
  image?:
    | { data?: { attributes?: { url?: string } } | null }
    | Array<{ url?: string; id?: number }>
    | string
    | null;
};

const CMS = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337";

const CATEGORY_PARAM_MAP: Record<string, string> = {
  food: "Food",
  snack: "Snack",
  tea: "Tea",
  juice: "Juice",
  all: "all",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // ✅ category 파라미터 처리
  const raw =
    typeof searchParams?.category === "string"
      ? searchParams.category
      : "all";
  const categoryParam = raw.toLowerCase();
  const strapiCategory = CATEGORY_PARAM_MAP[categoryParam];
  const targetLang = (typeof searchParams?.lang === "string"
    ? searchParams.lang
    : DEFAULT_LANGUAGE) as LanguageCode;

  // ✅ 쿼리 문자열 구성
  const url =
    categoryParam === "all" || !strapiCategory || strapiCategory === "all"
      ? `${CMS}/api/products?populate=*`
      : `${CMS}/api/products?populate=*&filters[category][$eq]=${strapiCategory}`;

  // ✅ fetch 시도
  let json: any = {};
  try {
    const res = await fetch(url, { cache: "no-store" });
    json = await res.json();
  } catch (err) {
    console.error("⚠️ Fetch failed:", err);
  }

  // ✅ 안전하게 data 처리
  const data: StrapiItem[] = Array.isArray(json?.data) ? json.data : [];

  const products: Product[] = data
    .map((it) => {
      const attrs = it.attributes ?? it;

      let imageUrl: string | null = null;
      const imageField = attrs?.image;
      if (Array.isArray(imageField) && imageField.length > 0) {
        imageUrl = imageField[0]?.url ?? null;
      } else if (
        typeof imageField === "object" &&
        imageField !== null &&
        "data" in imageField &&
        (imageField as any)?.data?.attributes?.url
      ) {
        imageUrl = (imageField as any).data.attributes.url;
      } else if (typeof imageField === "string") {
        imageUrl = imageField;
      }

      return {
        id: it.id,
        name: attrs?.name ?? "",
        price: Number(attrs?.price ?? 0),
        description: attrs?.description ?? null,
        category: attrs?.category ?? null,
        orderFormUrl: attrs?.orderFormUrl ?? null,
        image: imageUrl ? { url: imageUrl.startsWith("http") ? imageUrl : `${CMS}${imageUrl}` } : null,
      } satisfies Product;
    })
    .filter((p) => Boolean(p.name));

  let headingText =
    categoryParam === "all"
      ? "All Products"
      : strapiCategory ?? categoryParam;
  let emptyStateText = "No products found.";

  if (targetLang !== DEFAULT_LANGUAGE) {
    if (products.length > 0) {
      const nameTranslations = await translateTexts(
        products.map((p) => p.name),
        targetLang
      );
      const descTranslations = await translateTexts(
        products.map((p) => p.description ?? ""),
        targetLang
      );

      products.forEach((product, idx) => {
        product.name = nameTranslations[idx] ?? product.name;
        const translatedDesc = descTranslations[idx];
        if (translatedDesc) {
          product.description = translatedDesc;
        }
      });
    }

    const [translatedHeading, translatedEmpty] = await translateTexts(
      [headingText, emptyStateText],
      targetLang
    );
    headingText = translatedHeading ?? headingText;
    emptyStateText = translatedEmpty ?? emptyStateText;
  }

  // ✅ 페이지 렌더링
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-orange-600 mb-6 capitalize">
        {headingText}
      </h2>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="text-gray-500 text-center mt-10">
          {emptyStateText}
        </p>
      )}
    </main>
  );
}
