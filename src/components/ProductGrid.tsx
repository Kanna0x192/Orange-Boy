'use client';
import { useState } from 'react';
import type { Product } from '@/types/product';

export default function ProductGrid({ products }: { products: Product[] }) {
  const [current, setCurrent] = useState<Product | null>(null);
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {products.map(p => (
          <button key={p.id} onClick={()=>setCurrent(p)} className="text-left bg-white rounded-lg shadow p-3 hover:shadow-lg transition">
            {p.image?.url
              ? <img src={p.image.url} alt={p.name} className="w-full h-40 object-cover rounded-md" />
              : <div className="w-full h-40 bg-gray-200 rounded-md grid place-content-center text-gray-500">No Image</div>
            }
            <h3 className="font-bold mt-2 text-orange-500">{p.name}</h3>
            <p className="text-gray-700">₩{Number(p.price ?? 0).toLocaleString()}</p>
          </button>
        ))}
      </div>

      {current && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={()=>setCurrent(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg" onClick={e=>e.stopPropagation()}>
            <h2 className="text-xl font-bold text-orange-600">{current.name}</h2>
            <p className="mt-2 text-gray-700">₩{Number(current.price ?? 0).toLocaleString()}</p>
            {current.description && <p className="mt-2 text-gray-600">{current.description}</p>}
            <div className="mt-4 flex justify-end">
              <button onClick={()=>setCurrent(null)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
