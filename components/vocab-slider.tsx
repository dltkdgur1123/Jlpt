"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { JapaneseText } from "./japanese-text";
import {
  DAILY_VOCAB_LIMIT_KEY,
  DEFAULT_DAILY_VOCAB_LIMIT,
} from "../lib/study-settings";
import type { GrammarItem, JLPTLevel, VocabItem } from "../data/jlpt";

type MemoryState = "미학습" | "암기됨" | "복습 필요";

type StudyCard =
  | {
      key: string;
      id: number;
      kind: "vocab";
      title: string;
      reading: string;
      meaning: string;
      example: string;
      exampleFurigana: string;
      exampleTranslation: string;
      badge: string;
    }
  | {
      key: string;
      id: number;
      kind: "grammar";
      title: string;
      reading: string;
      meaning: string;
      example: string;
      exampleFurigana: string;
      exampleTranslation: string;
      badge: string;
    };

type VocabSliderProps = {
  level: JLPTLevel;
  vocabItems: VocabItem[];
  grammarItems: GrammarItem[];
};

export function VocabSlider({ level, vocabItems, grammarItems }: VocabSliderProps) {
  const [dailyLimit] = useState<number>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_DAILY_VOCAB_LIMIT;
    }

    const storedValue = window.localStorage.getItem(DAILY_VOCAB_LIMIT_KEY);
    const parsedValue = Number(storedValue);

    return Number.isFinite(parsedValue) && parsedValue > 0
      ? parsedValue
      : DEFAULT_DAILY_VOCAB_LIMIT;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [memoryMap, setMemoryMap] = useState<Record<string, MemoryState>>({});
  const [autoStudyEnabled, setAutoStudyEnabled] = useState(false);
  const [voiceSupported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
  );
  const advanceTimeoutRef = useRef<number | null>(null);
  const REPEAT_COUNT = 4;

  const cards = useMemo<StudyCard[]>(
    () =>
      [
        ...vocabItems.map((item) => ({
        key: `vocab-${item.id}`,
        id: item.id,
        kind: "vocab" as const,
        title: item.word,
        reading: item.reading,
        meaning: item.meaning,
        example: item.example,
        exampleFurigana: item.exampleFurigana,
        exampleTranslation: item.exampleTranslation,
        badge: "단어",
        })),
        ...grammarItems.map((item) => ({
        key: `grammar-${item.id}`,
        id: item.id,
        kind: "grammar" as const,
        title: item.pattern,
        reading: "문형",
        meaning: item.meaning,
        example: item.example,
        exampleFurigana: item.exampleFurigana,
        exampleTranslation: item.exampleTranslation,
        badge: "문형",
        })),
      ].slice(0, dailyLimit),
    [dailyLimit, grammarItems, vocabItems],
  );

  const currentItem = cards[currentIndex];
  const currentState = memoryMap[currentItem.key] ?? "미학습";
  const memorizedCount = Object.values(memoryMap).filter((item) => item === "암기됨").length;
  const reviewCount = Object.values(memoryMap).filter((item) => item === "복습 필요").length;
  const progressRatio = ((currentIndex + 1) / cards.length) * 100;

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const moveToIndex = (nextIndex: number) => {
    const safeIndex = (nextIndex + cards.length) % cards.length;
    setCurrentIndex(safeIndex);
  };

  const handleSwipeEnd = (clientX: number) => {
    if (dragStartX === null) {
      return;
    }

    const delta = clientX - dragStartX;

    if (delta <= -50) {
      moveToIndex(currentIndex + 1);
    } else if (delta >= 50) {
      moveToIndex(currentIndex - 1);
    }

    setDragStartX(null);
  };

  const updateMemoryState = (nextState: MemoryState) => {
    setMemoryMap((current) => ({
      ...current,
      [currentItem.key]: nextState,
    }));
    moveToIndex(currentIndex + 1);
  };

  const stopAutoStudy = () => {
    setAutoStudyEnabled(false);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  };

  const speakCurrentCard = (repeatCount = 1) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const queue = Array.from({ length: repeatCount }).flatMap(() => {
      const japaneseUtterance = new SpeechSynthesisUtterance(currentItem.title);
      japaneseUtterance.lang = "ja-JP";
      japaneseUtterance.rate = 0.9;

      const meaningUtterance = new SpeechSynthesisUtterance(
        `${currentItem.meaning}. ${currentItem.exampleTranslation}`,
      );
      meaningUtterance.lang = "ko-KR";
      meaningUtterance.rate = 0.95;

      return [japaneseUtterance, meaningUtterance];
    });

    queue.forEach((utterance) => {
      window.speechSynthesis.speak(utterance);
    });
  };

  useEffect(() => {
    if (!autoStudyEnabled) {
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const queue = Array.from({ length: REPEAT_COUNT }).flatMap(() => {
      const japaneseUtterance = new SpeechSynthesisUtterance(currentItem.title);
      japaneseUtterance.lang = "ja-JP";
      japaneseUtterance.rate = 0.9;

      const meaningUtterance = new SpeechSynthesisUtterance(
        `${currentItem.meaning}. ${currentItem.exampleTranslation}`,
      );
      meaningUtterance.lang = "ko-KR";
      meaningUtterance.rate = 0.95;

      return [japaneseUtterance, meaningUtterance];
    });

    const lastUtterance = queue.at(-1);

    if (lastUtterance) {
      lastUtterance.onend = () => {
        advanceTimeoutRef.current = window.setTimeout(() => {
          setCurrentIndex((current) => (current + 1) % cards.length);
        }, 1200);
      };
    }

    queue.forEach((utterance) => {
      window.speechSynthesis.speak(utterance);
    });

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    };
  }, [REPEAT_COUNT, autoStudyEnabled, cards.length, currentItem.exampleTranslation, currentItem.meaning, currentItem.title]);

  const previewIndexes = [1, 2]
    .map((offset) => (currentIndex + offset) % cards.length)
    .filter((index) => cards[index]);

  return (
    <div className="vocab-experience">
      <section className="vocab-focus-panel">
        <div className="vocab-focus-copy">
          <p className="eyebrow">{level} 통합 카드 루프</p>
          <h3>단어 카드 다음에 문형 카드가 이어지는 한 줄 학습 덱입니다</h3>
          <p className="muted">
            단어를 외운 흐름 그대로 문형까지 이어서 보도록 구성했습니다. 예문 해석도
            같이 보여서 바로 문장 감각까지 연결할 수 있습니다.
          </p>
          <p className="muted">
            {voiceSupported
              ? autoStudyEnabled
                ? "일본어와 한국어 설명을 4번 반복한 뒤 자동으로 다음 카드로 넘어갑니다."
                : "카드 안의 재생 버튼으로 자동 학습을 시작할 수 있습니다."
              : "이 브라우저에서는 음성 기능을 사용할 수 없습니다."}
          </p>
        </div>

        <div className="vocab-metrics">
          <article className="mini-stat">
            <p className="muted">현재 카드</p>
            <h4>
              {currentIndex + 1}/{cards.length}
            </h4>
          </article>
          <article className="mini-stat">
            <p className="muted">하루 단어 수</p>
            <h4>{cards.length}개</h4>
          </article>
          <article className="mini-stat">
            <p className="muted">암기됨</p>
            <h4>{memorizedCount}</h4>
          </article>
          <article className="mini-stat">
            <p className="muted">복습 필요</p>
            <h4>{reviewCount}</h4>
          </article>
        </div>
      </section>

      <div className="vocab-progress-rail">
        <span style={{ width: `${progressRatio}%` }} />
      </div>

      <div className="flash-stage">
        <div className="flash-stack" aria-hidden="true">
          {previewIndexes.reverse().map((index, order) => (
            <div
              key={cards[index].key}
              className={`flash-shadow-card flash-shadow-card-${order + 1}`}
            >
              <p className="muted">{cards[index].badge}</p>
              <h4>{cards[index].title}</h4>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="flash-card flash-card-immersive flash-card-single"
          onTouchStart={(event) => setDragStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => handleSwipeEnd(event.changedTouches[0]?.clientX ?? 0)}
          onMouseDown={(event) => setDragStartX(event.clientX)}
          onMouseUp={(event) => handleSwipeEnd(event.clientX)}
          aria-label={`${currentItem.title} 학습 카드`}
        >
          <div className="flash-card-face flash-single-face">
            <div className="study-card-top">
              <span className="pill">
                {currentItem.badge} · {level}
              </span>
              <div className="card-top-right">
                <span className="memory-pill">{currentState}</span>
                <div className="card-audio-controls">
                  <button
                    type="button"
                    className={`audio-icon-button ${autoStudyEnabled ? "audio-icon-active" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setAutoStudyEnabled(true);
                    }}
                    disabled={!voiceSupported}
                    aria-label="자동 학습 시작"
                    title="자동 학습 시작"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    className="audio-icon-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      stopAutoStudy();
                    }}
                    disabled={!voiceSupported}
                    aria-label="자동 학습 멈춤"
                    title="자동 학습 멈춤"
                  >
                    ||
                  </button>
                  <button
                    type="button"
                    className="audio-icon-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      speakCurrentCard(REPEAT_COUNT);
                    }}
                    disabled={!voiceSupported}
                    aria-label="현재 카드 반복 듣기"
                    title="현재 카드 반복 듣기"
                  >
                    ↻
                  </button>
                </div>
              </div>
            </div>
            <div className="flash-card-main">
              <p className="flash-card-caption">
                {currentItem.kind === "vocab" ? "현재 단어" : "현재 문형"}
              </p>
              <h3 className="flash-card-word">{currentItem.title}</h3>
              <p className="kana">{currentItem.reading}</p>
            </div>
            <div className="flash-card-detail">
              <div className="flash-detail-block">
                <p className="muted">뜻</p>
                <h3 className="flash-card-meaning">{currentItem.meaning}</h3>
              </div>
              <div className="flash-detail-block">
                <p className="muted">예문</p>
                <p className="flash-example">
                  <JapaneseText annotatedText={currentItem.exampleFurigana} />
                </p>
                <p className="flash-translation">{currentItem.exampleTranslation}</p>
              </div>
            </div>
            <p className="muted">좌우로 밀거나 아래 버튼으로 다음 카드로 넘어갈 수 있습니다.</p>
          </div>
        </button>
      </div>

      <div className="vocab-slider-actions">
        <button
          type="button"
          className="button-secondary button-control"
          onClick={() => moveToIndex(currentIndex - 1)}
        >
          이전
        </button>
        <button
          type="button"
          className="button-secondary button-control"
          onClick={() => updateMemoryState("복습 필요")}
        >
          헷갈림
        </button>
        <button
          type="button"
          className="button-primary button-control"
          onClick={() => updateMemoryState("암기됨")}
        >
          암기 완료
        </button>
      </div>

      <div className="vocab-slider-dots" aria-hidden="true">
        {cards.map((item, index) => (
          <span
            key={item.key}
            className={`vocab-dot ${index === currentIndex ? "vocab-dot-active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
