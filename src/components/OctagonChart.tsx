'use client';

import React, { useId, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { dimensions as defaultDimensions } from '@/data/assessment-data';
import type { DimensionId, DimensionResult, MaturityLevel } from '@/types/assessment';

export interface OctagonDimensionInput {
  id: DimensionId;
  name: string;
  average?: number | null;
  score?: number | null;
  level?: MaturityLevel | null;
}

export interface OctagonChartProps {
  /** Lista das 8 dimensoes com suas medias (0 a 5, ou null quando Nao sei informar). Se omitido, ativa o modo decorativo idle. */
  dimensions?: readonly (DimensionResult | OctagonDimensionInput)[];
  /** Modo explicito: 'idle' (decorativo para abertura) ou 'interactive' (resultados) */
  mode?: 'idle' | 'interactive';
  /** Nivel geral de maturidade */
  level?: MaturityLevel | null;
  /** Dimensao destacada externamente (sincronizacao com a lista de dimensoes) */
  activeDimensionId?: DimensionId | null;
  /** Callback disparado ao passar o mouse em um vertice/rotulo */
  onHoverDimension?: (dimensionId: DimensionId | null) => void;
  /** Ativa ou desativa animacao de entrada */
  animate?: boolean;
  className?: string;
}

const CENTER = 250;
const MAX_RADIUS = 114;
const LEVELS = [1, 2, 3, 4, 5] as const;

// Valores conceituais para o modo decorativo da abertura (sensacao de radar vivo)
const IDLE_DEMO_SCORES = [3.8, 4.2, 3.1, 4.4, 3.5, 2.9, 4.0, 3.4];
const IDLE_SECONDARY_SCORES = [2.4, 2.8, 3.6, 2.7, 3.9, 3.4, 2.6, 3.8];

function polarToCartesian(index: number, total: number, radius: number) {
  const angleDeg = -90 + (index * 360) / total;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: Number((CENTER + radius * Math.cos(angleRad)).toFixed(2)),
    y: Number((CENTER + radius * Math.sin(angleRad)).toFixed(2)),
    angleDeg,
  };
}

function getLabelPlacement(index: number, isIdle: boolean) {
  // Posicionamento calibrado por quadrante para garantir legibilidade em 375px sem corte nas bordas
  switch (index) {
    case 0: // Estrategia (topo)
      return {
        x: CENTER,
        y: isIdle ? 104 : 88,
        textAnchor: 'middle' as const,
      };
    case 1: // Lideranca (superior direito)
      return {
        x: 344,
        y: 148,
        textAnchor: 'start' as const,
      };
    case 2: // Governanca (direita)
      return {
        x: 378,
        y: isIdle ? 254 : 244,
        textAnchor: 'start' as const,
      };
    case 3: // Tecnologia (inferior direito)
      return {
        x: 344,
        y: 344,
        textAnchor: 'start' as const,
      };
    case 4: // Cultura (base)
      return {
        x: CENTER,
        y: 394,
        textAnchor: 'middle' as const,
      };
    case 5: // Funding (inferior esquerdo)
      return {
        x: 156,
        y: 344,
        textAnchor: 'end' as const,
      };
    case 6: // Pessoas (esquerda)
      return {
        x: 122,
        y: isIdle ? 254 : 244,
        textAnchor: 'end' as const,
      };
    case 7: // Relacionamentos (superior esquerdo)
    default:
      return {
        x: 162,
        y: 148,
        textAnchor: 'end' as const,
      };
  }
}

function buildPolygonPoints(radii: readonly number[]): string {
  return radii
    .map((r, idx) => {
      const { x, y } = polarToCartesian(idx, radii.length, r);
      return `${x},${y}`;
    })
    .join(' ');
}

function formatScorePtBr(score: number | null): string {
  if (score === null || Number.isNaN(score)) return 'Sem dados';
  return score.toFixed(1).replace('.', ',');
}

export function OctagonChart({
  dimensions,
  mode,
  activeDimensionId,
  onHoverDimension,
  animate = true,
  className = '',
}: OctagonChartProps) {
  const uid = useId();
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  const [internalHoverId, setInternalHoverId] = useState<DimensionId | null>(null);

  const isIdle = mode === 'idle' || (!dimensions && mode !== 'interactive');
  const activeId = activeDimensionId ?? internalHoverId;

  const handleHover = (id: DimensionId | null) => {
    setInternalHoverId(id);
    onHoverDimension?.(id);
  };

  // Normaliza as 8 dimensoes na ordem oficial do Octogono da IA
  const normalizedDimensions = defaultDimensions.map((baseDim, index) => {
    const found = dimensions?.find((d) => d.id === baseDim.id) ?? dimensions?.[index];
    const rawScore =
      found && 'average' in found && found.average !== undefined
        ? found.average
        : found && 'score' in found && found.score !== undefined
          ? found.score
          : null;

    const clampedScore =
      typeof rawScore === 'number' && Number.isFinite(rawScore)
        ? Math.max(0, Math.min(5, rawScore))
        : null;

    return {
      id: baseDim.id,
      name: found?.name ?? baseDim.name,
      score: isIdle ? IDLE_DEMO_SCORES[index] : clampedScore,
      hasData: isIdle ? true : clampedScore !== null,
    };
  });

  const dataRadii = normalizedDimensions.map((dim) =>
    dim.score === null ? 0 : (dim.score / 5) * MAX_RADIUS
  );
  const polygonPoints = buildPolygonPoints(dataRadii);

  const idleSecondaryPoints = buildPolygonPoints(
    IDLE_SECONDARY_SCORES.map((s) => (s / 5) * MAX_RADIUS)
  );

  const ariaSummary = isIdle
    ? 'Representação visual do Octógono da IA com as oito dimensões avaliadas pela Innoscience: Estratégia, Liderança, Governança, Tecnologia, Cultura, Funding, Pessoas e Relacionamentos.'
    : `Gráfico do Octógono da IA com as pontuações por dimensão: ${normalizedDimensions
        .map((d) => `${d.name}: ${formatScorePtBr(d.score)}`)
        .join('; ')}.`;

  const activeDimension = normalizedDimensions.find((d) => d.id === activeId) ?? null;

  return (
    <div className={`relative select-none ${className}`}>
      <svg
        viewBox="-10 45 520 405"
        role="img"
        aria-label={ariaSummary}
        className="w-full h-auto max-w-[480px] mx-auto"
      >
        <defs>
          {/* Gradiente Amarelo Innoscience (#FFDC6B -> #F2A400) */}
          <radialGradient id={`octagon-fill-${uid}`} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="rgba(255, 220, 107, 0.52)" />
            <stop offset="65%" stopColor="rgba(250, 182, 0, 0.34)" />
            <stop offset="100%" stopColor="rgba(242, 164, 0, 0.16)" />
          </radialGradient>

          {/* Glow radial suave da Innoscience rgba(250, 182, 0, 0.22) */}
          <radialGradient id={`octagon-idle-glow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(250, 182, 0, 0.22)" />
            <stop offset="60%" stopColor="rgba(255, 220, 107, 0.10)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </radialGradient>

          <filter id={`vertex-glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Halo radial sutil de fundo */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={MAX_RADIUS + 20}
          fill={`url(#octagon-idle-glow-${uid})`}
        />

        {/* Anel orbital pontilhado externo no modo idle */}
        {isIdle && (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={MAX_RADIUS + 10}
            fill="none"
            stroke="rgba(250, 182, 0, 0.55)"
            strokeWidth="1.2"
            strokeDasharray="3 7"
            className="animate-octagon-rotate"
          />
        )}

        {/* 5 Octogonos concentricos (niveis 1 a 5) em tons neutros escuros sutis no fundo claro */}
        <g aria-hidden="true">
          {LEVELS.map((lvl) => {
            const r = (lvl / 5) * MAX_RADIUS;
            const pts = buildPolygonPoints(Array(8).fill(r));
            const isThreshold = lvl === 2 || lvl === 4;
            const isOuter = lvl === 5;

            return (
              <polygon
                key={lvl}
                points={pts}
                fill={lvl === 5 ? 'rgba(249, 250, 251, 0.7)' : 'none'}
                stroke={
                  isOuter
                    ? '#9CA3AF'
                    : isThreshold
                      ? '#D1D5DB'
                      : '#E5E7EB'
                }
                strokeWidth={isOuter ? 1.4 : isThreshold ? 1.2 : 1}
                strokeDasharray={isThreshold ? '4 4' : undefined}
              />
            );
          })}
        </g>

        {/* 8 Eixos radiais */}
        <g aria-hidden="true">
          {normalizedDimensions.map((dim, idx) => {
            const outer = polarToCartesian(idx, 8, MAX_RADIUS);
            const isHighlighted = activeId === dim.id;
            return (
              <line
                key={dim.id}
                x1={CENTER}
                y1={CENTER}
                x2={outer.x}
                y2={outer.y}
                stroke={isHighlighted ? '#FAB600' : '#D1D5DB'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={dim.hasData ? undefined : '3 4'}
                className="transition-colors duration-200"
              />
            );
          })}
        </g>

        {/* Marcadores numericos discretos dos niveis 1..5 no eixo vertical superior */}
        {!isIdle && (
          <g aria-hidden="true">
            {LEVELS.map((lvl) => {
              const y = CENTER - (lvl / 5) * MAX_RADIUS;
              return (
                <text
                  key={lvl}
                  x={CENTER + 6}
                  y={y + 12}
                  fill="#6B7280"
                  fontSize="11"
                  fontWeight={600}
                  fontFamily="var(--font-sans)"
                  className="tabular-nums"
                >
                  {lvl}
                </text>
              );
            })}
          </g>
        )}

        {/* Poligono secundario sutil apenas no modo idle */}
        {isIdle && (
          <polygon
            points={idleSecondaryPoints}
            fill="rgba(17, 17, 17, 0.03)"
            stroke="rgba(41, 41, 41, 0.25)"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            className="animate-octagon-breathe"
            style={{
              animationDelay: '-3s',
              transformOrigin: `${CENTER}px ${CENTER}px`,
              transformBox: 'view-box',
            }}
          />
        )}

        {/* Poligono principal de dados em Amarelo Innoscience (#FAB600 / #F2A400) */}
        <motion.polygon
          points={polygonPoints}
          fill={`url(#octagon-fill-${uid})`}
          stroke="#F2A400"
          strokeWidth={2.5}
          strokeLinejoin="round"
          initial={
            shouldAnimate
              ? { scale: 0.08, opacity: 0 }
              : { scale: 1, opacity: 1 }
          }
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: shouldAnimate ? 0.85 : 0,
            ease: [0.2, 0.8, 0.2, 1],
            delay: shouldAnimate ? 0.12 : 0,
          }}
          style={{
            transformOrigin: `${CENTER}px ${CENTER}px`,
            transformBox: 'view-box',
          }}
          className={isIdle ? 'animate-octagon-breathe' : undefined}
        />

        {/* Ponto central do Octogono */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={3}
          fill="#6B7280"
        />

        {/* Vertices das 8 dimensoes */}
        {normalizedDimensions.map((dim, idx) => {
          const radius = dataRadii[idx];
          const pos = polarToCartesian(idx, 8, radius);
          const isHighlighted = activeId === dim.id;

          return (
            <motion.g
              key={dim.id}
              initial={
                shouldAnimate
                  ? { opacity: 0, scale: 0 }
                  : { opacity: 1, scale: 1 }
              }
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: shouldAnimate ? 0.35 : 0,
                delay: shouldAnimate ? 0.35 + idx * 0.055 : 0,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              style={{
                transformOrigin: `${pos.x}px ${pos.y}px`,
                transformBox: 'view-box',
              }}
            >
              {/* Halo de hover no vertice */}
              {isHighlighted && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={13}
                  fill="rgba(250, 182, 0, 0.22)"
                  stroke="#FAB600"
                  strokeWidth={1.75}
                  filter={`url(#vertex-glow-${uid})`}
                />
              )}

              {/* Ponto visivel do vertice */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHighlighted ? 6.5 : dim.hasData ? 5 : 3.5}
                fill={
                  !dim.hasData
                    ? '#F9FAFB'
                    : isHighlighted
                      ? '#000000'
                      : '#FAB600'
                }
                stroke={
                  !dim.hasData
                    ? '#888888'
                    : isHighlighted
                      ? '#FAB600'
                      : '#111111'
                }
                strokeWidth={isHighlighted ? 2.6 : 2}
                strokeDasharray={dim.hasData ? undefined : '2 2'}
                className="transition-all duration-200"
              />

              {/* Area de hover ampliada no modo interativo */}
              {!isIdle && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={18}
                  fill="transparent"
                  onMouseEnter={() => handleHover(dim.id)}
                  onMouseLeave={() => handleHover(null)}
                  className="cursor-pointer"
                />
              )}
            </motion.g>
          );
        })}

        {/* Rotulos externos das 8 dimensoes + nota abaixo em alto contraste (#111111 / #292929) */}
        {normalizedDimensions.map((dim, idx) => {
          const placement = getLabelPlacement(idx, isIdle);
          const isHighlighted = activeId === dim.id;

          return (
            <g
              key={`label-${dim.id}`}
              onMouseEnter={!isIdle ? () => handleHover(dim.id) : undefined}
              onMouseLeave={!isIdle ? () => handleHover(null) : undefined}
              className={!isIdle ? 'cursor-pointer' : undefined}
            >
              <text
                x={placement.x}
                y={placement.y}
                textAnchor={placement.textAnchor}
                fill={isHighlighted ? '#000000' : '#292929'}
                fontSize={isHighlighted ? '17.5' : '16.5'}
                fontWeight={isHighlighted ? 800 : 600}
                fontFamily="var(--font-sans)"
                className="transition-all duration-200"
              >
                {dim.name}
              </text>

              {!isIdle && (
                <text
                  x={placement.x}
                  y={placement.y + 19}
                  textAnchor={placement.textAnchor}
                  fill={
                    dim.score === null
                      ? '#6B7280'
                      : isHighlighted
                        ? '#000000'
                        : '#B45309'
                  }
                  fontSize="14"
                  fontWeight={700}
                  fontFamily="var(--font-sans)"
                  className="tabular-nums transition-colors duration-200"
                >
                  {dim.score !== null ? `${formatScorePtBr(dim.score)} / 5,0` : 'Sem dados'}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Badge flutuante discreto no rodape do grafico quando um eixo esta focado/hovered */}
      {!isIdle && activeDimension && (
        <div
          aria-live="polite"
          className="pointer-events-none mt-2 flex items-center justify-center"
        >
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#000000] bg-[#111111] px-4 py-1.5 text-xs text-white shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FAB600]" />
            <span className="font-semibold">{activeDimension.name}</span>
            <span className="text-[#888888]">·</span>
            <span className="tabular-nums font-bold text-[#FAB600]">
              {activeDimension.score !== null
                ? `${formatScorePtBr(activeDimension.score)} / 5,0`
                : 'Sem dados (Não sei informar)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OctagonChart;
