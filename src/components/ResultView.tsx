'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpRight,
  Compass,
  Info,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { resultContents } from '@/data/assessment-data';
import type {
  AssessmentResult,
  DimensionId,
  MaturityLevel,
} from '@/types/assessment';
import { OctagonChart } from './OctagonChart';

export interface ResultViewProps {
  /** Resultado calculado por calculateAssessment */
  result: AssessmentResult;
  /** Callback para reiniciar o diagnostico */
  onRestart?: () => void;
  /** Alias para onRestart */
  onReset?: () => void;
  /** URL para o CTA da Innoscience */
  ctaHref?: string;
}

function formatScore(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—';
  return value.toFixed(1).replace('.', ',');
}

function getLevelMeta(level: MaturityLevel | null) {
  switch (level) {
    case 'inicial':
      return {
        badgeLight: 'border-[#FAB600] bg-[#FFFBEB] text-[#111111]',
        label: 'Inicial',
      };
    case 'em-desenvolvimento':
      return {
        badgeLight: 'border-[#FAB600] bg-[#FFFBEB] text-[#111111]',
        label: 'Em desenvolvimento',
      };
    case 'consolidado':
      return {
        badgeLight: 'border-[#111111] bg-[#FAB600] text-[#000000]',
        label: 'Consolidado',
      };
    default:
      return {
        badgeLight: 'border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]',
        label: 'Sem dados',
      };
  }
}

export function ResultView({
  result,
  onRestart,
  onReset,
  ctaHref = 'https://innoscience.com.br/contato',
}: ResultViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredDimensionId, setHoveredDimensionId] = useState<DimensionId | null>(
    null
  );
  const [displayScore, setDisplayScore] = useState<number>(0);

  const handleRestart = () => {
    onRestart?.();
    onReset?.();
  };

  const targetAverage = result.overallAverage;

  // Count-up fluido da nota geral com requestAnimationFrame
  useEffect(() => {
    if (targetAverage === null || prefersReducedMotion) {
      return;
    }

    let animationFrameId: number;
    const duration = 900;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(targetAverage * eased);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setDisplayScore(targetAverage);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetAverage, prefersReducedMotion]);

  const effectiveDisplayScore =
    targetAverage === null
      ? 0
      : prefersReducedMotion
        ? targetAverage
        : displayScore;

  // Estado quando todas as respostas forem 6 ("Não sei informar")
  if (result.overallAverage === null || !result.level || !result.content) {
    const fallbackContent = resultContents.inicial;

    return (
      <div className="w-full">
        {/* Header Institucional Preto */}
        <div className="bg-[#000000] text-[#FFFFFF] border-b border-[#292929]">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAB600] text-[#000000]">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#FAB600]">
                  Innoscience
                </span>
                <span className="block text-xs text-[#E6E6E6]">
                  Diagnóstico de Prontidão · Octógono da IA
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            className="editorial-card p-6 sm:p-10 text-center space-y-6"
          >
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FAB600] bg-[#FFFBEB] text-[#111111]">
              <AlertCircle className="h-7 w-7 text-[#E0A400]" aria-hidden="true" />
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-[#B45309]">
                Dados insuficientes para cálculo
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#111111]">
                Não foi possível calcular sua média de prontidão em IA
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-[#555555]">
                Todas as questões foram respondidas com a opção{' '}
                <strong className="text-[#111111]">“Não sei informar”</strong>. Como essa
                opção é isenta de pontuação para evitar distorções, é necessário
                avaliar ao menos uma prática na escala de 0 a 5 para gerar o seu
                diagnóstico e o gráfico do Octógono da IA.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              {(onRestart || onReset) && (
                <button
                  type="button"
                  onClick={handleRestart}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-[#FAB600] px-6 py-3.5 text-sm font-bold text-[#000000] shadow-[0_6px_20px_rgba(250,182,0,0.3)] transition-all hover:bg-[#E0A400] cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Refazer diagnóstico</span>
                </button>
              )}

              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#000000] bg-[#FFFFFF] px-6 py-3.5 text-sm font-bold text-[#000000] transition-colors hover:bg-[#F9FAFB]"
              >
                <span>{fallbackContent.cta}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </motion.section>

          {/* Bloco Institucional Innoscience Preto */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            className="editorial-card-dark p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#FAB600]">
                Apoio Especializado Innoscience
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#FFFFFF]">
                {fallbackContent.callout}
              </h2>
              <p className="text-sm text-[#E6E6E6] leading-relaxed">
                {fallbackContent.support}
              </p>
            </div>

            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#FAB600] px-6 py-3.5 text-sm font-bold text-[#000000] transition-all hover:bg-[#E0A400]"
            >
              <span>{fallbackContent.cta}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </motion.section>
        </div>
      </div>
    );
  }

  const { content } = result;
  const displayedStrengths = result.strengths;
  const displayedGaps = result.gaps;

  return (
    <div className="w-full">
      {/* Top Bar Institucional em Preto Puro (#000000) */}
      <div className="bg-[#000000] text-[#FFFFFF] border-b border-[#292929]">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAB600] text-[#000000]">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#FAB600]">
                Diagnóstico Concluído · Innoscience
              </span>
              <span className="block text-xs text-[#E6E6E6]">
                Leitura de Prontidão nas 8 Dimensões do Octógono da IA
              </span>
            </div>
          </div>

          {(onRestart || onReset) && (
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2 text-xs font-bold text-[#000000] transition-colors hover:bg-[#FAB600] hover:border-[#FAB600] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Refazer diagnóstico</span>
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 space-y-10">
        {/* 1. Hero de Alto Contraste Institucional (#000000 / #111111 com destaques #FAB600) */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="editorial-card-dark p-6 sm:p-8 lg:p-10 relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#FAB600]/15 blur-3xl"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Bloco do Score Gigante */}
            <div className="lg:col-span-4 flex flex-col justify-center lg:border-r lg:border-[#292929] lg:pr-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FAB600] px-3.5 py-1 text-xs font-bold text-[#000000]">
                  <span className="h-2 w-2 rounded-full bg-[#000000]" />
                  Nível: {content.label}
                </span>
                <span className="text-xs text-[#E6E6E6] tabular-nums">
                  Faixa {content.scoreRange}
                </span>
              </div>

              <div className="flex items-baseline gap-3 pt-1">
                <span
                  aria-label={`Média geral ${formatScore(result.overallAverage)} de 5,0`}
                  className="font-editorial text-6xl sm:text-7xl lg:text-8xl leading-none tracking-tight tabular-nums text-[#FAB600]"
                >
                  {formatScore(effectiveDisplayScore)}
                </span>
                <div className="space-y-0.5">
                  <span className="block text-lg font-bold text-[#E6E6E6] tabular-nums">
                    / 5,0
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-[#888888]">
                    Média geral
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-[#E6E6E6] tabular-nums">
                <span>
                  Baseada em <strong className="text-[#FAB600]">{result.scoredCount}</strong>{' '}
                  {result.scoredCount === 1 ? 'resposta válida' : 'respostas válidas'}
                </span>
              </div>
            </div>

            {/* Headline e Principal Desafio */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#292929] bg-[#111111] px-3.5 py-1.5 text-xs text-[#E6E6E6]">
                <Target className="h-3.5 w-3.5 text-[#FAB600] shrink-0" aria-hidden="true" />
                <span>Principal desafio:</span>
                <strong className="text-[#FAB600] font-bold">
                  {content.challenge}
                </strong>
              </div>

              <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl leading-[1.18] text-[#FFFFFF]">
                {content.headline}
              </h1>
            </div>
          </div>
        </motion.section>

        {/* Aviso de respostas "Não sei informar" (Caixa Creme #FFFBEB com borda esquerda 4px #FAB600) */}
        {result.unknownCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            role="status"
            className="innoscience-callout rounded-r-xl px-4 py-3.5 flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm"
          >
            <div className="flex items-start sm:items-center gap-3">
              <Info
                className="h-4.5 w-4.5 text-[#E0A400] shrink-0 mt-0.5 sm:mt-0"
                aria-hidden="true"
              />
              <p className="text-[#292929]">
                <strong className="font-bold text-[#111111] tabular-nums">
                  {result.unknownCount}{' '}
                  {result.unknownCount === 1
                    ? 'resposta marcada'
                    : 'respostas marcadas'}{' '}
                  como “Não sei informar”
                </strong>{' '}
                não {result.unknownCount === 1 ? 'entrou' : 'entraram'} no cálculo da
                média para preservar a fidelidade do diagnóstico.
              </p>
            </div>
          </motion.div>
        )}

        {/* 2. Octogono da IA Interativo + Lista Sincronizada das 8 Dimensoes */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.2, 0.8, 0.2, 1] }}
          aria-labelledby="octogono-section-heading"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
        >
          {/* Coluna Esquerda: OctagonChart */}
          <div className="lg:col-span-6 editorial-card p-5 sm:p-7 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B45309]">
                  Geometria de Maturidade
                </span>
                <h2
                  id="octogono-section-heading"
                  className="font-editorial text-2xl sm:text-3xl text-[#111111]"
                >
                  Octógono da IA
                </h2>
              </div>

              <span className="text-xs text-[#6B7280] hidden sm:inline">
                Passe o cursor nos vértices
              </span>
            </div>

            <div className="my-auto py-2">
              <OctagonChart
                mode="interactive"
                dimensions={result.dimensions}
                level={result.level}
                activeDimensionId={hoveredDimensionId}
                onHoverDimension={setHoveredDimensionId}
              />
            </div>

            {/* Legenda das faixas */}
            <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-center gap-4 text-xs text-[#555555]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB] border border-[#9CA3AF]" />
                Inicial (&lt; 2,0)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFDC6B] border border-[#E0A400]" />
                Em desenvolvimento (2,0–3,9)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FAB600] border border-[#111111]" />
                Consolidado (4,0–5,0)
              </span>
            </div>
          </div>

          {/* Coluna Direita: Lista das 8 Dimensoes Sincronizada */}
          <div className="lg:col-span-6 editorial-card p-5 sm:p-7 flex flex-col justify-between space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B45309]">
                Detalhamento Analítico
              </span>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#111111]">
                Pontuação por Dimensão
              </h3>
            </div>

            <ul className="space-y-2.5 flex-1 flex flex-col justify-center">
              {result.dimensions.map((dim, idx) => {
                const isHighlighted = hoveredDimensionId === dim.id;
                const dimMeta = getLevelMeta(dim.level);
                const percentage =
                  dim.average !== null
                    ? Math.max(0, Math.min(100, (dim.average / 5) * 100))
                    : 0;

                return (
                  <li
                    key={dim.id}
                    onMouseEnter={() => setHoveredDimensionId(dim.id)}
                    onMouseLeave={() => setHoveredDimensionId(null)}
                    onFocus={() => setHoveredDimensionId(dim.id)}
                    onBlur={() => setHoveredDimensionId(null)}
                    tabIndex={0}
                    className={`rounded-xl border px-4 py-3 transition-all duration-200 cursor-pointer focus:outline-none ${
                      isHighlighted
                        ? 'border-[#FAB600] bg-[#FFFDF5] shadow-[0_4px_16px_rgba(250,182,0,0.18)]'
                        : 'border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#FAB600] hover:bg-[#FFFDF5]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] font-bold text-[#6B7280] tabular-nums">
                          0{idx + 1}
                        </span>
                        <span className="font-bold text-sm text-[#111111] truncate">
                          {dim.name}
                        </span>
                        <span
                          className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${dimMeta.badgeLight}`}
                        >
                          {dimMeta.label}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-baseline gap-1 tabular-nums">
                        {dim.average !== null ? (
                          <>
                            <span className="text-sm font-extrabold text-[#111111]">
                              {formatScore(dim.average)}
                            </span>
                            <span className="text-xs text-[#6B7280]">/ 5,0</span>
                          </>
                        ) : (
                          <span className="text-xs italic text-[#6B7280]">
                            Não sei informar
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra de progresso 0..5 (trilha #E5E7EB, preenchimento #FAB600) */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.7,
                          delay: prefersReducedMotion ? 0 : 0.15 + idx * 0.04,
                          ease: [0.2, 0.8, 0.2, 1],
                        }}
                        className="h-full rounded-full bg-[#FAB600]"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.section>

        {/* 3. Cards de Principais Avancos e Principais Lacunas */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
          aria-label="Principais avanços e lacunas"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Card Principais Avancos */}
          <div className="editorial-card p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAB600] text-[#000000]">
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-editorial text-2xl text-[#111111]">
                    Principais Avanços
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    As dimensões com maior maturidade no seu diagnóstico
                  </p>
                </div>
              </div>
            </div>

            {displayedStrengths.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {displayedStrengths.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredDimensionId(item.id)}
                    onMouseLeave={() => setHoveredDimensionId(null)}
                    className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 transition-colors hover:border-[#FAB600] hover:bg-[#FFFDF5]"
                  >
                    <div>
                      <span className="font-bold text-sm text-[#111111]">
                        {item.name}
                      </span>
                      <span className="block text-xs text-[#555555]">
                        {item.average !== null && item.average >= 4
                          ? 'Prática disseminada e acompanhada'
                          : 'Frente mais avançada no diagnóstico atual'}
                      </span>
                    </div>
                    <span className="rounded-lg bg-[#FAB600] px-3 py-1 text-sm font-bold text-[#000000] tabular-nums">
                      {formatScore(item.average)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6B7280] py-4">
                Ainda não há dimensões avaliadas suficientes para destacar avanços.
              </p>
            )}
          </div>

          {/* Card Principais Lacunas */}
          <div className="editorial-card p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#111111] text-[#FAB600]">
                  <TrendingDown className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-editorial text-2xl text-[#111111]">
                    Principais Lacunas
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    As dimensões que concentram as maiores oportunidades de evolução
                  </p>
                </div>
              </div>
            </div>

            {displayedGaps.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {displayedGaps.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredDimensionId(item.id)}
                    onMouseLeave={() => setHoveredDimensionId(null)}
                    className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 transition-colors hover:border-[#FAB600] hover:bg-[#FFFDF5]"
                  >
                    <div>
                      <span className="font-bold text-sm text-[#111111]">
                        {item.name}
                      </span>
                      <span className="block text-xs text-[#555555]">
                        {item.average !== null && item.average < 2
                          ? 'Prioridade de estruturação imediata'
                          : 'Oportunidade para acelerar a prontidão'}
                      </span>
                    </div>
                    <span className="rounded-lg border border-[#FAB600] bg-[#FFFBEB] px-3 py-1 text-sm font-bold text-[#111111] tabular-nums">
                      {formatScore(item.average)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6B7280] py-4">
                As dimensões avaliadas apresentaram pontuação uniforme, sem lacunas discrepantes.
              </p>
            )}
          </div>
        </motion.section>

        {/* 4. Leitura Completa do Nivel + Orientacoes ("Por onde comecar? / Como avancar? / Como evoluir?") */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
        >
          {/* Analise do Estagio Atual */}
          <article className="lg:col-span-6 editorial-card p-6 sm:p-8 space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#B45309]">
                Diagnóstico de Prontidão
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#111111]">
                {content.title}
              </h2>
            </div>

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#333333]">
              {content.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </article>

          {/* Direcionamento Estrategico */}
          <article className="lg:col-span-6 editorial-card p-6 sm:p-8 space-y-4 border-t-4 border-t-[#FAB600]">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#B45309]">
                Próximos Passos Recomendados
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#111111]">
                {content.guidanceTitle}
              </h2>
            </div>

            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#333333]">
              {content.guidance.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </article>
        </motion.section>

        {/* 5. Bloco CTA da Innoscience em Alto Contraste Institucional (#000000 / #111111 com #FAB600) */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
          className="editorial-card-dark p-6 sm:p-10 lg:p-12 relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FAB600]/15 blur-3xl"
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#FAB600]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Innoscience · Consultoria de Inovação e IA</span>
              </div>

              <h2 className="font-editorial text-3xl sm:text-4xl leading-tight text-[#FFFFFF]">
                {content.callout}
              </h2>

              <p className="text-sm sm:text-base leading-relaxed text-[#E6E6E6]">
                {content.support}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#FAB600] px-7 py-4 text-sm sm:text-base font-bold text-[#000000] shadow-[0_6px_24px_rgba(250,182,0,0.3)] transition-all duration-200 hover:bg-[#E0A400]"
              >
                <span>{content.cta}</span>
                <ArrowUpRight className="h-4.5 w-4.5" aria-hidden="true" />
              </a>

              {(onRestart || onReset) && (
                <button
                  type="button"
                  onClick={handleRestart}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#FFFFFF]/25 bg-[#111111] px-5 py-4 text-sm font-semibold text-[#FFFFFF] transition-colors hover:border-[#FAB600] hover:text-[#FAB600] cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Refazer diagnóstico</span>
                </button>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default ResultView;
