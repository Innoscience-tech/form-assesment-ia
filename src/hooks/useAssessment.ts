'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { dimensions, questions } from '@/data/assessment-data';
import { calculateAssessment, isAnswerValue } from '@/lib/assessment-calc';
import { extractBrowserTracking, isValidLead } from '@/lib/assessment-submission';
import type {
  AnswerValue,
  AssessmentAnswers,
  AssessmentComments,
  AssessmentLead,
  AssessmentTracking,
} from '@/types/assessment';

export { isValidLead } from '@/lib/assessment-submission';

export type AssessmentStage = 'intro' | 'lead' | 'quiz' | 'calculating' | 'result';
export const ASSESSMENT_STORAGE_KEY = 'innoscience:assessment:v1';
export const AUTO_ADVANCE_DELAY = 250;
export const CALCULATION_DELAY = 1200;

export interface AssessmentState {
  stage: AssessmentStage;
  currentIndex: number;
  answers: AssessmentAnswers;
  comments: AssessmentComments;
  lead: AssessmentLead | null;
  tracking?: AssessmentTracking | null;
  submittedId?: string | null;
  pendingAdvance: boolean;
  hydrated: boolean;
}

export type AssessmentAction =
  | { type: 'restore'; state: AssessmentState | null }
  | { type: 'start' | 'openLead' | 'back' | 'next' | 'finish' | 'restart' }
  | { type: 'submitLead'; lead: AssessmentLead }
  | { type: 'answer'; value: AnswerValue; autoAdvance?: boolean }
  | { type: 'comment'; comment: string; questionId?: number }
  | { type: 'setTracking'; tracking: AssessmentTracking }
  | { type: 'markSubmitted'; submissionId: string };

export const initialAssessmentState: AssessmentState = {
  stage: 'intro',
  currentIndex: 0,
  answers: {},
  comments: {},
  lead: null,
  pendingAdvance: false,
  hydrated: false,
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
    case 'setTracking':
      return { ...state, tracking: state.tracking ?? action.tracking };
    case 'markSubmitted':
      return { ...state, submittedId: action.submissionId };
    case 'openLead':
      return state.stage === 'intro'
        ? { ...state, stage: state.lead ? 'quiz' : 'lead', pendingAdvance: false }
        : state;
    case 'submitLead': {
      if (!isValidLead(action.lead)) return state;
      const normalizedLead: AssessmentLead = {
        name: action.lead.name.trim(),
        email: action.lead.email.trim(),
        phone: action.lead.phone.trim(),
        company: action.lead.company.trim(),
        role: action.lead.role.trim(),
      };
      return {
        ...state,
        lead: normalizedLead,
        stage: 'quiz',
        pendingAdvance: false,
      };
    }
    case 'start':
      return state.stage === 'intro' || state.stage === 'lead'
        ? { ...state, stage: 'quiz', pendingAdvance: false }
        : state;
    case 'answer':
      if (state.stage !== 'quiz' || !state.hydrated || !isAnswerValue(action.value)) return state;
      return {
        ...state,
        answers: { ...state.answers, [questions[state.currentIndex].id]: action.value },
        pendingAdvance: action.autoAdvance ?? false,
      };
    case 'comment': {
      if (state.stage !== 'quiz' || !state.hydrated) return state;
      const qId = action.questionId ?? questions[state.currentIndex].id;
      if (!questions.some(q => q.id === qId)) return state;
      const nextComments: AssessmentComments = { ...state.comments };
      if (action.comment.length === 0) {
        delete nextComments[qId];
      } else {
        nextComments[qId] = action.comment;
      }
      return {
        ...state,
        comments: nextComments,
      };
    }
    case 'back':
      if (state.stage === 'lead') {
        return { ...state, stage: 'intro', pendingAdvance: false };
      }
      if (state.stage !== 'quiz') return state;
      return {
        ...state,
        stage: state.currentIndex === 0 ? (state.lead ? 'lead' : 'intro') : 'quiz',
        currentIndex: Math.max(0, state.currentIndex - 1),
        pendingAdvance: false,
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
    if (saved.version !== 1 || !['intro', 'lead', 'quiz', 'calculating', 'result'].includes(String(saved.stage))) return null;
    if (typeof saved.currentIndex !== 'number' || !Number.isInteger(saved.currentIndex)
      || saved.currentIndex < 0 || saved.currentIndex >= questions.length) return null;
    if (!saved.answers || typeof saved.answers !== 'object' || Array.isArray(saved.answers)) return null;
    const answers: AssessmentAnswers = {};
    for (const [id, value] of Object.entries(saved.answers)) {
      if (!questions.some(question => String(question.id) === id) || !isAnswerValue(value)) return null;
      answers[Number(id)] = value;
    }
    const comments: AssessmentComments = {};
    if (saved.comments !== undefined) {
      if (!saved.comments || typeof saved.comments !== 'object' || Array.isArray(saved.comments)) return null;
      for (const [id, text] of Object.entries(saved.comments)) {
        if (!questions.some(question => String(question.id) === id) || typeof text !== 'string') return null;
        if (text.length > 0) {
          comments[Number(id)] = text;
        }
      }
    }
    const lead = isValidLead(saved.lead)
      ? {
          name: saved.lead.name.trim(),
          email: saved.lead.email.trim(),
          phone: saved.lead.phone.trim(),
          company: saved.lead.company.trim(),
          role: saved.lead.role.trim(),
        }
      : null;

    let stage = saved.stage as AssessmentStage;
    const firstMissing = questions.findIndex(question => answers[question.id] === undefined);
    let currentIndex = saved.currentIndex;
    if ((stage === 'result' || stage === 'calculating') && firstMissing >= 0) {
      stage = 'quiz';
      currentIndex = firstMissing;
    }
    const restored: AssessmentState = {
      stage,
      currentIndex,
      answers,
      comments,
      lead,
      pendingAdvance: false,
      hydrated: true,
    };
    if (typeof saved.submittedId === 'string' && saved.submittedId.trim().length > 0) {
      restored.submittedId = saved.submittedId.trim();
    }
    if (saved.tracking && typeof saved.tracking === 'object' && !Array.isArray(saved.tracking)) {
      restored.tracking = saved.tracking as AssessmentTracking;
    }
    return restored;
  } catch {
    return null;
  }
}

export function useAssessment() {
  const [state, dispatch] = useReducer(assessmentReducer, initialAssessmentState);
  const {
    stage,
    currentIndex,
    answers,
    comments,
    lead,
    tracking,
    submittedId,
    pendingAdvance,
    hydrated,
  } = state;
  const submittingRef = useRef(false);

  useEffect(() => {
    let saved: AssessmentState | null = null;
    try { saved = parseAssessmentSession(sessionStorage.getItem(ASSESSMENT_STORAGE_KEY)); } catch { /* Armazenamento pode estar indisponível. */ }
    dispatch({ type: 'restore', state: saved });
    dispatch({ type: 'setTracking', tracking: extractBrowserTracking() });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (stage === 'intro' && Object.keys(answers).length === 0 && Object.keys(comments).length === 0 && !lead) {
        sessionStorage.removeItem(ASSESSMENT_STORAGE_KEY);
      } else {
        sessionStorage.setItem(
          ASSESSMENT_STORAGE_KEY,
          JSON.stringify({
            version: 1,
            stage,
            currentIndex,
            answers,
            comments,
            lead,
            tracking: tracking ?? null,
            submittedId: submittedId ?? null,
          })
        );
      }
    } catch { /* O fluxo funciona mesmo sem persistência. */ }
  }, [hydrated, stage, currentIndex, answers, comments, lead, tracking, submittedId]);

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

  const result = useMemo(() => calculateAssessment(answers), [answers]);

  // Persiste automaticamente no Supabase ao finalizar as 16 questões
  useEffect(() => {
    if (!hydrated) return;
    if (stage !== 'calculating' && stage !== 'result') return;
    if (!result.isComplete || !lead || submittedId || submittingRef.current) return;

    submittingRef.current = true;
    const clientSubmissionId = crypto.randomUUID();

    fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId: clientSubmissionId,
        lead,
        answers,
        comments,
        tracking: tracking ?? extractBrowserTracking(),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as { submissionId?: string };
        dispatch({
          type: 'markSubmitted',
          submissionId: data.submissionId ?? clientSubmissionId,
        });
      })
      .catch(() => {
        submittingRef.current = false;
      });
  }, [hydrated, stage, result.isComplete, lead, answers, comments, tracking, submittedId]);

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
        dispatch({ type: 'answer', value, autoAdvance: false });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hydrated, stage]);

  const start = useCallback(() => dispatch({ type: 'openLead' }), []);
  const submitLead = useCallback((leadData: AssessmentLead) => {
    dispatch({ type: 'submitLead', lead: leadData });
  }, []);
  const restart = useCallback(() => {
    submittingRef.current = false;
    dispatch({ type: 'restart' });
    dispatch({ type: 'setTracking', tracking: extractBrowserTracking() });
  }, []);
  const answerQuestion = useCallback((value: AnswerValue, options?: { autoAdvance?: boolean }) => {
    dispatch({ type: 'answer', value, autoAdvance: options?.autoAdvance ?? false });
  }, []);
  const commentQuestion = useCallback((comment: string, questionId?: number) => {
    dispatch({ type: 'comment', comment, questionId });
  }, []);
  const goBack = useCallback(() => dispatch({ type: 'back' }), []);
  const goNext = useCallback(() => dispatch({ type: 'next' }), []);
  const currentQuestion = questions[currentIndex];

  return {
    stage,
    currentIndex,
    answers,
    comments,
    lead,
    tracking: tracking ?? null,
    submittedId: submittedId ?? null,
    result,
    hydrated,
    currentQuestion,
    currentDimension: dimensions.find(dimension => dimension.id === currentQuestion.dimensionId)!,
    totalQuestions: questions.length,
    canAdvance: hydrated && stage === 'quiz' && isAnswerValue(answers[currentQuestion.id]),
    isTransitioning: pendingAdvance || stage === 'calculating',
    start,
    submitLead,
    restart,
    answerQuestion,
    commentQuestion,
    goBack,
    goNext,
  };
}


