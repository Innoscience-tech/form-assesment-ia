import { buildTrackedCtaUrl, dimensions, questions, resultContents, scaleOptions } from '@/data/assessment-data';
import { calculateAssessment, isAnswerValue } from '@/lib/assessment-calc';
import type {
  AssessmentAnswers,
  AssessmentComments,
  AssessmentLead,
  AssessmentTracking,
} from '@/types/assessment';

export function isValidLead(value: unknown): value is AssessmentLead {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.name !== 'string' ||
    typeof candidate.email !== 'string' ||
    typeof candidate.phone !== 'string' ||
    typeof candidate.company !== 'string' ||
    typeof candidate.role !== 'string'
  ) {
    return false;
  }
  const name = candidate.name.trim();
  const email = candidate.email.trim();
  const phoneDigits = candidate.phone.replace(/\D/g, '');
  const company = candidate.company.trim();
  const role = candidate.role.trim();

  return (
    name.length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phoneDigits.length >= 8 &&
    company.length >= 1 &&
    role.length >= 1
  );
}

export interface SupabaseSubmissionRow {
  id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  lead_company: string;
  lead_role: string;
  overall_average: number | null;
  maturity_level: string | null;
  answered_count: number;
  scored_count: number;
  unknown_count: number;
  score_estrategia: number | null;
  score_lideranca: number | null;
  score_governanca: number | null;
  score_tecnologia: number | null;
  score_cultura: number | null;
  score_funding: number | null;
  score_pessoas: number | null;
  score_relacionamentos: number | null;
  strengths: Array<{ id: string; name: string; average: number | null; level: string | null }>;
  gaps: Array<{ id: string; name: string; average: number | null; level: string | null }>;
  dimensions_summary: Array<{
    id: string;
    name: string;
    average: number | null;
    level: string | null;
    answeredCount: number;
    scoredCount: number;
    unknownCount: number;
  }>;
  answers: Record<string, number>;
  comments: Record<string, string>;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  origem: string | null;
  referrer: string | null;
  landing_url: string | null;
  cta_tracking_url: string;
  user_agent: string | null;
  tracking_params: Record<string, unknown>;
}

export interface SupabaseQuestionResponseRow {
  submission_id: string;
  question_id: number;
  dimension_id: string;
  dimension_name: string;
  question_title: string;
  answer_value: number;
  is_unknown: boolean;
  comment: string | null;
}

export function extractBrowserTracking(): AssessmentTracking {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const query_params: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      query_params[key] = val;
    });

    return {
      utm_source: searchParams.get('utm_source') ?? 'assessment-ia',
      utm_medium: searchParams.get('utm_medium') ?? 'diagnostico',
      utm_campaign: searchParams.get('utm_campaign') ?? 'octogono-ia',
      utm_content: searchParams.get('utm_content'),
      utm_term: searchParams.get('utm_term'),
      origem: searchParams.get('origem') ?? 'assessment-octogono-ia',
      referrer: document.referrer || null,
      landing_url: window.location.href,
      user_agent: navigator.userAgent || null,
      query_params,
    };
  } catch {
    return {};
  }
}

export function buildSupabaseSubmissionRows(input: {
  submissionId: string;
  lead: AssessmentLead;
  answers: AssessmentAnswers;
  comments?: AssessmentComments;
  tracking?: AssessmentTracking | null;
}): {
  submissionRow: SupabaseSubmissionRow;
  questionRows: SupabaseQuestionResponseRow[];
} {
  const { submissionId, lead, answers, comments = {}, tracking } = input;
  const result = calculateAssessment(answers);

  const dimScore = (id: string) =>
    result.dimensions.find((d) => d.id === id)?.average ?? null;

  const normalizedAnswers: Record<string, number> = {};
  const normalizedComments: Record<string, string> = {};

  for (const question of questions) {
    const val = answers[question.id];
    if (isAnswerValue(val)) {
      normalizedAnswers[String(question.id)] = val;
    }
    const rawComment = comments[question.id]?.trim();
    if (rawComment) {
      normalizedComments[String(question.id)] = rawComment;
    }
  }

  const ctaTrackingUrl = buildTrackedCtaUrl({
    level: result.level,
    overallAverage: result.overallAverage,
    lead,
    submissionId,
  });

  const utm_source = tracking?.utm_source?.trim() || 'assessment-ia';
  const utm_medium = tracking?.utm_medium?.trim() || 'diagnostico';
  const utm_campaign = tracking?.utm_campaign?.trim() || 'octogono-ia';
  const utm_content = tracking?.utm_content?.trim() || null;
  const utm_term = tracking?.utm_term?.trim() || null;
  const origem = tracking?.origem?.trim() || 'assessment-octogono-ia';
  const referrer = tracking?.referrer?.trim() || null;
  const landing_url = tracking?.landing_url?.trim() || null;
  const user_agent = tracking?.user_agent?.trim() || null;

  const submissionRow: SupabaseSubmissionRow = {
    id: submissionId,
    lead_name: lead.name.trim(),
    lead_email: lead.email.trim(),
    lead_phone: lead.phone.trim(),
    lead_company: lead.company.trim(),
    lead_role: lead.role.trim(),
    overall_average: result.overallAverage,
    maturity_level: result.level,
    answered_count: result.answeredCount,
    scored_count: result.scoredCount,
    unknown_count: result.unknownCount,
    score_estrategia: dimScore('estrategia'),
    score_lideranca: dimScore('lideranca'),
    score_governanca: dimScore('governanca'),
    score_tecnologia: dimScore('tecnologia'),
    score_cultura: dimScore('cultura'),
    score_funding: dimScore('funding'),
    score_pessoas: dimScore('pessoas'),
    score_relacionamentos: dimScore('relacionamentos'),
    strengths: result.strengths.map((s) => ({
      id: s.id,
      name: s.name,
      average: s.average,
      level: s.level,
    })),
    gaps: result.gaps.map((g) => ({
      id: g.id,
      name: g.name,
      average: g.average,
      level: g.level,
    })),
    dimensions_summary: result.dimensions.map((d) => ({
      id: d.id,
      name: d.name,
      average: d.average,
      level: d.level,
      answeredCount: d.answeredCount,
      scoredCount: d.scoredCount,
      unknownCount: d.unknownCount,
    })),
    answers: normalizedAnswers,
    comments: normalizedComments,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    origem,
    referrer,
    landing_url,
    cta_tracking_url: ctaTrackingUrl,
    user_agent,
    tracking_params: {
      ...(tracking?.query_params ?? {}),
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      origem,
      referrer,
      landing_url,
      cta_tracking_url: ctaTrackingUrl,
    },
  };

  const questionRows: SupabaseQuestionResponseRow[] = questions
    .filter((q) => isAnswerValue(answers[q.id]))
    .map((q) => {
      const answerValue = answers[q.id]!;
      const dim = dimensions.find((d) => d.id === q.dimensionId)!;
      const commentText = comments[q.id]?.trim() || null;

      return {
        submission_id: submissionId,
        question_id: q.id,
        dimension_id: q.dimensionId,
        dimension_name: dim.name,
        question_title: q.title,
        answer_value: answerValue,
        is_unknown: answerValue === 6,
        comment: commentText,
      };
    });

  return { submissionRow, questionRows };
}

export async function insertSubmissionIntoSupabase(options: {
  supabaseUrl: string;
  supabaseKey: string;
  submissionRow: SupabaseSubmissionRow;
  questionRows: SupabaseQuestionResponseRow[];
}): Promise<void> {
  const baseUrl = options.supabaseUrl.replace(/\/+$/, '');
  const headers: Record<string, string> = {
    apikey: options.supabaseKey,
    Authorization: `Bearer ${options.supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  const subRes = await fetch(`${baseUrl}/rest/v1/assessment_submissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(options.submissionRow),
  });

  if (!subRes.ok) {
    const errBody = await subRes.text().catch(() => '');
    throw new Error(
      `Falha ao gravar submissão no Supabase (${subRes.status}): ${errBody}`
    );
  }

  if (options.questionRows.length > 0) {
    const qRes = await fetch(`${baseUrl}/rest/v1/assessment_question_responses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(options.questionRows),
    });

    if (!qRes.ok) {
      const errBody = await qRes.text().catch(() => '');
      throw new Error(
        `Falha ao gravar respostas das questões no Supabase (${qRes.status}): ${errBody}`
      );
    }
  }
}

/** Escape every dynamic value before inserting it into email markup. */
function escapeEmailHtml(value: unknown): string {
  return String(value ?? 'Não informado').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

export function buildMarketingEmailHtml(input: {
  submissionRow: SupabaseSubmissionRow;
  questionRows: SupabaseQuestionResponseRow[];
  submittedAt: string;
}): string {
  const { submissionRow: row, questionRows, submittedAt } = input;
  const content = Object.values(resultContents).find(item => item.level === row.maturity_level);
  const score = (value: number | null) => value === null ? 'Sem informação' : `${value.toFixed(1).replace('.', ',')} / 5,0`;
  const field = (label: string, value: unknown) => `<tr><th align="left" valign="top" style="padding:10px;border-bottom:1px solid #E5E7EB;font-weight:600;width:35%;">${escapeEmailHtml(label)}</th><td style="padding:10px;border-bottom:1px solid #E5E7EB;word-break:break-word;">${escapeEmailHtml(value)}</td></tr>`;
  const table = (rows: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;line-height:1.6;">${rows}</table>`;
  const section = (title: string, body: string) => `<tr><td style="padding:24px 28px;border-bottom:1px solid #E5E7EB;"><h2 style="margin:0 0 16px;font-size:20px;color:#000000;">${escapeEmailHtml(title)}</h2>${body}</td></tr>`;
  const ranking = (items: SupabaseSubmissionRow['strengths']) => items.length
    ? table(items.map(item => field(item.name, score(item.average))).join(''))
    : '<p style="margin:0;font-size:14px;">Sem destaques relativos identificados nas respostas.</p>';
  const date = new Date(submittedAt);
  const formattedDate = Number.isNaN(date.getTime()) ? submittedAt : `${date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (America/Sao_Paulo)`;
  const lead = table([
    ['Nome', row.lead_name], ['E-mail', row.lead_email], ['Telefone', row.lead_phone],
    ['Empresa', row.lead_company], ['Cargo', row.lead_role], ['Data/hora', formattedDate], ['ID da submissão', row.id],
  ].map(([label, value]) => field(label, value)).join(''));
  const summary = table([
    field('Média geral', score(row.overall_average)),
    field('Nível de maturidade', content?.label ?? 'Sem classificação'),
    field('Principal desafio', content?.challenge ?? 'Obter visibilidade sobre as práticas de IA'),
    field('Respostas recebidas', row.answered_count),
    field('Respostas válidas (0–5)', row.scored_count),
    field('Não sei informar', row.unknown_count),
  ].join(''));
  const dimensionTable = table(dimensions.map(dimension => field(dimension.name,
    score(row.dimensions_summary.find(item => item.id === dimension.id)?.average ?? null))).join(''));
  const questionDetails = questions.map(question => {
    const response = questionRows.find(item => item.question_id === question.id);
    const option = scaleOptions.find(item => item.value === response?.answer_value);
    const answer = !response ? 'Sem resposta' : response.is_unknown ? 'Não sei informar' : `${response.answer_value} / 5`;
    return `<div style="padding:16px 0;border-bottom:1px solid #E5E7EB;"><h3 style="font-size:16px;margin:0 0 8px;">${escapeEmailHtml(`${question.id}. ${question.title}`)}</h3><p style="margin:0 0 8px;font-size:14px;line-height:1.6;">${escapeEmailHtml(question.text)}</p>${table(field('Dimensão', dimensions.find(item => item.id === question.dimensionId)?.name) + field('Nota escolhida', answer) + field('Descrição na escala', option?.label ?? 'Sem resposta') + (response?.comment ? field('Comentário', response.comment).replace('word-break:break-word;', 'word-break:break-word;white-space:pre-wrap;') : ''))}</div>`;
  }).join('');
  const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'origem', 'referrer', 'landing_url', 'cta_tracking_url'] as const;
  const tracking = table(trackingKeys.map(key => field(key, row[key])).join('') + field('user_agent', row.user_agent) + field('Parâmetros adicionais', JSON.stringify(row.tracking_params)));
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Assessment de IA | Innoscience</title></head><body style="margin:0;padding:0;background-color:#F9FAFB;color:#000000;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background-color:#FFFFFF;border-collapse:collapse;"><tr><td style="background-color:#000000;padding:32px 28px;border-bottom:6px solid #FAB600;"><p style="margin:0 0 16px;color:#FAB600;font-size:24px;font-weight:bold;">innoscience</p><h1 style="margin:0;color:#FFFFFF;font-size:28px;">Novo assessment de IA</h1><p style="margin:12px 0 0;color:#FFFFFF;font-size:14px;">Relatório completo para o time de marketing</p></td></tr>${section('Dados do Lead', lead)}${section('Resultado Geral', summary)}${section('Notas das 8 Dimensões IA', dimensionTable)}${section('Principais Avanãos', ranking(row.strengths))}${section('Principais Lacunas', ranking(row.gaps))}${section('Todas as 16 questões', questionDetails)}${section('Parâmetros de rastreio', tracking)}<tr><td style="padding:24px 28px;background-color:#FAB600;color:#000000;font-size:12px;line-height:1.6;">Innoscience · Octógono da IA<br>As respostas “Não sei informar” não entram no cálculo das médias.</td></tr></table></td></tr></table></body></html>`;
}

export const DEFAULT_N8N_WEBHOOK_URL = 'https://n8n.innoup.com.br/webhook/a678c7af-fecc-4fc9-b943-13848d27748c';

export async function sendMarketingWebhook(options: {
  webhookUrl: string;
  subject: string;
  html: string;
  submissionRow: SupabaseSubmissionRow;
  questionRows: SupabaseQuestionResponseRow[];
}): Promise<void> {
  const response = await fetch(options.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({ subject: options.subject, html: options.html, submission: options.submissionRow, questions: options.questionRows }),
  });
  if (!response.ok) throw new Error(`Falha no webhook de marketing (HTTP ${response.status}).`);
}
