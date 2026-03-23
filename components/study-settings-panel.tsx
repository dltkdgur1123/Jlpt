"use client";

import { useEffect, useState } from "react";
import { jlptLevels, type JLPTLevel } from "../data/jlpt";
import {
  DAILY_VOCAB_LIMIT_KEY,
  DAILY_VOCAB_LIMIT_OPTIONS,
  DEFAULT_DAILY_VOCAB_LIMIT,
  PREFERRED_LEVEL_STORAGE_KEY,
} from "../lib/study-settings";

export function StudySettingsPanel() {
  const [savedMessage, setSavedMessage] = useState("");
  const [draftDailyLimit, setDraftDailyLimit] = useState<number>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_DAILY_VOCAB_LIMIT;
    }

    const storedValue = window.localStorage.getItem(DAILY_VOCAB_LIMIT_KEY);
    const parsedValue = Number(storedValue);

    return Number.isFinite(parsedValue) && parsedValue > 0
      ? parsedValue
      : DEFAULT_DAILY_VOCAB_LIMIT;
  });
  const [draftPreferredLevel, setDraftPreferredLevel] = useState<JLPTLevel>(() => {
    if (typeof window === "undefined") {
      return "N5";
    }

    const storedValue = window.localStorage.getItem(PREFERRED_LEVEL_STORAGE_KEY);

    return (storedValue as JLPTLevel) || "N5";
  });

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSavedMessage("");
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [savedMessage]);

  const handleSaveSettings = async () => {
    window.localStorage.setItem(DAILY_VOCAB_LIMIT_KEY, String(draftDailyLimit));
    window.localStorage.setItem(PREFERRED_LEVEL_STORAGE_KEY, draftPreferredLevel);
    await window.fetch("/api/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preferredLevel: draftPreferredLevel,
      }),
    });

    setSavedMessage("설정이 저장되었습니다.");
  };

  return (
    <section className="settings-card">
      <div className="section-heading">
        <p className="eyebrow">학습 설정</p>
        <h2>하루에 볼 단어 수를 정해두세요</h2>
        <p className="section-copy">
          설정한 개수만큼 단어 카드가 먼저 보이고, 그 다음에 문형 카드가 이어집니다.
        </p>
      </div>

      <div className="settings-option-row">
        {DAILY_VOCAB_LIMIT_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`settings-chip ${draftDailyLimit === option ? "settings-chip-active" : ""}`}
            onClick={() => setDraftDailyLimit(option)}
          >
            하루 {option}개
          </button>
        ))}
      </div>

      <div className="section-heading settings-subheading">
        <p className="eyebrow">대표 레벨</p>
        <h2>이제부터는 선택한 레벨만 기본으로 보여줍니다</h2>
      </div>

      <div className="settings-option-row">
        {jlptLevels.map((item) => (
          <button
            key={item.level}
            type="button"
            className={`settings-chip ${draftPreferredLevel === item.level ? "settings-chip-active" : ""}`}
            onClick={() => setDraftPreferredLevel(item.level)}
          >
            {item.level} {item.label}
          </button>
        ))}
      </div>

      <div className="settings-action-row">
        <button type="button" className="button-primary" onClick={handleSaveSettings}>
          설정 저장
        </button>
        {savedMessage ? <p className="success-note">{savedMessage}</p> : null}
      </div>

      <div className="settings-summary">
        <p className="muted">현재 설정</p>
        <h3>
          {draftPreferredLevel} 레벨 · 하루 학습 카드 {draftDailyLimit}개
        </h3>
      </div>
    </section>
  );
}
