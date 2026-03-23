import type { ReactNode } from "react";

type JapaneseTextProps = {
  annotatedText: string;
  className?: string;
};

const tokenPattern = /([^\s{}]+)\{([^{}]+)\}/g;

export function JapaneseText({ annotatedText, className }: JapaneseTextProps) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(annotatedText)) !== null) {
    const [fullMatch, base, reading] = match;
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      parts.push(annotatedText.slice(lastIndex, startIndex));
    }

    parts.push(
      <ruby key={`${base}-${reading}-${startIndex}`}>
        {base}
        <rt>{reading}</rt>
      </ruby>,
    );

    lastIndex = startIndex + fullMatch.length;
  }

  if (lastIndex < annotatedText.length) {
    parts.push(annotatedText.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
