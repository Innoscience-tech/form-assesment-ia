import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { calculateAssessment, calculateAverage, classifyMaturity } from '../src/lib/assessment-calc';
import { dimensions, questions, scaleOptions } from '../src/data/assessment-data';
import type { AssessmentAnswers } from '../src/types/assessment';

test('conteúdo possui 16 questões únicas em 8 dimensões e escala 0–6', () => {
  assert.equal(questions.length, 16);
  assert.equal(new Set(questions.map(q => q.id)).size, 16);
  assert.equal(dimensions.length, 8);
  assert.deepEqual(dimensions.flatMap(d => [...d.questionIds]), questions.map(q => q.id));
  assert.deepEqual(scaleOptions.map(option => option.value), [0, 1, 2, 3, 4, 5, 6]);
});

test('classificação usa uma casa decimal antes de aplicar os limites', () => {
  for (const [score, level] of [[0, 'inicial'], [1.94, 'inicial'], [1.95, 'em-desenvolvimento'], [1.96, 'em-desenvolvimento'], [2, 'em-desenvolvimento'], [3.94, 'em-desenvolvimento'], [3.96, 'consolidado'], [4, 'consolidado'], [5, 'consolidado']] as const) {
    assert.equal(classifyMaturity(score), level);
  }
  assert.equal(classifyMaturity(null), null);
  assert.throws(() => classifyMaturity(NaN));
});

test('6 é excluído, zero é mantido e média geral usa respostas válidas', () => {
  const result = calculateAssessment({ 1: 5, 2: 6, 3: 0, 4: 0 });
  assert.equal(result.dimensions[0].average, 5);
  assert.equal(result.dimensions[1].average, 0);
  assert.equal(result.overallAverage, 1.7);
  assert.deepEqual(result.strengths.map(d => d.id), ['estrategia', 'lideranca']);
  assert.deepEqual(result.gaps, []);
  assert.equal(result.scoredCount, 3);
  assert.equal(result.unknownCount, 1);
  assert.equal(result.isComplete, false);
  assert.equal(calculateAverage([0, 6]), 0);
});

test('rankings relativos incluem duas dimensões mesmo entre 2 e 3.5; empate usa ordem original', () => {
  const result = calculateAssessment({ 1: 3, 2: 4, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 2, 9: 6, 10: 6 });
  assert.deepEqual(result.strengths.map(d => d.id), ['estrategia', 'lideranca']);
  assert.deepEqual(result.gaps.map(d => d.id), ['governanca', 'tecnologia']);
  const only = calculateAssessment({ 1: 6, 2: 4, 3: 6, 4: 6 });
  assert.equal(only.dimensions[0].average, 4);
  assert.equal(only.dimensions[1].average, null);
  assert.deepEqual(only.strengths.map(d => d.id), ['estrategia']);
  assert.deepEqual(only.gaps, []);
});

test('notas iguais não geram lacunas e rankings nunca se sobrepõem', () => {
  const equal = calculateAssessment(Object.fromEntries(questions.map(q => [q.id, 3])) as AssessmentAnswers);
  assert.deepEqual(equal.strengths.map(d => d.id), ['estrategia', 'lideranca']);
  assert.deepEqual(equal.gaps, []);
  const cases: AssessmentAnswers[] = [
    { 1: 5, 3: 3 },
    { 1: 5, 3: 3, 5: 1 },
    { 1: 3, 3: 3, 5: 3, 7: 2, 9: 2, 11: 6 },
  ];
  for (const answers of cases) {
    const result = calculateAssessment(answers);
    assert.ok(result.gaps.every(gap => !result.strengths.some(strength => strength.id === gap.id)));
  }
  assert.deepEqual(calculateAssessment(cases[1]).gaps.map(d => d.id), ['governanca']);
  assert.deepEqual(calculateAssessment(cases[2]).gaps.map(d => d.id), ['tecnologia', 'cultura']);
});

test('extremos e arredondamento são consistentes com o nível e o valor exibido', () => {
  for (const [value, level] of [[0, 'inicial'], [5, 'consolidado']] as const) {
    const answers = Object.fromEntries(questions.map(q => [q.id, value])) as AssessmentAnswers;
    assert.equal(calculateAssessment(answers).overallAverage, value);
    assert.equal(calculateAssessment(answers).level, level);
  }
  // 31 / 16 = 1.9375, 63 / 16 = 3.9375: não arredondar dimensões antes da média geral.
  const answers = Object.fromEntries(questions.map(q => [q.id, q.id === 16 ? 1 : 2])) as AssessmentAnswers;
  assert.equal(calculateAssessment(answers).overallAverage, 1.9);
  assert.equal(calculateAssessment(answers).level, 'inicial');
  answers[16] = 2;
  assert.equal(calculateAssessment(answers).overallAverage, 2);
  assert.equal(calculateAssessment(answers).level, 'em-desenvolvimento');
});

test('nenhuma resposta válida não produz classificação artificial', () => {
  const answers = Object.fromEntries(questions.map(q => [q.id, 6])) as AssessmentAnswers;
  const result = calculateAssessment(answers);
  assert.equal(result.isComplete, true);
  assert.equal(result.overallAverage, null);
  assert.equal(result.level, null);
  assert.equal(result.content, null);
  assert.deepEqual(result.strengths, []);
  assert.deepEqual(result.gaps, []);
  assert.equal(calculateAssessment({}).isComplete, false);
});

test('respostas inválidas são rejeitadas em runtime', () => {
  assert.throws(() => calculateAssessment({ 1: 7 } as unknown as AssessmentAnswers));
  assert.throws(() => calculateAssessment({ 17: 1 }));
});
