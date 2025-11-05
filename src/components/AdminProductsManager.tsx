"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";

type Product = {
  id?: number;
  name: string;
  price: number;
  category?: string; // "food" | "snack" | "tea" | "juice"
  description?: string;
  image?: { id: number; url: string };
  orderFormUrl?: string;
};

// 화면에 보여줄 카테고리 선택지
const CATEGORIES = ["Food", "Snack", "Tea", "Juice"] as const;
// 클라이언트에서 이미지 표시용 CMS 베이스 URL
const CMS = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337";

export default function AdminProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Partial<Product>>({});
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [usingFallback, setUsingFallback] = useState(false);
  const { language } = useLanguage();

  const filters = ["all", ...CATEGORIES] as const;

  const matchesFilter = (product: Product) => {
    if (filter.toLowerCase() === "all") return true;
    const key = (product.category ?? "").toString().toLowerCase();
    return key === filter.toLowerCase();
  };

  const resolveImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${CMS}${url}`;
  };

  // 상품 목록 불러오기 (에러 안전)
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/products?lang=${language}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("상품 목록 API 오류:", res.status, t);
        setProducts([]);
        return;
      }
      let json: any = { data: [] };
      const rawText = await res.text();
      if (rawText && rawText.trim().length > 0) {
        try {
          json = JSON.parse(rawText);
        } catch (err) {
          console.error("상품 목록 JSON 파싱 오류:", err, rawText);
          setProducts([]);
          return;
        }
      }

      setUsingFallback(json?.meta?.source === "fallback");

      const entries: any[] = Array.isArray(json?.data)
        ? json.data
        : json?.data
        ? [json.data]
        : [];

      const normalized = entries
        .map((d) => {
          const attrs = (d && typeof d === "object" && "attributes" in d ? (d as any).attributes : d) ?? {};

          const imageField = attrs?.image;
          let image: { id: number | undefined; url: string } | undefined;
          if (Array.isArray(imageField) && imageField.length > 0) {
            const first = imageField[0];
            if (first?.url) {
              image = { id: first?.id, url: first.url };
            }
          } else if (imageField?.data) {
            const mediaData = imageField.data;
            const url = mediaData?.attributes?.url;
            if (url) {
              image = { id: mediaData?.id, url };
            }
          } else if (typeof imageField === "string" && imageField.length > 0) {
            image = { id: undefined, url: imageField };
          }

          return {
            id: d?.id ?? attrs?.id ?? undefined,
            name: attrs?.name ?? "",
            price: Number(attrs?.price ?? 0),
            category: attrs?.category ?? undefined,
            description: attrs?.description ?? undefined,
            orderFormUrl: attrs?.orderFormUrl ?? undefined,
            image,
          };
        })
        .filter((p) => p?.id && p.name);

      setProducts(normalized);
    } catch (e) {
      console.error("상품 목록 로드 실패:", e);
      setProducts([]);
    }
  }, [language]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 이미지 업로드 (Strapi로 프록시)
  const handleImageUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("files", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`이미지 업로드 실패: ${res.status} ${t}`);
    }
    const json = await res.json();
    return json[0]; // { id, url, ... }
  };

  const submitForm = async () => {
    if (!form.name || form.name.trim().length === 0) {
      alert("상품명을 입력해 주세요.");
      return;
    }
    if (form.price == null || Number.isNaN(form.price)) {
      alert("가격을 입력해 주세요.");
      return;
    }
    if (!form.category) {
      alert("카테고리를 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      // 이미지 새로 선택했으면 업로드
      let imageId = form.image?.id;
      const anyForm = form as any;
      if (anyForm.newImageFile instanceof File) {
        const uploaded = await handleImageUpload(anyForm.newImageFile);
        imageId = uploaded.id;
      }

      const payload = {
        name: form.name,
        price: form.price,
        description: form.description ?? null,
        orderFormUrl: form.orderFormUrl ?? null,
        category: form.category ?? null,
        imageId: imageId ?? null,
      };

      const res = await fetch(
        editing ? `/api/admin/products/${editing.id}` : `/api/admin/products`,
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      
      if (!res.ok) {
        const detailText = await res.text();
        let detail = detailText;
        try {
          const j = JSON.parse(detailText);
          detail = JSON.stringify(j, null, 2);
        } catch {}
        alert(`상품 저장 실패: ${res.status}\n${detail}`);
        return;
      }

      alert(editing ? "상품 수정 완료" : "상품 추가 완료");
      setForm({});
      setEditing(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("상품 저장 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  // 편집 모드 진입 시 폼 채우기
  useEffect(() => {
    if (editing) {
      setForm({
        id: editing.id,
        name: editing.name,
        price: editing.price,
        description: editing.description,
        orderFormUrl: editing.orderFormUrl,
        category: editing.category,
        image: editing.image,
      });
    }
  }, [editing]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-orange-600 mb-4">상품 관리</h1>

      {usingFallback && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          Strapi 인증 정보를 찾을 수 없어 메모리 기반 테스트 데이터로 동작 중입니다. 서버 재시작 시 데이터가 초기화됩니다.
        </div>
      )}

      {/* 상품 입력/수정 폼 */}
      <div className="bg-white p-4 rounded-lg shadow mb-8 space-y-3">
        <input
          className="border p-2 w-full rounded"
          placeholder="상품명"
          value={form.name ?? ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="border p-2 w-full rounded"
          placeholder="가격"
          type="number"
          value={form.price ?? ""}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          required
        />

        {/* 🔽 카테고리 드롭다운(선택형) */}
        <select
          className="border p-2 rounded w-full"
          value={form.category ?? ""}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        >
          <option value="">카테고리 선택</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <textarea
          className="border p-2 w-full rounded"
          placeholder="상품 설명"
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          className="border p-2 w-full rounded"
          placeholder="주문서 URL (선택)"
          value={form.orderFormUrl ?? ""}
          onChange={(e) => setForm({ ...form, orderFormUrl: e.target.value })}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setForm({
              ...form,
              newImageFile: e.target.files?.[0],
            } as any)
          }
        />

        <div className="flex gap-3">
          <button
            disabled={loading}
            onClick={submitForm}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-60"
          >
            {editing ? "상품 수정" : "상품 추가"}
          </button>

          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({});
              }}
              className="px-4 py-2 rounded border"
            >
              취소
            </button>
          )}
        </div>
      </div>

      {/* 상품 리스트 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((cat) => {
          const isAll = cat === "all";
          const active = filter.toLowerCase() === cat.toLowerCase();
          const label = isAll ? "All" : cat;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-orange-200 bg-white text-orange-500 hover:border-orange-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {products.filter(matchesFilter).map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => setEditing(p)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setEditing(p);
            }}
            className={`bg-white p-3 rounded shadow transition hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              editing?.id === p.id ? "ring-2 ring-orange-400" : ""
            }`}
          >
            {p.image && (
              <img
                src={resolveImageUrl(p.image.url)}
                alt={p.name}
                className="rounded mb-2 w-full aspect-square object-cover"
              />
            )}
            <div className="font-semibold text-orange-600">{p.name}</div>
            <div className="text-gray-700">₩{p.price.toLocaleString()}</div>
            <div className="text-xs text-gray-400 uppercase">
              {p.category ? p.category.toUpperCase() : "-"}
            </div>
            {p.orderFormUrl && (
              <a
                href={p.orderFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-xs text-orange-500 underline"
                onClick={(e) => e.stopPropagation()}
              >
                주문서 링크 열기
              </a>
            )}

            <div className="mt-3 flex gap-3">
              <button
                className="text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(p);
                }}
              >
                수정
              </button>
              <button
                className="text-red-600"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm("삭제하시겠습니까?")) return;
                  const res = await fetch(`/api/admin/products/${p.id}`, {
                    method: "DELETE",
                  });
                  if (!res.ok) {
                    const t = await res.text();
                    alert(`삭제 실패: ${res.status}\n${t}`);
                    return;
                  }
                  fetchProducts();
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
