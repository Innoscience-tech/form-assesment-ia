'use client';

import { useEffect, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { Compass } from 'lucide-react';
import { IntroView } from '@/components/IntroView';
import { OctagonChart } from '@/components/OctagonChart';
import { ProgressHeader } from '@/components/ProgressHeader';
import { QuestionCard } from '@/components/QuestionCard';
import { ResultView } from '@/components/ResultView';
import { useAssessment } from '@/hooks/useAssessment';

export default function Home() {
  const assessment = useAssessment();
  const mainRef = useRef<HTMLElement>(null);
  const { stage, currentIndex, hydrated, currentQuestion } = assessment;

  useEffect(() => {
    if (!hydrated) return;
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [hydrated, stage, currentIndex]);

  const mainLabel = !hydrated ? 'Carregando diagnóstico'
    : stage === 'quiz' ? `Questão ${currentIndex + 1} de ${assessment.totalQuestions}: ${currentQuestion.title}`
      : stage === 'calculating' ? 'Calculando seu diagnóstico'
        : stage === 'result' ? 'Resultado do diagnóstico' : 'Assessment de Prontidão em IA';

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#assessment"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#FAB600] focus:px-4 focus:py-3 focus:font-bold focus:text-[#000000]"
      >
        Ir para o conteúdo
      </a>

      {hydrated && (stage === 'quiz' || stage === 'calculating') && (
        <header className="w-full bg-[#000000] text-[#FFFFFF] border-b border-[#292929]">
          <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAB600] text-[#000000]">
              <Compass className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold tracking-wide text-[#FFFFFF]">
              Innoscience
            </span>
            <span className="ml-auto text-xs font-semibold text-[#FAB600]">
              Octógono da IA
            </span>
          </div>
        </header>
      )}

      <main
        id="assessment"
        ref={mainRef}
        tabIndex={-1}
        aria-label={mainLabel}
        className="flex-1 focus-visible:outline-none"
      >
        {!hydrated && (
          <div className="flex min-h-[70svh] items-center justify-center px-6">
            <p role="status" className="text-sm font-medium text-[#6B7280]">
              Carregando seu diagnóstico…
            </p>
          </div>
        )}

        {hydrated && stage === 'intro' && (
          <IntroView onStart={assessment.start} answeredCount={assessment.result.answeredCount} />
        )}

        {hydrated && stage === 'quiz' && (
          <div className="mx-auto w-full max-w-4xl space-y-6 px-4 pb-12 pt-6 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
            <h1 className="sr-only">Assessment de Prontidão em IA</h1>
            <ProgressHeader
              currentIndex={currentIndex}
              currentQuestion={currentQuestion}
              currentDimension={assessment.currentDimension}
              answers={assessment.answers}
              totalQuestions={assessment.totalQuestions}
            />
            <QuestionCard
              question={currentQuestion}
              dimension={assessment.currentDimension}
              currentIndex={currentIndex}
              totalQuestions={assessment.totalQuestions}
              selectedValue={assessment.answers[currentQuestion.id]}
              onAnswer={assessment.answerQuestion}
              onBack={assessment.goBack}
              onNext={assessment.goNext}
              canAdvance={assessment.canAdvance}
              isTransitioning={assessment.isTransitioning}
              enableKeyboardShortcuts={false}
            />
          </div>
        )}

        {hydrated && stage === 'calculating' && (
          <section className="mx-auto flex min-h-[75svh] w-full max-w-2xl flex-col items-center justify-center px-4 pb-12 pt-8 text-center sm:px-6">
            <div aria-hidden="true" className="w-full max-w-sm editorial-card p-6 mb-6">
              <OctagonChart mode="idle" />
            </div>
            <div role="status" aria-live="polite" className="space-y-3">
              <h1 className="font-editorial text-3xl text-[#111111] sm:text-4xl">
                Calculando seu diagnóstico…
              </h1>
              <p className="mx-auto max-w-md text-base leading-relaxed text-[#555555]">
                Estamos consolidando suas respostas nas oito dimensões do Octógono da IA.
              </p>
            </div>
          </section>
        )}

        {hydrated && stage === 'result' && (
          <ResultView result={assessment.result} onRestart={assessment.restart} />
        )}

        <noscript>
          <p className="mx-auto max-w-xl px-6 py-12 text-[#111111]">
            Ative o JavaScript no navegador para responder ao assessment e calcular seu diagnóstico.
          </p>
        </noscript>
      </main>
    </MotionConfig>
  );
}
