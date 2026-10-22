import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { calculateAssessment, calculateAverage, classifyMaturity } from '../src/lib/assessment-calc';
import { buildTrackedCtaUrl, CTA_URL, dimensions, questions, scaleOptions } from '../src/data/assessment-data';
import type { AssessmentAnswers } from '../src/types/assessment';
import { resultContents } from '../src/data/assessment-data';
import { buildRespondentEmailHtml, buildSupabaseSubmissionRows, sendRespondentWebhook } from '../src/lib/assessment-submission';

test('respondent email includes each maturity narrative, dimensions, guidance and safe personalized content', () => {
  for (const value of [1, 3, 5] as const) {
    const { submissionRow } = buildSupabaseSubmissionRows({
      submissionId: 'respondent-test',
      lead: { name: '<script>alert("x")</script>', email: 'qa@example.com', phone: '11999990000', company: 'A&B', role: '<b>CEO</b>' },
      answers: Object.fromEntries(questions.map(q => [q.id, value])) as AssessmentAnswers,
      comments: { 1: '<img src=x onerror="alert(1)">' },
    });
    const html = buildRespondentEmailHtml({ submissionRow });
    const content = resultContents[value === 1 ? 'inicial' : value === 3 ? 'em-desenvolvimento' : 'consolidado'];
    assert.ok(html.startsWith('<!DOCTYPE html>'));
    for (const text of [content.label, content.challenge, content.headline, ...content.paragraphs, content.guidanceTitle, ...content.guidance, ...dimensions.map(d => d.name), `${value},0 / 5,0`, '#000000', '#FAB600', '#F9FAFB', 'Principais Avanços', 'Principais Lacunas', 'Converse com nossos especialistas', 'Suas observações']) assert.ok(html.includes(text), text);
    assert.ok(html.includes('A&amp;B'));
    assert.ok(html.includes('&lt;b&gt;CEO&lt;/b&gt;'));
    assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
    assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
    assert.ok(html.includes(submissionRow.cta_tracking_url.replaceAll('&', '&amp;')));
    assert.ok(!/<script|<img|<b>CEO/.test(html));
    assert.equal(buildRespondentEmailHtml({ submissionRow }), html);
    submissionRow.cta_tracking_url = 'javascript:alert(1)';
    const safeHtml = buildRespondentEmailHtml({ submissionRow });
    assert.ok(!safeHtml.includes('javascript:'));
    assert.ok(safeHtml.includes('href="https://innoscience.com.br/contato"'));
  }
});

test('respondent email handles unknown answers, missing comments and mixed dimension scores', () => {
  const { submissionRow } = buildSupabaseSubmissionRows({
    submissionId: 'unknown', lead: { name: 'Ana', email: 'qa@example.com', phone: '11999990000', company: 'Empresa', role: 'CEO' },
    answers: Object.fromEntries(questions.map(q => [q.id, 6])) as AssessmentAnswers,
  });
  const html = buildRespondentEmailHtml({ submissionRow });
  assert.ok(html.includes('Sem classificação por enquanto'));
  assert.ok(html.includes('Sem informação suficiente'));
  assert.ok(html.includes('Como obter uma visão mais completa?'));
  assert.ok(!html.includes('6,0 / 5,0'));
  assert.ok(!html.includes('Suas observações'));
  submissionRow.dimensions_summary[0].average = 0;
  submissionRow.dimensions_summary[1].average = 2.5;
  const mixed = buildRespondentEmailHtml({ submissionRow });
  assert.ok(mixed.includes('0,0 / 5,0'));
  assert.ok(mixed.includes('2,5 / 5,0'));
});

test('respondent webhook sends recipient aliases and rejects network and HTTP failures', async () => {
  const { submissionRow } = buildSupabaseSubmissionRows({ submissionId: 'send-test', lead: { name: 'Ana', email: 'qa@example.com', phone: '11999990000', company: 'Empresa', role: 'CEO' }, answers: {} });
  const options = { webhookUrl: 'https://example.com/respondent', email: 'qa@example.com', name: 'Ana', company: 'Empresa', subject: 'Resultado', html: '<html></html>', submissionRow };
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, options.webhookUrl);
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(init?.body as string), { email: options.email, to: options.email, lead_email: options.email, name: options.name, company: options.company, subject: options.subject, html: options.html, submission: submissionRow });
      return new Response(null, { status: 200 });
    };
    await sendRespondentWebhook(options);
    globalThis.fetch = async () => new Response(null, { status: 503 });
    await assert.rejects(sendRespondentWebhook(options), /HTTP 503/);
    globalThis.fetch = async () => { throw new Error('Network failure'); };
    await assert.rejects(sendRespondentWebhook(options), /Network failure/);
  } finally { globalThis.fetch = original; }
});

test('API isolates both webhook failures after saving to Supabase', async () => {
  const { POST } = await import('../src/app/api/assessment/route');
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
  const originalError = console.error;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.com';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.N8N_WEBHOOK_URL = 'https://example.com/marketing';
    process.env.N8N_RESPONDENT_WEBHOOK_URL = 'https://example.com/respondent';
    console.error = () => {};
    for (const [marketingOk, respondentOk] of [[true, true], [false, true], [true, false], [false, false]]) {
      const calls: string[] = [];
      globalThis.fetch = async (url) => {
        const target = String(url);
        calls.push(target);
        if (target.includes('supabase.example.com')) return new Response(null, { status: 201 });
        assert.equal(calls.filter(call => call.includes('supabase.example.com')).length, 2);
        if (target.endsWith('/marketing') && !marketingOk) throw new Error('Network failure');
        return new Response(null, { status: target.endsWith('/respondent') && !respondentOk ? 503 : 200 });
      };
      const response = await POST(new Request('https://example.com/api/assessment', { method: 'POST', body: JSON.stringify({ lead: { name: 'Ana', email: 'qa@example.com', phone: '11999990000', company: 'Empresa', role: 'CEO' }, answers: Object.fromEntries(questions.map(q => [q.id, 3])) }) }));
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.ok, true);
      assert.equal(body.webhookSent, marketingOk);
      assert.equal(body.respondentWebhookSent, respondentOk);
      assert.equal(calls.length, 4);
    }
  } finally {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
    console.error = originalError;
  }
});

test('conteúdo possui 16 questões únicas em 8 dimensões com sufixo IA, escala 0–6 e URL de rastreio', () => {
  assert.equal(questions.length, 16);
  assert.equal(new Set(questions.map(q => q.id)).size, 16);
  assert.equal(dimensions.length, 8);
  assert.ok(dimensions.every(d => d.name.endsWith(' IA')));
  assert.deepEqual(dimensions.flatMap(d => [...d.questionIds]), questions.map(q => q.id));
  assert.deepEqual(scaleOptions.map(option => option.value), [0, 1, 2, 3, 4, 5, 6]);
  assert.ok(CTA_URL.includes('utm_source=assessment-ia'));
  const tracked = buildTrackedCtaUrl({
    level: 'em-desenvolvimento',
    overallAverage: 3.2,
    lead: {
      name: 'Ana Souza',
      email: 'ana@empresa.com.br',
      phone: '(11) 99999-9999',
      company: 'Acme Corp',
      role: 'Diretora',
    },
  });
  assert.ok(tracked.includes('utm_source=assessment-ia'));
  assert.ok(tracked.includes('nivel=em-desenvolvimento'));
  assert.ok(tracked.includes('media=3.2'));
  assert.ok(tracked.includes('empresa=Acme+Corp'));
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

test('buildSupabaseSubmissionRows monta payload completo de submissão, 16 respostas, comentários e rastreio', async () => {
  const { buildSupabaseSubmissionRows } = await import('../src/lib/assessment-submission');
  const answers = Object.fromEntries(questions.map(q => [q.id, q.id === 16 ? 6 : 4])) as AssessmentAnswers;
  const { submissionRow, questionRows } = buildSupabaseSubmissionRows({
    submissionId: '11111111-2222-4333-8444-555555555555',
    lead: {
      name: 'Carlos Silva',
      email: 'carlos@innoscience.com.br',
      phone: '(11) 98888-7777',
      company: 'Innoscience',
      role: 'Sócio',
    },
    answers,
    comments: { 1: 'Planejamento concluído', 16: 'Em mapeamento' },
    tracking: {
      utm_source: 'linkedin',
      utm_medium: 'social',
      utm_campaign: 'lancamento-ia',
      origem: 'post-executivo',
      query_params: { custom_ref: 'abc' },
    },
  });

  assert.equal(submissionRow.id, '11111111-2222-4333-8444-555555555555');
  assert.equal(submissionRow.lead_name, 'Carlos Silva');
  assert.equal(submissionRow.overall_average, 4);
  assert.equal(submissionRow.maturity_level, 'consolidado');
  assert.equal(submissionRow.scored_count, 15);
  assert.equal(submissionRow.unknown_count, 1);
  assert.equal(submissionRow.utm_source, 'linkedin');
  assert.equal(submissionRow.origem, 'post-executivo');
  assert.ok(submissionRow.cta_tracking_url.includes('submission_id=11111111-2222-4333-8444-555555555555'));
  assert.equal(questionRows.length, 16);
  assert.equal(questionRows[0].comment, 'Planejamento concluído');
  assert.equal(questionRows[15].is_unknown, true);
});



test('email de marketing inclui relatório completo e escapa campos do usuário', async () => {
  const { buildMarketingEmailHtml, buildSupabaseSubmissionRows } = await import('../src/lib/assessment-submission');
  const answers = Object.fromEntries(questions.map(q => [q.id, q.id === 16 ? 6 : q.id === 1 ? 0 : 4])) as AssessmentAnswers;
  const rows = buildSupabaseSubmissionRows({
    submissionId: '11111111-2222-4333-8444-555555555555',
    lead: { name: '<script>alert("lead")</script>', email: 'qa@example.com', phone: '11999990000', company: "A&B's", role: '<b>Diretor</b>' },
    answers,
    comments: { 1: '<img src=x onerror="alert(1)">', 16: 'Em avaliação' },
    tracking: { utm_source: '<script>tracking</script>', landing_url: 'https://example.com/?a=1&b=2', query_params: { custom: '<svg onload=alert(1)>' } },
  });
  const html = buildMarketingEmailHtml({ ...rows, submittedAt: '2026-10-19T15:30:00.000Z' });
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  for (const dimension of dimensions) assert.ok(html.includes(dimension.name));
  for (const question of questions) assert.ok(html.includes(`${question.id}. ${question.title.replaceAll('&', '&amp;')}`));
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'origem', 'referrer', 'landing_url', 'cta_tracking_url']) assert.ok(html.includes(key));
  for (const value of ['#000000', '#FAB600', '#F9FAFB', '3,7 / 5,0', 'Em desenvolvimento', 'Estruturar e ampliar as práticas existentes', '19/10/2026', '12:30:00', rows.submissionRow.id, 'qa@example.com', '11999990000', 'Principais Avanãos', 'Principais Lacunas', 'Não sei informar', 'Em avaliação', '0 / 5', scaleOptions[0].label]) assert.ok(html.includes(value), value);
  assert.ok(html.includes('&lt;script&gt;alert(&quot;lead&quot;)&lt;/script&gt;'));
  assert.ok(html.includes('A&amp;B&#39;s'));
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
  assert.ok(html.includes('&lt;script&gt;tracking&lt;/script&gt;'));
  assert.ok(html.includes('&lt;svg onload=alert(1)&gt;'));
  assert.ok(!/<script|<img|<svg|<b>Diretor/.test(html));
  assert.equal(buildMarketingEmailHtml({ ...rows, submittedAt: '2026-10-19T15:30:00.000Z' }), html);
});

test('email com todas as respostas desconhecidas não inventa nota ou maturidade', async () => {
  const { buildMarketingEmailHtml, buildSupabaseSubmissionRows } = await import('../src/lib/assessment-submission');
  const rows = buildSupabaseSubmissionRows({
    submissionId: 'unknown-test',
    lead: { name: 'Teste', email: 'qa@example.com', phone: '11999990000', company: 'Empresa', role: 'QA' },
    answers: Object.fromEntries(questions.map(q => [q.id, 6])) as AssessmentAnswers,
  });
  const html = buildMarketingEmailHtml({ ...rows, submittedAt: '2026-10-19T15:30:00Z' });
  assert.ok(html.includes('Sem informação'));
  assert.ok(html.includes('Sem classificação'));
  assert.ok(!html.includes('6,0 / 5,0'));
});

test('webhook envia JSON contratado e rejeita status HTTP sem sucesso', async () => {
  const { sendMarketingWebhook, buildSupabaseSubmissionRows } = await import('../src/lib/assessment-submission');
  const rows = buildSupabaseSubmissionRows({ submissionId: 'webhook-test', lead: { name: 'QA', email: 'qa@example.com', phone: '11999990000', company: 'Empresa', role: 'QA' }, answers: {} });
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, 'https://example.com/webhook');
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(init?.body as string), { subject: 'Teste', html: '<html></html>', submission: rows.submissionRow, questions: rows.questionRows });
      return new Response(null, { status: 200 });
    };
    const options = { ...rows, webhookUrl: 'https://example.com/webhook', subject: 'Teste', html: '<html></html>' };
    await sendMarketingWebhook(options);
    globalThis.fetch = async () => new Response(null, { status: 503 });
    await assert.rejects(sendMarketingWebhook(options), /HTTP 503/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
