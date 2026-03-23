"use client";

import { useEffect, useState } from "react";
import type { JLPTLevel, QuizItem } from "../data/jlpt";

type StoredStudyProgress = {
  completedToday: number;
  todayGoal: number;
  accuracy: number;
  lastScore: number;
  totalAnswered: number;
  correctAnswers: number;
};

function getStorageKey(level: JLPTLevel) {
  return `jlpt-study-progress-${level}`;
}

function loadStoredProgress(level: JLPTLevel): StoredStudyProgress | null {
  const rawValue = window.localStorage.getItem(getStorageKey(level));

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredStudyProgress;
  } catch {
    return null;
  }
}

function saveStoredProgress(level: JLPTLevel, progress: StoredStudyProgress) {
  window.localStorage.setItem(getStorageKey(level), JSON.stringify(progress));
}

type QuizPanelProps = {
  level: JLPTLevel;
  quizItems: QuizItem[];
};

export function QuizPanel({ level, quizItems }: QuizPanelProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSavedMessage("");
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [savedMessage]);

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = quizItems.filter((item) => selectedAnswers[item.id] === item.answer).length;
  const scorePercent = Math.round((correctCount / quizItems.length) * 100);

  const handleChoiceSelect = (questionId: number, choice: string) => {
    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: choice,
    }));
  };

  const handleSubmit = () => {
    setSubmitted(true);

    const previousProgress = loadStoredProgress(level);
    const totalAnswered = (previousProgress?.totalAnswered ?? 0) + quizItems.length;
    const correctAnswers = (previousProgress?.correctAnswers ?? 0) + correctCount;
    const completedToday = Math.max(previousProgress?.completedToday ?? 0, answeredCount);
    const todayGoal = previousProgress?.todayGoal ?? 20;

    saveStoredProgress(level, {
      completedToday,
      todayGoal,
      accuracy: Math.round((correctAnswers / totalAnswered) * 100),
      lastScore: scorePercent,
      totalAnswered,
      correctAnswers,
    });

    setSavedMessage(`${level} 퀴즈 결과가 저장되었습니다.`);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setSavedMessage("");
  };

  return (
    <div className="quiz-stack">
      <div className="quiz-toolbar">
        <div>
          <p className="muted">
            선택 완료 {answeredCount}/{quizItems.length}
          </p>
          <h3>{level} 문제를 끝내면 진행도에 자동 반영됩니다.</h3>
        </div>
        <div className="quiz-toolbar-actions">
          <button
            type="button"
            className="button-secondary button-control"
            onClick={handleReset}
          >
            다시 풀기
          </button>
          <button
            type="button"
            className="button-primary button-control"
            onClick={handleSubmit}
            disabled={answeredCount !== quizItems.length}
          >
            정답 제출
          </button>
        </div>
      </div>

      {submitted ? (
        <div className="timeline-card quiz-summary">
          <p className="eyebrow">결과 요약</p>
          <h3>
            {correctCount}/{quizItems.length} 정답
          </h3>
          <p className="muted">점수 {scorePercent}%</p>
          {savedMessage ? <p className="success-note">{savedMessage}</p> : null}
        </div>
      ) : null}

      <div className="card-grid">
        {quizItems.map((item) => {
          const selectedChoice = selectedAnswers[item.id];
          const isCorrect = selectedChoice === item.answer;

          return (
            <article key={item.id} className="quiz-card">
              <span className="pill">{item.level}</span>
              <h3>{item.prompt}</h3>
              <div className="choice-grid">
                {item.choices.map((choice) => {
                  const isSelected = selectedChoice === choice;
                  const showCorrect = submitted && choice === item.answer;
                  const showWrong = submitted && isSelected && choice !== item.answer;

                  return (
                    <button
                      key={choice}
                      type="button"
                      className={[
                        "choice",
                        isSelected ? "choice-selected" : "",
                        showCorrect ? "choice-correct" : "",
                        showWrong ? "choice-wrong" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleChoiceSelect(item.id, choice)}
                      disabled={submitted}
                      aria-pressed={isSelected}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
              {submitted ? (
                <>
                  <p className="answer">{isCorrect ? "정답입니다" : `정답: ${item.answer}`}</p>
                  <p className="muted">{item.explanation}</p>
                </>
              ) : (
                <p className="muted">제출 전까지는 다른 선택지로 바꿀 수 있습니다.</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
