import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    questionId?: string;
    voterKey?: string;
    reasonId?: string | null;
    explanation?: string | null;
    quoteConsent?: boolean;
  } | null;
  if (!body?.questionId || !body.voterKey || (!body.reasonId && !body.explanation?.trim())) {
    return Response.json({ error: "Choose a reason or add a short explanation." }, { status: 400 });
  }
  const vote = await env.DB.prepare(
    "SELECT id, choice FROM votes WHERE question_id = ? AND voter_key = ?",
  ).bind(body.questionId, body.voterKey).first<{ id: string; choice: string }>();
  if (!vote) return Response.json({ error: "A counted vote is required first." }, { status: 403 });
  const reason = body.reasonId
    ? await env.DB.prepare(
      "SELECT id FROM question_reasons WHERE id = ? AND question_id = ?",
    ).bind(body.reasonId, body.questionId).first<{ id: string }>()
    : null;
  await env.DB.prepare(
    `INSERT INTO explanations
      (id, vote_id, question_id, choice, reason_id, explanation, quote_consent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(vote_id) DO UPDATE SET
       reason_id=excluded.reason_id, explanation=excluded.explanation,
       quote_consent=excluded.quote_consent`,
  ).bind(
    crypto.randomUUID(), vote.id, body.questionId, vote.choice, reason?.id ?? null,
    body.explanation?.trim().slice(0, 280) || null, body.quoteConsent ? 1 : 0, Date.now(),
  ).run();
  return Response.json({ saved: true });
}
