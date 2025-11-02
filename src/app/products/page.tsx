import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/types/product";

type StrapiItem = {
  id: number;
  attributes: {
    name: string;
    price: number;
    description?: string | null;
    category?: string | null;
    orderFormUrl?: string | null;
    image?: { data?: { attributes?: { url?: string } } | null };
  };
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
    .filter((it): it is StrapiItem & { attributes: StrapiItem["attributes"] } =>
      Boolean(it && it.attributes)
    )
    .map((it) => ({
      id: it.id,
      name: it.attributes.name,
      price: it.attributes.price,
      description: it.attributes.description ?? null,
      category: it.attributes.category ?? null,
      orderFormUrl: it.attributes.orderFormUrl ?? null,
      image: it.attributes.image?.data?.attributes?.url
        ? { url: `${CMS}${it.attributes.image.data.attributes.url}` }
        : null,
    }));

  // ✅ 페이지 렌더링
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-orange-600 mb-6 capitalize">
        {categoryParam === "all"
          ? "All Products"
          : strapiCategory ?? categoryParam}
      </h2>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="text-gray-500 text-center mt-10">
          No products found.
        </p>
      )}
    </main>
  );
}
