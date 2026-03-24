import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JLPT 올인원 스터디",
  description: "N5부터 N1까지 단어, 문형, 퀴즈, 진행도를 한 번에 관리하는 JLPT 학습 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
