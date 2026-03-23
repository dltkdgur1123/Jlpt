import { AppShell } from "../../components/app-shell";
import { QuizPanel } from "../../components/quiz-panel";
import { getLevelContent, getLevelLabel } from "../../data/jlpt";
import { getPreferredLevel } from "../../lib/level-preference";

type QuizPageProps = {
  searchParams: Promise<{
    level?: string;
  }>;
};

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const { level: levelParam } = await searchParams;
  const level = await getPreferredLevel(levelParam);
  const levelContent = getLevelContent(level);

  return (
    <AppShell currentLevel={level}>
      <section className="page-section">
        <div className="section-heading">
          <p className="eyebrow">{level} 퀴즈</p>
          <h2>{getLevelLabel(level)} 단계 이해도를 빠르게 점검해보세요</h2>
          <p className="section-copy">
            {levelContent.title} 현재 준비된 문제를 한 세트 풀면 레벨별 진행도에 자동
            저장됩니다.
          </p>
        </div>
        <QuizPanel key={level} level={level} quizItems={levelContent.quiz} />
      </section>
    </AppShell>
  );
}
