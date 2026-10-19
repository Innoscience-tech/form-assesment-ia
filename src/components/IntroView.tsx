'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, HelpCircle, Layers, Sparkles } from 'lucide-react';
import {
  dimensions as defaultDimensions,
  instructionText as defaultInstructionText,
  openingText as defaultOpeningText,
  scaleOptions as defaultScaleOptions,
} from '@/data/assessment-data';
import type { AssessmentDimension, ScaleOption } from '@/types/assessment';
import { OctagonChart } from './OctagonChart';

export interface IntroViewProps {
  /** Callback para iniciar o diagnostico */
  onStart: () => void;
  /** Texto de abertura (opcional, padrao de assessment-data) */
  openingText?: string;
  /** Instrucao de preenchimento (opcional, padrao de assessment-data) */
  instructionText?: string;
  /** Opcoes da escala (opcional, padrao de assessment-data) */
  scaleOptions?: readonly ScaleOption[];
  /** Dimensoes do Octogono (opcional, padrao de assessment-data) */
  dimensions?: readonly AssessmentDimension[];
  /** Quantidade de respostas ja preenchidas caso haja sessao em andamento */
  answeredCount?: number;
}

export function IntroView({
  onStart,
  openingText = defaultOpeningText,
  instructionText = defaultInstructionText,
  scaleOptions = defaultScaleOptions,
  dimensions = defaultDimensions,
  answeredCount = 0,
}: IntroViewProps) {
  const scoredScale = scaleOptions.filter((option) => option.value !== 6);
  const unknownOption = scaleOptions.find((option) => option.value === 6);

  return (
    <div className="w-full">
      {/* Header Institucional de Alto Contraste (#000000 / #111111 com destaques #FAB600) */}
      <div className="bg-[#000000] text-[#FFFFFF] border-b border-[#292929]">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Image
              src="/logo-branca.png"
              alt="Innoscience"
              width={146}
              height={40}
              priority
              className="h-7 sm:h-8 w-auto object-contain"
            />
            <span className="hidden sm:inline-block h-5 w-px bg-[#292929]" aria-hidden="true" />
            <span className="text-xs font-medium text-[#E6E6E6]">
              Diagnóstico Executivo · Octógono da IA
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#E6E6E6]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#292929] bg-[#111111] px-3 py-1 tabular-nums">
              <Layers className="h-3.5 w-3.5 text-[#FAB600]" aria-hidden="true" />
              8 dimensões · 16 questões
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#292929] bg-[#111111] px-3 py-1 tabular-nums">
              <Clock className="h-3.5 w-3.5 text-[#FAB600]" aria-hidden="true" />
              ~4 minutos
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 space-y-12">
        {/* Hero Grid: Abertura + Octogono Decorativo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FAB600] bg-[#FFFBEB] px-3.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#111111]">
              <Sparkles className="h-3.5 w-3.5 text-[#E0A400]" aria-hidden="true" />
              <span>Octógono da IA</span>
            </div>

            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl leading-[1.06] tracking-tight text-[#111111]">
              Assessment de Prontidão em{' '}
              <span className="italic underline decoration-[#FAB600] decoration-2 underline-offset-4">
                Inteligência Artificial
              </span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-[#333333] max-w-2xl">
              {openingText}
            </p>

            {/* Bloco de Metodologia / As 8 Dimensoes em Alto Contraste Institucional */}
            <div className="editorial-card-dark p-5 sm:p-6 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FAB600]">
                  Metodologia · As 8 dimensões avaliadas
                </p>
                <span className="text-[11px] text-[#E6E6E6] tabular-nums">
                  16 indicadores práticos
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dimensions.map((dim, idx) => (
                  <span
                    key={dim.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#292929] bg-[#111111] px-2.5 py-1.5 text-xs font-medium text-[#FFFFFF]"
                  >
                    <span className="tabular-nums text-[10px] font-bold text-[#FAB600]">
                      0{idx + 1}
                    </span>
                    {dim.name}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Primário Oficial Innoscience */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                type="button"
                onClick={onStart}
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#FAB600] px-7 py-4 text-sm sm:text-base font-bold text-[#000000] shadow-[0_6px_24px_rgba(250,182,0,0.32)] transition-all duration-200 hover:bg-[#E0A400] active:scale-[0.99] cursor-pointer"
              >
                <span>
                  {answeredCount > 0 && answeredCount < 16
                    ? `Continuar diagnóstico (${answeredCount}/16)`
                    : 'Iniciar diagnóstico'}
                </span>
                <ArrowRight
                  className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>

              <span className="text-xs text-[#6B7280]">
                Leitura imediata ao final · Diagnóstico executivo personalizado
              </span>
            </div>
          </motion.div>

          {/* Coluna Direita: Octogono Decorativo Idle em Card Branco Elegante */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            className="lg:col-span-5"
          >
            <div className="editorial-card p-5 sm:p-7 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs mb-2 px-1">
                <span className="uppercase tracking-[0.16em] font-bold text-[#292929]">
                  Octógono da IA
                </span>
                <span className="tabular-nums font-bold text-[#111111] bg-[#FFFBEB] border border-[#FAB600]/60 rounded-full px-2.5 py-0.5">
                  Escala 0,0 — 5,0
                </span>
              </div>
              <OctagonChart mode="idle" />
            </div>
          </motion.div>
        </div>

        {/* Seção Como Responder + Callout Creme + Legenda da Escala 0-5 + Não sei informar */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          aria-labelledby="como-responder-heading"
          className="editorial-card p-6 sm:p-8 lg:p-10 space-y-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-[#E5E7EB]">
            <div className="space-y-4 max-w-3xl">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#B45309]">
                  Orientações de preenchimento
                </span>
                <h2
                  id="como-responder-heading"
                  className="font-editorial text-2xl sm:text-3xl text-[#111111]"
                >
                  Como responder ao diagnóstico
                </h2>
              </div>

              {/* Caixa de instrucao / callout oficial: fundo creme #FFFBEB com borda esquerda 4px #FAB600 e texto #292929 */}
              <div className="innoscience-callout rounded-r-xl p-4 sm:p-5">
                <p className="text-sm sm:text-base leading-relaxed text-[#292929] font-medium">
                  {instructionText}
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3.5 text-xs text-[#555555] space-y-1.5">
              <div className="font-bold text-[#111111]">Atalhos de teclado</div>
              <div>
                Teclas <kbd className="rounded border border-[#D1D5DB] bg-[#FFFFFF] px-1.5 py-0.5 font-mono font-semibold text-[#111111]">0</kbd> a{' '}
                <kbd className="rounded border border-[#D1D5DB] bg-[#FFFFFF] px-1.5 py-0.5 font-mono font-semibold text-[#111111]">5</kbd> selecionam a nota
              </div>
              <div>
                Tecla <kbd className="rounded border border-[#D1D5DB] bg-[#FFFFFF] px-1.5 py-0.5 font-mono font-semibold text-[#111111]">N</kbd> ou{' '}
                <kbd className="rounded border border-[#D1D5DB] bg-[#FFFFFF] px-1.5 py-0.5 font-mono font-semibold text-[#111111]">6</kbd> para Não sei informar
              </div>
            </div>
          </div>

          {/* Legenda da Escala 0 a 5 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B7280]">
                Escala de maturidade das práticas (0 a 5)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {scoredScale.map((item) => (
                <div
                  key={item.value}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 flex items-start gap-3.5 transition-colors hover:border-[#FAB600] hover:bg-[#FFFDF5]"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAB600] text-sm font-bold text-[#000000] tabular-nums">
                    {item.value}
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#333333]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Opção 6: Não sei informar separada */}
            {unknownOption && (
              <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-[#6B7280]">
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="text-sm font-bold text-[#292929]">
                      {unknownOption.label}
                    </span>
                    <p className="text-xs text-[#555555]">
                      Use quando não tiver visibilidade sobre o tema. Esta opção não reduz nem distorce a média final.
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-center rounded-md border border-[#E5E7EB] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-semibold text-[#6B7280] tabular-nums">
                  Isenta do cálculo da média
                </span>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default IntroView;
