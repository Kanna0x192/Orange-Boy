import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/types/product";

type StrapiItem = {
  id: number;
  attributes: {
    name: string;
    price: number;
    description?: string | null;
    category?: string | null;
    image?: { data?: { attributes?: { url?: string } } | null };
  };
};

const CMS = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // ✅ category 파라미터 처리
  const raw = typeof searchParams?.category === "string" ? searchParams.category : "all";
  const category = raw.toLowerCase();

  // ✅ 쿼리 문자열 구성
  let url = `${CMS}/api/products?populate=*`;
  if (category !== "all") {
    url += `&filters[category][$eq]=${category}`;
  }

  // ✅ fetch 시도
  let json: any = {};
  try {
    const res = await fetch(url, { cache: "no-store" });
    json = await res.json();
  } catch (err) {
    console.error("⚠️ Fetch failed:", err);
  }

  // ✅ 안전하게 data 처리
  const data: StrapiItem[] = json?.data ?? [];

  const products: Product[] = data.map((it) => ({
    id: it.id,
    name: it.attributes.name,
    price: it.attributes.price,
    description: it.attributes.description ?? null,
    category: it.attributes.category ?? null,
    image: it.attributes.image?.data?.attributes?.url
      ? { url: `${CMS}${it.attributes.image.data.attributes.url}` }
      : null,
  }));

  // ✅ 페이지 렌더링
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-orange-600 mb-6 capitalize">
        {category === "all" ? "All Products" : `${category}`}
      </h2>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="text-gray-500 text-center mt-10">No products found.</p>
      )}
    </main>
  );
}
