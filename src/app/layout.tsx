"use client";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Header from "@/components/Header";
import Head from "next/head";
import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <body>
        <LanguageProvider>
          {/* next-auth 세션 유지용 provider */}
          <SessionProvider>
            {/* 모든 페이지 상단에 고정되는 배너 */}
            <Header />
            {/* 페이지 내용 */}
            {children}
          </SessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
