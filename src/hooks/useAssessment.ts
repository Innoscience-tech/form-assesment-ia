'use client';

import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { dimensions, questions } from '@/data/assessment-data';
import { calculateAssessment, isAnswerValue } from '@/lib/assessment-calc';
import type { AnswerValue, AssessmentAnswers } from '@/types/assessment';

export type AssessmentStage = 'intro' | 'quiz' | 'calculating' | 'result';
export const ASSESSMENT_STORAGE_KEY = 'innoscience:assessment:v1';
export const AUTO_ADVANCE_DELAY = 250;
export const CALCULATION_DELAY = 1200;

export interface AssessmentState {
  stage: AssessmentStage;
  currentIndex: number;
  answers: AssessmentAnswers;
  pendingAdvance: boolean;
  hydrated: boolean;
}

export type AssessmentAction =
  | { type: 'restore'; state: AssessmentState | null }
  | { type: 'start' | 'back' | 'next' | 'finish' | 'restart' }
  | { type: 'answer'; value: AnswerValue; autoAdvance?: boolean };

export const initialAssessmentState: AssessmentState = {
  stage: 'intro', currentIndex: 0, answers: {}, pendingAdvance: false, hydrated: false,
};

function advance(state: AssessmentState): AssessmentState {
  if (!isAnswerValue(state.answers[questions[state.currentIndex].id])) return state;
  if (state.currentIndex < questions.length - 1) {
    return { ...state, currentIndex: state.currentIndex + 1, pendingAdvance: false };
  }
  const missingIndex = questions.findIndex(question => !isAnswerValue(state.answers[question.id]));
  return missingIndex >= 0
    ? { ...state, currentIndex: missingIndex, pendingAdvance: false }
    : { ...state, stage: 'calculating', pendingAdvance: false };
}

/** Transições puras para manter timers, teclado e botões sob as mesmas regras. */
export function assessmentReducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case 'restore':
      return { ...(action.state ?? initialAssessmentState), hydrated: true, pendingAdvance: false };
    case 'restart':
      return { ...initialAssessmentState, hydrated: true };
    case 'start':
      return state.stage === 'intro' ? { ...state, stage: 'quiz', pendingAdvance: false } : state;
    case 'answer':
      if (state.stage !== 'quiz' || !state.hydrated || !isAnswerValue(action.value)) return state;
      return {
        ...state, answers: { ...state.answers, [questions[state.currentIndex].id]: action.value },
        pendingAdvance: action.autoAdvance ?? true,
      };
    case 'back':
      if (state.stage !== 'quiz') return state;
      return {
        ...state, stage: state.currentIndex === 0 ? 'intro' : 'quiz',
        currentIndex: Math.max(0, state.currentIndex - 1), pendingAdvance: false,
      };
    case 'next':
      return state.stage === 'quiz' ? advance(state) : state;
    case 'finish':
      return state.stage === 'calculating' ? { ...state, stage: 'result' } : state;
  }
}

/** Não confia nos dados do navegador: versão, índices, IDs e valores são validados. */
export function parseAssessmentSession(raw: string | null): AssessmentState | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    const saved = data as Record<string, unknown>;
    if (saved.version !== 1 || !['intro', 'quiz', 'calculating', 'result'].includes(String(saved.stage))) return null;
    if (typeof saved.currentIndex !== 'number' || !Number.isInteger(saved.currentIndex)
      || saved.currentIndex < 0 || saved.currentIndex >= questions.length) return null;
    if (!saved.answers || typeof saved.answers !== 'object' || Array.isArray(saved.answers)) return null;
    const answers: AssessmentAnswers = {};
    for (const [id, value] of Object.entries(saved.answers)) {
      if (!questions.some(question => String(question.id) === id) || !isAnswerValue(value)) return null;
      answers[Number(id)] = value;
    }
    let stage = saved.stage as AssessmentStage;
    const firstMissing = questions.findIndex(question => answers[question.id] === undefined);
    let currentIndex = saved.currentIndex;
    if ((stage === 'result' || stage === 'calculating') && firstMissing >= 0) {
      stage = 'quiz';
      currentIndex = firstMissing;
    }
    return { stage, currentIndex, answers, pendingAdvance: false, hydrated: true };
  } catch {
    return null;
  }
}

export function useAssessment() {
  const [state, dispatch] = useReducer(assessmentReducer, initialAssessmentState);
  const { stage, currentIndex, answers, pendingAdvance, hydrated } = state;

  useEffect(() => {
    let saved: AssessmentState | null = null;
    try { saved = parseAssessmentSession(sessionStorage.getItem(ASSESSMENT_STORAGE_KEY)); } catch { /* Armazenamento pode estar indisponível. */ }
    dispatch({ type: 'restore', state: saved });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (stage === 'intro' && Object.keys(answers).length === 0) {
        sessionStorage.removeItem(ASSESSMENT_STORAGE_KEY);
      } else {
        sessionStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify({ version: 1, stage, currentIndex, answers }));
      }
    } catch { /* O fluxo funciona mesmo sem persistência. */ }
  }, [hydrated, stage, currentIndex, answers]);

  useEffect(() => {
    if (!hydrated || stage !== 'quiz' || !pendingAdvance) return;
    const timer = window.setTimeout(() => dispatch({ type: 'next' }), AUTO_ADVANCE_DELAY);
    return () => window.clearTimeout(timer);
  }, [hydrated, stage, currentIndex, answers, pendingAdvance]);

  useEffect(() => {
    if (!hydrated || stage !== 'calculating') return;
    const timer = window.setTimeout(() => dispatch({ type: 'finish' }), CALCULATION_DELAY);
    return () => window.clearTimeout(timer);
  }, [hydrated, stage]);

  useEffect(() => {
    if (!hydrated || stage !== 'quiz') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable
        || target.closest('textarea, select, [role="textbox"], [contenteditable="true"]')
        || (target instanceof HTMLInputElement && target.type !== 'radio'))) return;
      const key = event.key.toLowerCase();
      const value = key === 'n' ? 6 : /^[0-6]$/.test(key) ? Number(key) : null;
      if (isAnswerValue(value)) {
        event.preventDefault();
        dispatch({ type: 'answer', value });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hydrated, stage]);

  const result = useMemo(() => calculateAssessment(answers), [answers]);
  const start = useCallback(() => dispatch({ type: 'start' }), []);
  const restart = useCallback(() => dispatch({ type: 'restart' }), []);
  const answerQuestion = useCallback((value: AnswerValue, options?: { autoAdvance?: boolean }) => {
    dispatch({ type: 'answer', value, autoAdvance: options?.autoAdvance ?? true });
  }, []);
  const goBack = useCallback(() => dispatch({ type: 'back' }), []);
  const goNext = useCallback(() => dispatch({ type: 'next' }), []);
  const currentQuestion = questions[currentIndex];

  return {
    stage, currentIndex, answers, result, hydrated, currentQuestion,
    currentDimension: dimensions.find(dimension => dimension.id === currentQuestion.dimensionId)!,
    totalQuestions: questions.length,
    canAdvance: hydrated && stage === 'quiz' && isAnswerValue(answers[currentQuestion.id]),
    isTransitioning: pendingAdvance || stage === 'calculating',
    start, restart, answerQuestion, goBack, goNext,
  };
}
