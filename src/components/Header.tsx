"use client";

import { useEffect, useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-neutral-100/80 backdrop-blur border-b border-orange-200">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 브랜드 로고 */}
        <Link href="/" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-orange-500">
          {brandText}
        </Link>

        {/* 모바일 메뉴 버튼 */}
        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-orange-300 text-orange-500 shadow-sm"
          >
            <span className="sr-only">Toggle navigation</span>
            <div className="flex flex-col items-center justify-center gap-1.5">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </div>
          </button>
        </div>

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
            {LANGUAGE_OPTIONS.filter((option) => option.code !== "ko").map((option) => (
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

        {/* 모바일 메뉴 */}
        {mobileOpen && (
          <div className="absolute left-0 right-0 top-16 z-40 rounded-b-2xl border border-orange-200 bg-white p-4 shadow-lg md:hidden">
            <div className="flex flex-col gap-3">
              {NAV_ITEMS.map((label) => (
                <HeaderNavItem
                  key={label}
                  labelKey={label}
                  language={language}
                  hrefBase={
                    label === "All"
                      ? "/products"
                      : `/products?category=${label.toLowerCase()}`
                  }
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </div>
            <div className="mt-4 border-t border-orange-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">
                {languageLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.filter((option) => option.code !== "ko").map((option) => (
                  <button
                    key={option.code}
                    onClick={() => {
                      handleLanguageSelect(option.code);
                      setMobileOpen(false);
                    }}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      option.code === language
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-orange-200 bg-white text-orange-500 hover:border-orange-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-orange-100 pt-4">
              <Link
                href="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md border border-orange-300 bg-white px-3 py-2 text-center font-semibold text-orange-500 hover:border-orange-400 hover:text-orange-600"
              >
                {adminText}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

type HeaderNavItemProps = {
  labelKey: typeof NAV_ITEMS[number];
  language: LanguageCode;
  hrefBase: string;
  onNavigate?: () => void;
};

function HeaderNavItem({ labelKey, language, hrefBase, onNavigate }: HeaderNavItemProps) {
  const label = useTranslatedText(labelKey);
  const href =
    language === "ko"
      ? hrefBase
      : `${hrefBase}${hrefBase.includes("?") ? "&" : "?"}lang=${language}`;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      prefetch={false}
      className="text-xl font-semibold text-orange-500/90 hover:text-orange-600 transition-colors"
    >
      {label}
    </Link>
  );
}
