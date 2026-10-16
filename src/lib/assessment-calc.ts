import { dimensions, questions, resultContents } from '@/data/assessment-data';
import type { AnswerValue, AssessmentAnswers, AssessmentResult, MaturityLevel } from '@/types/assessment';

export function isAnswerValue(value: unknown): value is AnswerValue {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6;
}

export function roundAverage(average: number): number {
  return Math.round((average + Number.EPSILON) * 10) / 10;
}

/** A faixa corresponde à média exibida, arredondada para uma casa decimal. */
export function classifyMaturity(average: number | null): MaturityLevel | null {
  if (average === null) return null;
  if (!Number.isFinite(average) || average < 0 || average > 5) {
    throw new RangeError('A média deve estar entre 0 e 5.');
  }
  const rounded = roundAverage(average);
  return rounded < 2 ? 'inicial' : rounded < 4 ? 'em-desenvolvimento' : 'consolidado';
}

export function calculateAverage(values: readonly AnswerValue[]): number | null {
  if (values.some(value => !isAnswerValue(value))) throw new RangeError('Resposta inválida.');
  const scored = values.filter(value => value !== 6);
  return scored.length ? roundAverage(scored.reduce<number>((sum, value) => sum + value, 0) / scored.length) : null;
}

/** Média geral ponderada pelas respostas válidas, não pela quantidade de dimensões. */
export function calculateAssessment(answers: AssessmentAnswers): AssessmentResult {
  for (const [id, value] of Object.entries(answers)) {
    if (!questions.some(question => String(question.id) === id) || !isAnswerValue(value)) {
      throw new RangeError(`Resposta inválida para a questão ${id}.`);
    }
  }
  const values = questions.map(question => answers[question.id]).filter(isAnswerValue);
  const dimensionResults = dimensions.map(dimension => {
    const entries = dimension.questionIds.map(id => answers[id]).filter(isAnswerValue);
    const average = calculateAverage(entries);
    return {
      id: dimension.id, name: dimension.name, average, level: classifyMaturity(average),
      answeredCount: entries.length, scoredCount: entries.filter(value => value !== 6).length,
      unknownCount: entries.filter(value => value === 6).length,
    };
  });
  const overallAverage = calculateAverage(values);
  const level = classifyMaturity(overallAverage);
  const unansweredQuestionIds = questions.filter(question => answers[question.id] === undefined).map(question => question.id);
  // O sort estável mantém a ordem do Octógono em caso de empate.
  const ranked = dimensionResults.filter(item => item.average !== null)
    .sort((a, b) => b.average! - a.average!);
  const strengths = ranked.slice(0, 2);
  const strengthIds = new Set(strengths.map(item => item.id));
  const allEqual = ranked.length === 0 || ranked[0].average === ranked[ranked.length - 1].average;
  const gaps = allEqual ? [] : dimensionResults
    .filter(item => item.average !== null && !strengthIds.has(item.id))
    .sort((a, b) => a.average! - b.average!).slice(0, 2);
  return {
    dimensions: dimensionResults, overallAverage, level, content: level ? resultContents[level] : null,
    strengths, gaps,
    unansweredQuestionIds, answeredCount: values.length,
    scoredCount: values.filter(value => value !== 6).length,
    unknownCount: values.filter(value => value === 6).length,
    isComplete: unansweredQuestionIds.length === 0,
  };
}
