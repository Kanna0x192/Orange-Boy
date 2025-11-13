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
  const strapiCategory = CATEGORY_PARAM_MAP[categoryParam];
  const targetLang = (typeof searchParams?.lang === "string"
    ? searchParams.lang
    : DEFAULT_LANGUAGE) as LanguageCode;

  // Supabase에서 직접 데이터 가져오기
  let products: Product[] = [];

  try {
    const supabase = supabaseAdmin();
    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    // 카테고리 필터
    if (categoryParam !== "all" && strapiCategory && strapiCategory !== "all") {
      query = query.eq("category", strapiCategory);
    }

    const { data, error } = await query;

    if (error) throw error;

    products = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name || "",
      price: Number(item.price || 0),
      description: item.description || null,
      category: item.category || null,
      orderFormUrl: item.order_form_url || null,
      image: item.image_url ? { url: item.image_url } : null,
    }));
  } catch (err) {
    console.error("⚠️ Fetch failed:", err);
  }

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

  // 페이지 렌더링
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