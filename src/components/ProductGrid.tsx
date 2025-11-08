"use client";
import { useState } from "react";
import type { Product } from "@/types/product";
import { useTranslatedText } from "@/hooks/useTranslatedText";

export default function ProductGrid({ products }: { products: Product[] }) {
  const [current, setCurrent] = useState<Product | null>(null);
  const noImageText = useTranslatedText("No Image");
  const closeText = useTranslatedText("Close");
  const orderText = useTranslatedText("Place an order");
  const orderMissingText = useTranslatedText("Order form link is not available yet.");
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map(p => (
          <button key={p.id} onClick={()=>setCurrent(p)} className="text-left bg-white rounded-lg shadow p-3 hover:shadow-lg transition">
            {p.image?.url
              ? <img src={p.image.url} alt={p.name} className="w-full h-40 object-cover rounded-md" />
              : <div className="w-full h-40 bg-gray-200 rounded-md grid place-content-center text-gray-500">{noImageText}</div>
            }
            <h3 className="font-bold mt-2 text-orange-500">{p.name}</h3>
            <p className="text-gray-700">₩{Number(p.price ?? 0).toLocaleString()}</p>
          </button>
        ))}
      </div>

      {current && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={()=>setCurrent(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-lg" onClick={e=>e.stopPropagation()}>
            {current.image?.url ? (
              <img src={current.image.url} alt={current.name} className="h-60 w-full object-cover" />
            ) : (
              <div className="h-60 w-full bg-gray-200 grid place-content-center text-gray-500 text-sm">{noImageText}</div>
            )}
            <div className="p-5">
              <h2 className="text-2xl font-bold text-orange-600">{current.name}</h2>
              <p className="mt-2 text-gray-700 text-lg">₩{Number(current.price ?? 0).toLocaleString()}</p>
              {current.category && (
                <p className="mt-1 text-sm uppercase tracking-wide text-orange-400">
                  {current.category.toUpperCase()}
                </p>
              )}
              {current.description && <p className="mt-4 text-gray-600 leading-relaxed">{current.description}</p>}
              <div className="mt-6 flex justify-between gap-3">
                <button onClick={()=>setCurrent(null)} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">{closeText}</button>
                {current.orderFormUrl ? (
                  <a
                    href={current.orderFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    {orderText}
                  </a>
                ) : (
                  <span className="self-center text-sm text-gray-400">{orderMissingText}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
