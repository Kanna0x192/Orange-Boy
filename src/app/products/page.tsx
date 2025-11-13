import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/types/product";
import { translateTexts } from "@/lib/translate";
import { DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/language";
import { supabaseAdmin } from "@/lib/supabaseClient";

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
  const mappedCategory = CATEGORY_PARAM_MAP[categoryParam];
  const targetLang = (typeof searchParams?.lang === "string"
    ? searchParams.lang
    : DEFAULT_LANGUAGE) as LanguageCode;

  // ✅ Supabase에서 상품 조회
  const supabase = supabaseAdmin();
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (
    mappedCategory &&
    mappedCategory !== "all" &&
    categoryParam !== "all"
  ) {
    query = query.eq("category", mappedCategory);
  }

  let rows: any[] = [];
  try {
    const { data, error } = await query;
    if (error) throw error;
    rows = data ?? [];
  } catch (err) {
    console.error("⚠️ Supabase fetch failed:", err);
  }

  const products: Product[] = rows
    .map((row) => ({
      id: row.id,
      name: row.name ?? "",
      price: Number(row.price ?? 0),
      description: row.description ?? null,
      category: row.category ?? null,
      orderFormUrl: row.order_form_url ?? row.orderFormUrl ?? null,
      image: row.image_url ? { url: row.image_url } : null,
    }))
    .filter((p) => p.name);

  let headingText =
    categoryParam === "all"
      ? "All Products"
      : mappedCategory ?? categoryParam;
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
