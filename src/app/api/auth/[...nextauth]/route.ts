import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 테스트용 관리자 계정
        const admin = { id: "1", username: "admin", password: "1234", name: "관리자", email: "admin@example.com" };
        if (credentials?.username === admin.username && credentials?.password === admin.password) {
          return admin;
        }
        return null; // 실패 시 null
      },
    }),
  ],
  // ✅ 로그인 페이지 경로 (이건 유지해도 됨)
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "orangesecret",
});

export { handler as GET, handler as POST };
