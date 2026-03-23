import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { VocabSlider } from "../../components/vocab-slider";
import { getLevelContent, getLevelLabel } from "../../data/jlpt";
import { getPreferredLevel } from "../../lib/level-preference";

type VocabPageProps = {
  searchParams: Promise<{
    level?: string;
  }>;
};

export default async function VocabPage({ searchParams }: VocabPageProps) {
  const { level: levelParam } = await searchParams;
  const level = await getPreferredLevel(levelParam);
  const levelContent = getLevelContent(level);

  return (
    <AppShell currentLevel={level}>
      <section className="page-section">
        <div className="section-heading">
          <p className="eyebrow">{level} 단어 학습</p>
          <h2>{getLevelLabel(level)} 단계 핵심 학습 세트</h2>
          <p className="section-copy">
            {levelContent.summary} 단어 카드 뒤에 문형 카드가 자연스럽게 이어지도록
            구성했습니다.
          </p>
        </div>

        <section className="study-mode-card">
          <div className="section-heading">
            <p className="eyebrow">단어 + 문형 통합 카드</p>
            <h2>단어를 익힌 뒤 바로 관련 문형까지 같은 흐름으로 넘겨보세요</h2>
            <p className="section-copy">
              단어와 문형을 따로 끊지 않고 같은 덱에서 이어 보면 문장 연결 감각이 더
              빨리 올라옵니다.
            </p>
          </div>
          <VocabSlider
            level={level}
            vocabItems={levelContent.vocab}
            grammarItems={levelContent.grammar}
          />
        </section>

        <div className="inline-action-row">
          <Link href={`/quiz?level=${level}`} className="button-primary">
            {level} 퀴즈 풀기
          </Link>
          <Link href={`/progress?level=${level}`} className="button-secondary">
            {level} 진행도 보기
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
