"use client";

import { useState } from "react";
import { getLevelLabel, studyContentByLevel, studyStats, type JLPTLevel } from "../data/jlpt";

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

function getDefaultProgress(): StoredStudyProgress {
  return {
    completedToday: studyStats.completedToday,
    todayGoal: studyStats.todayGoal,
    accuracy: studyStats.accuracy,
    lastScore: 0,
    totalAnswered: 0,
    correctAnswers: 0,
  };
}

function readProgress(level: JLPTLevel): StoredStudyProgress {
  const rawValue = window.localStorage.getItem(getStorageKey(level));
  const defaultProgress = getDefaultProgress();

  if (!rawValue) {
    return defaultProgress;
  }

  try {
    return {
      ...defaultProgress,
      ...(JSON.parse(rawValue) as Partial<StoredStudyProgress>),
    };
  } catch {
    return defaultProgress;
  }
}

type ProgressOverviewProps = {
  level: JLPTLevel;
};

export function ProgressOverview({ level }: ProgressOverviewProps) {
  const [progress] = useState<StoredStudyProgress>(() =>
    typeof window === "undefined" ? getDefaultProgress() : readProgress(level),
  );

  const progressCards = [
    { label: "오늘 목표", value: `${progress.completedToday}/${progress.todayGoal}` },
    { label: "정답률", value: `${progress.accuracy}%` },
    { label: "연속 학습", value: `${studyStats.streakDays}일` },
    { label: "집중 영역", value: studyContentByLevel[level].focusArea },
  ];

  return (
    <>
      <div className="stats-grid">
        {progressCards.map((item) => (
          <article key={item.label} className="stat-card">
            <p className="muted">{item.label}</p>
            <h3>{item.value}</h3>
          </article>
        ))}
      </div>

      <div className="timeline-card progress-note">
        <h3>{getLevelLabel(level)} 단계 다음 추천</h3>
        <p>
          최근 저장 점수 {progress.lastScore}% · 누적 풀이 {progress.totalAnswered}문제
        </p>
      </div>
    </>
  );
}
