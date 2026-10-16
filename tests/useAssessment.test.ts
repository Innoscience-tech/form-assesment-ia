import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { assessmentReducer, initialAssessmentState, parseAssessmentSession } from '../src/hooks/useAssessment';
import { questions } from '../src/data/assessment-data';

const ready = () => assessmentReducer(initialAssessmentState, { type: 'restore', state: null });

test('autoAdvance false apenas marca, cancela avanço pendente e permite avançar manualmente', () => {
  let state = assessmentReducer(ready(), { type: 'start' });
  state = assessmentReducer(state, { type: 'answer', value: 2 });
  assert.equal(state.pendingAdvance, true);
  state = assessmentReducer(state, { type: 'answer', value: 3, autoAdvance: false });
  assert.equal(state.answers[1], 3);
  assert.equal(state.currentIndex, 0);
  assert.equal(state.pendingAdvance, false);
  const advanced = assessmentReducer(state, { type: 'next' });
  assert.equal(advanced.currentIndex, 1);
  const explicitAuto = assessmentReducer(state, { type: 'answer', value: 6, autoAdvance: true });
  assert.equal(explicitAuto.pendingAdvance, true);
  assert.equal(explicitAuto.answers[1], 6);
});

test('navegação preserva respostas, impede avançar em branco e cancela avanço ao voltar', () => {
  let state = assessmentReducer(ready(), { type: 'start' });
  assert.equal(assessmentReducer(state, { type: 'next' }), state);
  state = assessmentReducer(state, { type: 'answer', value: 0 });
  assert.equal(state.answers[1], 0);
  assert.equal(state.currentIndex, 0);
  assert.equal(state.pendingAdvance, true);
  state = assessmentReducer(state, { type: 'next' });
  assert.equal(state.currentIndex, 1);
  state = assessmentReducer(state, { type: 'answer', value: 6 });
  state = assessmentReducer(state, { type: 'back' });
  assert.equal(state.currentIndex, 0);
  assert.equal(state.pendingAdvance, false);
  assert.deepEqual(state.answers, { 1: 0, 2: 6 });
  state = assessmentReducer(state, { type: 'back' });
  assert.equal(state.stage, 'intro');
});

test('16 respostas percorrem quiz, calculating e result; refazer limpa o estado', () => {
  let state = assessmentReducer(ready(), { type: 'start' });
  for (let index = 0; index < 16; index++) {
    assert.equal(state.currentIndex, index);
    state = assessmentReducer(state, { type: 'answer', value: 6 });
    state = assessmentReducer(state, { type: 'next' });
  }
  assert.equal(state.stage, 'calculating');
  assert.equal(state.currentIndex, 15);
  assert.equal(assessmentReducer(state, { type: 'answer', value: 5 }), state);
  state = assessmentReducer(state, { type: 'finish' });
  assert.equal(state.stage, 'result');
  assert.deepEqual(assessmentReducer(state, { type: 'restart' }), ready());
});

test('restaura sessão válida sem avançar automaticamente; rejeita dados corrompidos', () => {
  const encode = (changes = {}) => JSON.stringify({ version: 1, stage: 'quiz', currentIndex: 3, answers: { 1: 0, 2: 6 }, ...changes });
  const restored = parseAssessmentSession(encode());
  assert.equal(restored?.currentIndex, 3);
  assert.equal(restored?.pendingAdvance, false);
  assert.deepEqual(restored?.answers, { 1: 0, 2: 6 });
  for (const raw of [null, '{', 'null', encode({ version: 2 }), encode({ currentIndex: 16 }), encode({ currentIndex: -1 }), encode({ answers: { 1: 7 } }), encode({ answers: { 17: 1 } }), encode({ stage: 'invalid' })]) {
    assert.equal(parseAssessmentSession(raw), null);
  }
  const incompleteResult = parseAssessmentSession(encode({ stage: 'result' }));
  assert.equal(incompleteResult?.stage, 'quiz');
  assert.equal(incompleteResult?.currentIndex, 2);
  const completeResult = parseAssessmentSession(encode({ stage: 'result', answers: Object.fromEntries(questions.map(q => [q.id, 6])) }));
  assert.equal(completeResult?.stage, 'result');
});
