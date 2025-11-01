"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await signIn("credentials", {
      redirect: false,      // ✅ 자동 리다이렉트 금지
      username,
      password,
    });

    if (res?.ok) {
      router.push("/admin/products"); // ✅ 성공 시 직접 이동
    } else {
      alert("로그인 실패: 아이디/비밀번호 확인");
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] grid place-items-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow w-96">
        <h1 className="text-2xl font-bold text-orange-600 mb-4">관리자 로그인</h1>
        <input className="border w-full p-2 mb-3 rounded" placeholder="Username" value={username} onChange={e=>setU(e.target.value)} />
        <input className="border w-full p-2 mb-4 rounded" type="password" placeholder="Password" value={password} onChange={e=>setP(e.target.value)} />
        <button className="w-full bg-orange-500 text-white font-semibold py-2 rounded hover:bg-orange-600">로그인</button>
      </form>
    </main>
  );
}
