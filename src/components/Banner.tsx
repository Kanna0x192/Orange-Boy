"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

const NAV = [
  { key: "food", label: "Food" },
  { key: "snack", label: "Snack" },
  { key: "tea", label: "Tea" },
  { key: "juice", label: "Juice" },
  { key: "all", label: "All" },
] as const;

export default function Banner() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const current = (sp.get("category") ?? "all").toLowerCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-100/80 backdrop-blur border-b border-orange-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 브랜드 */}
        <Link href={pathname?.startsWith("/products") ? "/products" : "/"} className="select-none">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-orange-500">
            Orange Boy
          </span>
        </Link>

        {/* 내비 */}
        <nav className="hidden md:flex items-center gap-10">
          {NAV.map(({ key, label }) => {
            const href = key === "all" ? "/products" : `/products?category=${key}`;
            const active = (key === "all" && (current === "all" || !sp.get("category")))
              || current === key;
            return (
              <Link
                key={key}
                href={href}
                className={`text-xl font-semibold transition-colors ${
                  active ? "text-orange-600" : "text-orange-500/90 hover:text-orange-600"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 우측 자리 (언어/관리자 등 필요하면 추가) */}
        <div className="hidden md:flex items-center gap-8">
          <button className="text-lg font-semibold text-orange-500/90 hover:text-orange-600">language</button>
          <button className="text-lg font-semibold text-orange-500/90 hover:text-orange-600">admin</button>
        </div>

        {/* 모바일 여백 */}
        <div className="md:hidden" />
      </div>
    </header>
  );
}
