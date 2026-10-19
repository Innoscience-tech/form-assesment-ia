'use client';

import React, { useId } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Keyboard,
  MessageSquareText,
} from 'lucide-react';
import {
  dimensions as defaultDimensions,
  questions as defaultQuestions,
  scaleOptions as defaultScaleOptions,
} from '@/data/assessment-data';
import type {
  AnswerValue,
  AssessmentDimension,
  AssessmentQuestion,
  ScaleOption,
} from '@/types/assessment';

export interface AnswerChangeOptions {
  autoAdvance?: boolean;
}

export interface QuestionCardProps {
  /** Questao atual a ser exibida */
  question?: AssessmentQuestion;
  /** Dimensao correspondente (inferida automaticamente por question.dimensionId se omitida) */
  dimension?: AssessmentDimension;
  /** Indice 0-based da questao (0..15) */
  currentIndex?: number;
  /** Total de questoes (padrao: 16) */
  totalQuestions?: number;
  /** Resposta atualmente selecionada para esta questao */
  selectedValue?: AnswerValue;
  /** Comentario livre associado a esta questao */
  comment?: string;
  /** Opcoes da escala (padrao: scaleOptions de assessment-data) */
  scaleOptions?: readonly ScaleOption[];
  /** Callback ao selecionar uma resposta (0..6), informando se deve avancar automaticamente */
  onAnswer?: (value: AnswerValue, options?: AnswerChangeOptions) => void;
  /** Callback ao alterar o comentario livre da questao */
  onCommentChange?: (comment: string) => void;
  /** Callback para voltar para a questao anterior (ou etapa anterior na Q1) */
  onBack?: () => void;
  /** Callback opcional para avancar manualmente */
  onNext?: () => void;
  /** Define se pode avancar manualmente */
  canAdvance?: boolean;
  /** Indica se esta em transicao automatica */
  isTransitioning?: boolean;
  /** Define se o botao Voltar esta habilitado (padrao: true se onBack for fornecido) */
  canGoBack?: boolean;
  /** Mantido para compatibilidade de contrato */
  enableKeyboardShortcuts?: boolean;
}

export function QuestionCard({
  question: questionProp,
  dimension,
  currentIndex,
  totalQuestions,
  selectedValue,
  comment = '',
  scaleOptions = defaultScaleOptions,
  onAnswer,
  onCommentChange,
  onBack,
  onNext,
  canGoBack = true,
}: QuestionCardProps) {
  const groupId = useId();
  const prefersReducedMotion = useReducedMotion();

  const resolvedIndex =
    currentIndex ?? (questionProp ? Math.max(0, questionProp.id - 1) : 0);

  const question =
    questionProp ?? defaultQuestions[resolvedIndex] ?? defaultQuestions[0];

  const resolvedDimension =
    dimension ??
    defaultDimensions.find((d) => d.id === question.dimensionId) ??
    defaultDimensions[0];

  const resolvedTotal = totalQuestions ?? defaultQuestions.length;
  const currentAnswer = selectedValue;

  const handleChoose = (val: AnswerValue, options?: AnswerChangeOptions) => {
    onAnswer?.(val, { autoAdvance: options?.autoAdvance ?? false });
  };

  const handleRadioChange = (val: AnswerValue) => {
    handleChoose(val, { autoAdvance: false });
  };

  const scoredOptions = scaleOptions.filter((opt) => opt.value !== 6);
  const unknownOption = scaleOptions.find((opt) => opt.value === 6);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          key={question.id}
          initial={
            prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }
          }
          animate={{ opacity: 1, x: 0 }}
          exit={
            prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }
          }
          transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
          className="editorial-card p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-8"
        >
          {/* Cabecalho da Questao */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FAB600] bg-[#FFFBEB] px-3 py-1 text-xs font-bold text-[#111111]">
                <span>{resolvedDimension.name}</span>
                <span aria-hidden="true" className="text-[#888888]">
                  ·
                </span>
                <span className="tabular-nums text-[#292929]">
                  Questão {String(question.id).padStart(2, '0')}
                </span>
              </div>

              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                {question.title}
              </span>
            </div>

            <h2
              id={`question-heading-${groupId}`}
              className="font-editorial text-2xl sm:text-3xl lg:text-[2.15rem] leading-[1.2] text-[#111111]"
            >
              {question.text}
            </h2>
          </div>

          {/* Escala Principal 0 a 5 */}
          <fieldset
            aria-labelledby={`question-heading-${groupId}`}
            className="space-y-3"
          >
            <legend className="sr-only">
              Selecione o nível de maturidade para: {question.title}
            </legend>

            <div className="grid grid-cols-1 gap-2.5">
              {scoredOptions.map((option) => {
                const isSelected = currentAnswer === option.value;

                return (
                  <label
                    key={option.value}
                    className={`group relative flex items-start sm:items-center gap-3.5 sm:gap-4 rounded-xl border p-3.5 sm:px-5 sm:py-4 cursor-pointer transition-all duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#FAB600] has-[:focus-visible]:outline-offset-2 ${
                      isSelected
                        ? 'border-[#FAB600] bg-[#FAB600] text-[#000000] shadow-[0_6px_20px_rgba(250,182,0,0.28)]'
                        : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#292929] hover:border-[#FAB600] hover:bg-[#FFFDF5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.value}
                      checked={isSelected}
                      onChange={() => handleRadioChange(option.value)}
                      className="sr-only"
                    />

                    {/* Badge numerica 0..5 */}
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold tabular-nums transition-colors duration-200 ${
                        isSelected
                          ? 'border-[#000000] bg-[#000000] text-[#FAB600]'
                          : 'border-[#E5E7EB] bg-[#FFFFFF] text-[#111111] group-hover:border-[#FAB600] group-hover:bg-[#FAB600] group-hover:text-[#000000]'
                      }`}
                    >
                      {option.value}
                    </span>

                    {/* Descricao literal da pratica */}
                    <span
                      className={`flex-1 text-sm sm:text-[15px] leading-snug transition-colors duration-200 ${
                        isSelected
                          ? 'font-bold text-[#000000]'
                          : 'text-[#333333] group-hover:text-[#111111]'
                      }`}
                    >
                      {option.label}
                    </span>

                    {/* Indicador de selecao / atalho de teclado */}
                    <span className="shrink-0 flex items-center gap-2">
                      {isSelected ? (
                        <CheckCircle2
                          className="h-5 w-5 text-[#000000]"
                          aria-hidden="true"
                        />
                      ) : (
                        <kbd
                          aria-hidden="true"
                          className="hidden sm:inline-flex h-6 min-w-6 items-center justify-center rounded border border-[#E5E7EB] bg-[#FFFFFF] px-1.5 font-mono text-[11px] font-semibold text-[#6B7280] group-hover:border-[#FAB600] group-hover:text-[#111111] transition-colors"
                        >
                          {option.value}
                        </kbd>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Opção 6: Não sei informar separada visualmente abaixo */}
            {unknownOption && (
              <div className="pt-2">
                <label
                  className={`group relative flex items-center justify-between gap-4 rounded-xl border border-dashed px-4 py-3 sm:px-5 sm:py-3.5 cursor-pointer transition-all duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#FAB600] has-[:focus-visible]:outline-offset-2 ${
                    currentAnswer === 6
                      ? 'border-[#FAB600] bg-[#FAB600] text-[#000000] shadow-[0_6px_20px_rgba(250,182,0,0.25)]'
                      : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#555555] hover:border-[#FAB600] hover:bg-[#FFFDF5] hover:text-[#111111]'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={unknownOption.value}
                    checked={currentAnswer === 6}
                    onChange={() => handleRadioChange(6)}
                    className="sr-only"
                  />

                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        currentAnswer === 6
                          ? 'border-[#000000] bg-[#000000] text-[#FAB600]'
                          : 'border-[#E5E7EB] bg-[#FFFFFF] text-[#6B7280] group-hover:border-[#FAB600] group-hover:text-[#111111]'
                      }`}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </span>
                    <div>
                      <span
                        className={`block text-sm ${
                          currentAnswer === 6
                            ? 'font-bold text-[#000000]'
                            : 'font-semibold text-[#292929]'
                        }`}
                      >
                        {unknownOption.label}
                      </span>
                      <span
                        className={`block text-xs ${
                          currentAnswer === 6 ? 'text-[#111111]' : 'text-[#6B7280]'
                        }`}
                      >
                        Não tenho visibilidade suficiente sobre este tema (não contabiliza na média)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentAnswer === 6 ? (
                      <CheckCircle2
                        className="h-5 w-5 text-[#000000]"
                        aria-hidden="true"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="hidden sm:flex items-center gap-1"
                      >
                        <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-[#E5E7EB] bg-[#FFFFFF] px-1.5 font-mono text-[11px] font-semibold text-[#6B7280]">
                          N
                        </kbd>
                        <span className="text-[10px] text-[#888888]">ou</span>
                        <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-[#E5E7EB] bg-[#FFFFFF] px-1.5 font-mono text-[11px] font-semibold text-[#6B7280]">
                          6
                        </kbd>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            )}
          </fieldset>

          {/* Campo livre para comentários abaixo de cada questão */}
          <div className="space-y-2 pt-1">
            <label
              htmlFor={`question-comment-${groupId}-${question.id}`}
              className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#292929]"
            >
              <span className="inline-flex items-center gap-1.5">
                <MessageSquareText
                  className="h-3.5 w-3.5 text-[#E0A400]"
                  aria-hidden="true"
                />
                <span>Comentários sobre esta questão</span>
              </span>
              <span className="font-normal normal-case tracking-normal text-[#6B7280]">
                Opcional
              </span>
            </label>
            <textarea
              id={`question-comment-${groupId}-${question.id}`}
              rows={2}
              value={comment}
              onChange={(event) => onCommentChange?.(event.target.value)}
              placeholder="Adicione observações, exemplos práticos ou contexto sobre esta questão na sua empresa..."
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#111111] placeholder:text-[#888888] transition-colors focus:border-[#FAB600] focus:bg-[#FFFFFF] focus:outline-none resize-y"
            />
          </div>

          {/* Rodape de navegacao e dica de atalhos */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E7EB]">
            <div>
              {onBack && canGoBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#000000] transition-colors hover:border-[#000000] hover:bg-[#F9FAFB] cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {resolvedIndex === 0 ? 'Voltar aos dados' : 'Questão anterior'}
                  </span>
                </button>
              ) : (
                <span />
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs text-[#6B7280]">
                <Keyboard className="h-3.5 w-3.5 text-[#E0A400]" aria-hidden="true" />
                <span>
                  Teclas <strong className="text-[#111111]">0–5</strong> ou{' '}
                  <strong className="text-[#111111]">N</strong> marcam a nota
                </span>
              </div>

              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={currentAnswer === undefined}
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    currentAnswer !== undefined
                      ? 'bg-[#FAB600] text-[#000000] shadow-[0_4px_14px_rgba(250,182,0,0.28)] hover:bg-[#E0A400] cursor-pointer'
                      : 'bg-[#E5E7EB] text-[#888888] cursor-not-allowed'
                  }`}
                >
                  <span>
                    {resolvedIndex + 1 >= resolvedTotal
                      ? 'Ver diagnóstico'
                      : 'Próxima'}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}

export default QuestionCard;

