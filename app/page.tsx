import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { JapaneseText } from "../components/japanese-text";
import { getLevelLabel, studyContentByLevel, studyStats } from "../data/jlpt";
import { getPreferredLevel } from "../lib/level-preference";

export default async function Home() {
  const level = await getPreferredLevel();
  const levelContent = studyContentByLevel[level];

  return (
    <AppShell currentLevel={level}>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">JLPT 통합 학습 대시보드</p>
          <h2>{level} 한 단계에만 집중해서 단어, 문형, 퀴즈를 이어서 학습하세요.</h2>
          <p className="section-copy">
            설정에서 선택한 대표 레벨만 기본으로 보여줍니다. 지금은{" "}
            {level} {getLevelLabel(level)} 단계에 맞춰 학습 화면이 간소화되어 있습니다.
          </p>
          <div className="hero-actions">
            <Link href={`/vocab?level=${level}`} prefetch={false} className="button-primary">
              {level} 단어 학습
            </Link>
            <Link href="/settings" prefetch={false} className="button-secondary">
              설정 바꾸기
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <p className="muted">오늘의 학습 현황</p>
          <h3>{studyStats.completedToday}개 완료</h3>
          <div className="meter">
            <span style={{ width: `${(studyStats.completedToday / studyStats.todayGoal) * 100}%` }} />
          </div>
          <p className="muted">
            목표 {studyStats.todayGoal}개 · 연속 {studyStats.streakDays}일
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <p className="eyebrow">현재 학습 레벨</p>
          <h2>{level} 단계 핵심 흐름</h2>
        </div>
        <article className="level-card single-level-card">
          <span className="pill">{level}</span>
          <h3>{getLevelLabel(level)}</h3>
          <p>{levelContent.summary}</p>
          <div className="card-actions">
            <Link href={`/vocab?level=${level}`} prefetch={false} className="text-link">
              단어
            </Link>
            <Link href={`/quiz?level=${level}`} prefetch={false} className="text-link">
              퀴즈
            </Link>
            <Link href={`/progress?level=${level}`} prefetch={false} className="text-link">
              진행도
            </Link>
          </div>
        </article>
      </section>

      <section className="page-section split">
        <div>
          <div className="section-heading">
            <p className="eyebrow">오늘의 덱</p>
            <h2>{level} 학습 카드 구성</h2>
          </div>
          <div className="list-panel">
            <Link
              key={level}
              href={`/vocab?level=${level}`}
              prefetch={false}
              className="list-row list-link"
            >
              <div>
                <h3>
                  {level} · {levelContent.title}
                </h3>
                <p>
                  단어 {levelContent.vocab.length}개 · 문형 {levelContent.grammar.length}개 ·
                  퀴즈 {levelContent.quiz.length}문제
                </p>
              </div>
              <span className="muted">학습 시작</span>
            </Link>
          </div>
        </div>
        <div>
          <div className="section-heading">
            <p className="eyebrow">대표 문형 미리보기</p>
            <h2>{level} 단계에서 먼저 보게 되는 표현</h2>
          </div>
          <article className="study-card">
            <h3>{levelContent.grammar[0].pattern}</h3>
            <p>{levelContent.grammar[0].meaning}</p>
            <p className="flash-example">
              <JapaneseText annotatedText={levelContent.grammar[0].exampleFurigana} />
            </p>
            <p className="muted">{levelContent.grammar[0].exampleTranslation}</p>
          </article>
        </div>
      </section>
    </AppShell>
  );
}
