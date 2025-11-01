"use client";

import Link from "next/link";

const NAV_ITEMS = ["Food", "Snack", "Tea", "Juice", "All"];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-neutral-100/80 backdrop-blur border-b border-orange-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 브랜드 로고 */}
        <Link href="/" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-orange-500">
          Orange Boy
        </Link>

        {/* 카테고리 */}
        <nav className="hidden md:flex items-center gap-10">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item}
              href={
                item === "All"
                  ? "/products"
                  : `/products?category=${item.toLowerCase()}`
              }
              className="text-xl font-semibold text-orange-500/90 hover:text-orange-600 transition-colors"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* 오른쪽 메뉴 */}
        <div className="hidden md:flex items-center gap-8">
          <button className="text-lg font-semibold text-orange-500/90 hover:text-orange-600">
            language
          </button>
          {/* ✅ admin 클릭 시 로그인 페이지로 이동 */}
          <Link
            href="/admin/login"
            className="text-lg font-semibold text-orange-500/90 hover:text-orange-600"
          >
            admin
          </Link>
        </div>
      </div>
    </header>
  );
}
