"use client";

import { useSession, signOut } from "next-auth/react";
import dynamic from "next/dynamic";

// AdminProductsManager만 클라이언트 전용으로 렌더 (SSR 비활성화)
const AdminProductsManager = dynamic(
  () => import("@/components/AdminProductsManager"),
  { ssr: false }
);

export default function AdminProductsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p className="p-6">Loading...</p>;

  if (!session) {
    return (
      <main className="min-h-[calc(100vh-4rem)] grid place-items-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
        <a className="text-orange-600 font-semibold" href="/admin/login">
            로그인 하러가기 →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-orange-600">관리자 상품 관리</h1>
        <button
          className="rounded bg-gray-300 px-3 py-2"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          로그아웃
        </button>
      </div>
      <AdminProductsManager />
    </main>
  );
}
