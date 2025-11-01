"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/product";

const CATS = ["all", "food", "snack", "tea", "juice"] as const;

type StrapiResp = {
  data: any[];
  meta?: any;
};

export default function AdminProductsManager() {
  const [category, setCategory] = useState<(typeof CATS)[number]>("all");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});

  const CMS = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337";

  const title = useMemo(() => (category === "all" ? "All" : category.toUpperCase()), [category]);

  async function fetchList() {
    setLoading(true);
    try {
      const qs = category ? `?category=${category}` : "";
      const res = await fetch(`/api/admin/products${qs}`, { cache: "no-store" });
      const json: StrapiResp = await res.json();
      const mapped: Product[] = (json.data ?? []).map((it: any) => ({
        id: it.id,
        name: it.attributes?.name,
        price: it.attributes?.price,
        category: it.attributes?.category,
        description: it.attributes?.description ?? null,
        image: it.attributes?.image?.data?.attributes?.url
          ? { url: `${CMS}${it.attributes.image.data.attributes.url}` }
          : null,
        orderFormUrl: it.attributes?.orderFormUrl ?? null,
      }));
      setItems(mapped);
    } catch (e) {
      console.error(e);
      alert("목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", price: 0, category, description: "", orderFormUrl: "" });
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm(p);
    setFormOpen(true);
  }

  async function submitForm() {
    const payload: any = {
      name: form.name,
      price: Number(form.price ?? 0),
      category: (form.category === "all" ? null : form.category) ?? null,
      description: form.description ?? null,
      orderFormUrl: form.orderFormUrl ?? null,
    };

    try {
      const res = await fetch(
        editing ? `/api/admin/products/${editing.id}` : `/api/admin/products`,
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setFormOpen(false);
      await fetchList();
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다.");
    }
  }

  async function remove(id: number) {
    if (!confirm("정말 삭제할까요?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await fetchList();
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <section>
      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-6">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full border ${
              category === c ? "bg-orange-500 text-white border-orange-500" : "bg-white text-orange-600 border-orange-300"
            }`}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={openCreate}
          className="rounded bg-orange-500 text-white px-4 py-2 font-semibold hover:bg-orange-600"
        >
          상품 추가
        </button>
      </div>

      <h2 className="text-xl font-bold text-orange-600 mb-3">{title} Products</h2>

      {/* 목록 */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : items.length ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <li key={p.id} className="bg-white rounded-xl p-4 shadow">
              {p.image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image.url} alt={p.name} className="w-full h-40 object-cover rounded-md" />
              ) : (
                <div className="w-full h-40 bg-gray-200 rounded-md grid place-content-center text-gray-500">No Image</div>
              )}
              <div className="mt-2">
                <div className="font-bold">{p.name}</div>
                <div className="text-gray-600">₩{Number(p.price).toLocaleString()}</div>
                <div className="text-gray-500 text-sm">{p.category || "-"}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(p)} className="px-3 py-1 rounded bg-orange-400 text-white hover:bg-orange-500">
                  수정
                </button>
                <button onClick={() => remove(p.id)} className="px-3 py-1 rounded bg-gray-300 text-gray-800 hover:bg-gray-400">
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">상품이 없습니다.</p>
      )}

      {/* 등록/수정 폼 모달(간단 구현) */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-bold mb-3">{editing ? "상품 수정" : "상품 추가"}</h3>
            <div className="grid gap-3">
              <input
                className="border rounded px-3 py-2"
                placeholder="상품명"
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className="border rounded px-3 py-2"
                type="number"
                placeholder="가격"
                value={form.price ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              />
              <select
                className="border rounded px-3 py-2"
                value={form.category ?? "all"}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                className="border rounded px-3 py-2"
                placeholder="설명"
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="주문서 URL (선택)"
                value={form.orderFormUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, orderFormUrl: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2 rounded bg-gray-200">
                취소
              </button>
              <button onClick={submitForm} className="px-4 py-2 rounded bg-orange-500 text-white">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
