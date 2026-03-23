import { AppShell } from "../../components/app-shell";
import { ProgressOverview } from "../../components/progress-overview";
import { getLevelContent, getLevelLabel } from "../../data/jlpt";
import { getPreferredLevel } from "../../lib/level-preference";

type ProgressPageProps = {
  searchParams: Promise<{
    level?: string;
  }>;
};

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const { level: levelParam } = await searchParams;
  const level = await getPreferredLevel(levelParam);
  const levelContent = getLevelContent(level);

  return (
    <AppShell currentLevel={level}>
      <section className="page-section">
        <div className="section-heading">
          <p className="eyebrow">{level} 진행도</p>
          <h2>{getLevelLabel(level)} 단계 학습 흐름을 확인하세요</h2>
          <p className="section-copy">
            {levelContent.focusArea} 중심으로 복습하면 효율이 좋습니다. 퀴즈를 제출한
            뒤 이 화면에서 저장 결과를 바로 확인할 수 있습니다.
          </p>
        </div>
        <ProgressOverview key={level} level={level} />
      </section>
    </AppShell>
  );
}
