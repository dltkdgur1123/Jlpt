import Link from "next/link";
import type { ReactNode } from "react";
import type { JLPTLevel } from "../data/jlpt";

type AppShellProps = {
  children: ReactNode;
  currentLevel?: JLPTLevel;
};

const navItems = [
  { href: "/", label: "홈" },
  { href: "/vocab", label: "단어" },
  { href: "/quiz", label: "퀴즈" },
  { href: "/progress", label: "진행도" },
  { href: "/settings", label: "설정" },
];

function withLevel(href: string, level?: JLPTLevel) {
  if (!level || href === "/") {
    return href;
  }

  return `${href}?level=${level}`;
}

export function AppShell({ children, currentLevel }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" prefetch={false} className="brand">
          <span className="brand-mark">JLPT</span>
          <div>
            <p className="eyebrow">일본어 시험 학습 시스템</p>
            <h1 className="brand-title">JLPT 올인원 스터디</h1>
          </div>
        </Link>
        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={withLevel(item.href, currentLevel)}
              prefetch={false}
              className="nav-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
