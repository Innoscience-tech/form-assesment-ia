'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  dimensions as defaultDimensions,
  questions as defaultQuestions,
} from '@/data/assessment-data';
import type {
  AssessmentAnswers,
  AssessmentDimension,
  AssessmentQuestion,
} from '@/types/assessment';

export interface ProgressHeaderProps {
  /** Indice 0-based da questao atual (0..15) */
  currentIndex?: number;
  /** Alias para currentIndex (0..15) */
  index?: number;
  /** Alias alternativo para currentIndex (0..15) */
  currentStep?: number;
  /** ID 1-based da questao atual (1..16), usado caso currentIndex nao seja informado */
  currentQuestionId?: number;
  /** Questao atual opcional */
  currentQuestion?: AssessmentQuestion;
  /** Dimensao atual opcional */
  currentDimension?: AssessmentDimension;
  /** Respostas atuais para marcar sub-etapas concluidas */
  answers?: AssessmentAnswers;
  /** Lista das 8 dimensoes (padrao: dimensions de assessment-data) */
  dimensions?: readonly AssessmentDimension[];
  /** Total de questoes (padrao: 16) */
  totalQuestions?: number;
  /** Alias para totalQuestions */
  total?: number;
  /** Callback opcional para navegar para uma questao ja respondida */
  onSelectQuestion?: (questionIndex: number) => void;
  className?: string;
}

export function ProgressHeader({
  currentIndex,
  index,
  currentStep,
  currentQuestionId,
  currentQuestion: currentQuestionProp,
  currentDimension: currentDimensionProp,
  answers,
  dimensions = defaultDimensions,
  totalQuestions,
  total,
  onSelectQuestion,
  className = '',
}: ProgressHeaderProps) {
  const totalCount = totalQuestions ?? total ?? defaultQuestions.length;

  const resolvedIndex =
    currentIndex ??
    index ??
    currentStep ??
    (currentQuestionProp !== undefined
      ? Math.max(0, currentQuestionProp.id - 1)
      : currentQuestionId !== undefined
        ? Math.max(0, currentQuestionId - 1)
        : 0);

  const clampedIndex = Math.max(0, Math.min(totalCount - 1, resolvedIndex));
  const currentQuestion =
    currentQuestionProp ?? defaultQuestions[clampedIndex] ?? defaultQuestions[0];

  const activeDimensionIndex = Math.max(
    0,
    dimensions.findIndex(
      (d) => d.id === (currentDimensionProp?.id ?? currentQuestion.dimensionId)
    )
  );
  const activeDimension =
    currentDimensionProp ?? dimensions[activeDimensionIndex] ?? dimensions[0];

  const stepWithinDimension =
    Math.max(0, activeDimension.questionIds.indexOf(currentQuestion.id)) + 1;
  const totalInDimension = activeDimension.questionIds.length;

  const progressPercentage = Math.round(((clampedIndex + 1) / totalCount) * 100);

  return (
    <header
      aria-label="Progresso do diagnóstico"
      className={`w-full space-y-3.5 ${className}`}
    >
      {/* Linha superior: Dimensao atual + Contador de questoes */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#FAB600] text-[11px] font-bold text-[#000000] tabular-nums">
            0{activeDimensionIndex + 1}
          </span>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-[#111111]">
              {activeDimension.name}
            </span>
            <span className="text-[#888888]" aria-hidden="true">
              ·
            </span>
            <span className="text-xs font-bold text-[#B45309] tabular-nums">
              {stepWithinDimension}/{totalInDimension}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#6B7280] tabular-nums">
          <span className="font-semibold text-[#292929]">
            Questão {clampedIndex + 1} de {totalCount}
          </span>
          <span className="hidden sm:inline-block rounded-full border border-[#E5E7EB] bg-[#FFFFFF] px-2.5 py-0.5 text-[11px] font-semibold text-[#111111]">
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Grade segmentada: 8 dimensoes x 2 perguntas */}
      <div
        role="progressbar"
        aria-valuenow={clampedIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalCount}
        aria-valuetext={`Questão ${clampedIndex + 1} de ${totalCount} — Dimensão ${activeDimension.name} (${stepWithinDimension} de ${totalInDimension})`}
        className="grid grid-cols-8 gap-1.5 sm:gap-2.5"
      >
        {dimensions.map((dim, dimIdx) => {
          const isCurrentDim = dim.id === activeDimension.id;
          const isPastDim = dimIdx < activeDimensionIndex;

          const allAnsweredInDim = dim.questionIds.every((qId) => {
            if (answers) return answers[qId] !== undefined;
            const qIdx = defaultQuestions.findIndex((q) => q.id === qId);
            return qIdx < clampedIndex;
          });

          return (
            <div key={dim.id} className="space-y-1.5">
              {/* Duas sub-barras para as 2 perguntas da dimensao (trilha #E5E7EB e preenchimento #FAB600) */}
              <div className="grid grid-cols-2 gap-1">
                {dim.questionIds.map((qId) => {
                  const qIdx = defaultQuestions.findIndex((q) => q.id === qId);
                  const isCurrentQuestion = qIdx === clampedIndex;
                  const isAnswered =
                    answers !== undefined
                      ? answers[qId] !== undefined
                      : qIdx < clampedIndex;

                  const barElement = (
                    <div
                      key={qId}
                      className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]"
                    >
                      {(isAnswered || isCurrentQuestion) && (
                        <motion.div
                          layoutId={isCurrentQuestion ? 'active-step-glow' : undefined}
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                          className={`h-full rounded-full ${
                            isCurrentQuestion
                              ? 'bg-[#FAB600] shadow-[0_0_10px_rgba(250,182,0,0.65)]'
                              : 'bg-[#FAB600]'
                          }`}
                        />
                      )}
                    </div>
                  );

                  if (onSelectQuestion && (isAnswered || isCurrentQuestion)) {
                    return (
                      <button
                        key={qId}
                        type="button"
                        onClick={() => onSelectQuestion(qIdx)}
                        title={`${dim.name} · Questão ${qId}`}
                        className="block w-full cursor-pointer focus:outline-none"
                      >
                        {barElement}
                      </button>
                    );
                  }

                  return barElement;
                })}
              </div>

              {/* Rotulo compacto da dimensao (visivel em telas >= md) */}
              <div className="hidden md:flex items-center justify-between gap-1 px-0.5">
                <span
                  className={`truncate text-[11px] transition-colors duration-200 ${
                    isCurrentDim
                      ? 'font-bold text-[#111111]'
                      : isPastDim || allAnsweredInDim
                        ? 'font-medium text-[#333333]'
                        : 'text-[#6B7280]'
                  }`}
                >
                  {dim.name}
                </span>
                {allAnsweredInDim && !isCurrentDim && (
                  <Check
                    className="h-3 w-3 shrink-0 text-[#E0A400]"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}

export default ProgressHeader;
