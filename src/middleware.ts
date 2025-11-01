// src/middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  // ✅ 로그인 페이지는 보호하지 않음. 필요한 페이지만 명시 보호
  matcher: ["/admin/products"],
};
