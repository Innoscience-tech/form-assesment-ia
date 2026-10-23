import { NextResponse } from 'next/server';
import { questions } from '@/data/assessment-data';
import { isAnswerValue } from '@/lib/assessment-calc';
import {
  isValidLead,
  buildRespondentEmailHtml,
  sendRespondentWebhook,
  DEFAULT_N8N_RESPONDENT_WEBHOOK_URL,
  buildMarketingEmailHtml,
  sendMarketingWebhook,
  DEFAULT_N8N_WEBHOOK_URL,
  buildSupabaseSubmissionRows,
  insertSubmissionIntoSupabase,
} from '@/lib/assessment-submission';
import type {
  AssessmentAnswers,
  AssessmentComments,
  AssessmentTracking,
} from '@/types/assessment';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseKey = (
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )?.trim();

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { ok: false, error: 'Credenciais do Supabase não configuradas.' },
        { status: 500 }
      );
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Payload inválido.' },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;
    if (!isValidLead(payload.lead)) {
      return NextResponse.json(
        { ok: false, error: 'Dados de identificação (lead) inválidos ou incompletos.' },
        { status: 400 }
      );
    }

    if (
      !payload.answers ||
      typeof payload.answers !== 'object' ||
      Array.isArray(payload.answers)
    ) {
      return NextResponse.json(
        { ok: false, error: 'Respostas inválidas.' },
        { status: 400 }
      );
    }

    const answers: AssessmentAnswers = {};
    for (const q of questions) {
      const val = (payload.answers as Record<string, unknown>)[String(q.id)];
      if (!isAnswerValue(val)) {
        return NextResponse.json(
          { ok: false, error: `A questão ${q.id} não possui resposta válida.` },
          { status: 400 }
        );
      }
      answers[q.id] = val;
    }

    const comments: AssessmentComments = {};
    if (
      payload.comments &&
      typeof payload.comments === 'object' &&
      !Array.isArray(payload.comments)
    ) {
      for (const [id, text] of Object.entries(
        payload.comments as Record<string, unknown>
      )) {
        if (
          questions.some((q) => String(q.id) === id) &&
          typeof text === 'string' &&
          text.trim().length > 0
        ) {
          comments[Number(id)] = text.trim();
        }
      }
    }

    const rawTracking =
      payload.tracking &&
      typeof payload.tracking === 'object' &&
      !Array.isArray(payload.tracking)
        ? (payload.tracking as AssessmentTracking)
        : {};

    const tracking: AssessmentTracking = {
      ...rawTracking,
      user_agent:
        rawTracking.user_agent || request.headers.get('user-agent') || null,
      referrer:
        rawTracking.referrer || request.headers.get('referer') || null,
    };

    const submissionId =
      typeof payload.submissionId === 'string' &&
      UUID_REGEX.test(payload.submissionId)
        ? payload.submissionId
        : crypto.randomUUID();

    const { submissionRow, questionRows } = buildSupabaseSubmissionRows({
      submissionId,
      lead: payload.lead,
      answers,
      comments,
      tracking,
    });

    await insertSubmissionIntoSupabase({
      supabaseUrl,
      supabaseKey,
      submissionRow,
      questionRows,
    });

    const [marketingResult, respondentResult] = await Promise.allSettled([
      Promise.resolve().then(() => sendMarketingWebhook({
        webhookUrl: process.env.N8N_WEBHOOK_URL?.trim() || DEFAULT_N8N_WEBHOOK_URL,
        subject: `Novo assessment de IA - ${submissionRow.lead_company}`,
        html: buildMarketingEmailHtml({ submissionRow, questionRows, submittedAt: new Date().toISOString() }),
        submissionRow,
        questionRows,
      })),
      Promise.resolve().then(() => sendRespondentWebhook({
        webhookUrl: process.env.N8N_RESPONDENT_WEBHOOK_URL?.trim() || DEFAULT_N8N_RESPONDENT_WEBHOOK_URL,
        email: submissionRow.lead_email,
        name: submissionRow.lead_name,
        company: submissionRow.lead_company,
        subject: `Seu diagnostico de IA - ${submissionRow.lead_company}`,
        html: buildRespondentEmailHtml({ submissionRow }),
        submissionRow,
      })),
    ]);
    const webhookSent = marketingResult.status === 'fulfilled';
    const respondentWebhookSent = respondentResult.status === 'fulfilled';
    if (marketingResult.status === 'rejected') console.error('Assessment salvo; falha no webhook de marketing:', marketingResult.reason);
    if (respondentResult.status === 'rejected') console.error('Assessment salvo; falha no webhook do respondente:', respondentResult.reason);

    return NextResponse.json(
      {
        ok: true,
        webhookSent,
        respondentWebhookSent,
        submissionId,
        ctaTrackingUrl: submissionRow.cta_tracking_url,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao salvar diagnóstico.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
