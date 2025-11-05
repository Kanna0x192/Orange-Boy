"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGE_OPTIONS, type LanguageCode } from "@/lib/language";
import { useTranslatedText } from "@/hooks/useTranslatedText";

const NAV_ITEMS = ["Food", "Snack", "Tea", "Juice", "All"] as const;

export default function Header() {
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const brandText = useTranslatedText("Orange Boy");
  const adminText = useTranslatedText("admin");
  const languageLabel = useTranslatedText("language");

  const handleLanguageSelect = (code: LanguageCode) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (code === "ko") {
      params.delete("lang");
    } else {
      params.set("lang", code);
    }
    setLanguage(code);
    setOpen(false);
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-neutral-100/80 backdrop-blur border-b border-orange-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 브랜드 로고 */}
        <Link href="/" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-orange-500">
          {brandText}
        </Link>

        {/* 카테고리 */}
        <nav className="hidden md:flex items-center gap-10">
          <HeaderNavItem labelKey="Food" language={language} hrefBase="/products?category=food" />
          <HeaderNavItem labelKey="Snack" language={language} hrefBase="/products?category=snack" />
          <HeaderNavItem labelKey="Tea" language={language} hrefBase="/products?category=tea" />
          <HeaderNavItem labelKey="Juice" language={language} hrefBase="/products?category=juice" />
          <HeaderNavItem labelKey="All" language={language} hrefBase="/products" />
        </nav>

        {/* 오른쪽 메뉴 */}
        <div className="hidden md:flex items-center gap-8">
          <div className="relative">
            <button
              onClick={() => setOpen((p) => !p)}
              className="flex items-center gap-2 rounded-md border border-orange-200 bg-white px-3 py-1.5 text-lg font-semibold text-orange-500/90 hover:border-orange-400 hover:text-orange-600"
            >
              {languageLabel}
              <span className="text-sm uppercase text-orange-400">{language}</span>
            </button>
            {open && (
              <ul className="absolute right-0 mt-2 w-40 rounded-lg border border-orange-200 bg-white shadow-lg">
                {LANGUAGE_OPTIONS.map((option) => (
                  <li key={option.code}>
                    <button
                      onClick={() => handleLanguageSelect(option.code)}
                      className={`w-full px-3 py-2 text-left text-sm ${
                        option.code === language
                          ? "bg-orange-100 text-orange-600"
                          : "hover:bg-orange-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* ✅ admin 클릭 시 로그인 페이지로 이동 */}
          <Link
            href="/admin/login"
            className="text-lg font-semibold text-orange-500/90 hover:text-orange-600"
          >
            {adminText}
          </Link>
        </div>
      </div>
    </header>
  );
}

type HeaderNavItemProps = {
  labelKey: typeof NAV_ITEMS[number];
  language: LanguageCode;
  hrefBase: string;
};

function HeaderNavItem({ labelKey, language, hrefBase }: HeaderNavItemProps) {
  const label = useTranslatedText(labelKey);
  const href =
    language === "ko"
      ? hrefBase
      : `${hrefBase}${hrefBase.includes("?") ? "&" : "?"}lang=${language}`;

  return (
    <Link
      href={href}
      className="text-xl font-semibold text-orange-500/90 hover:text-orange-600 transition-colors"
    >
      {label}
    </Link>
  );
}
