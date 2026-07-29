import { env } from "cloudflare:workers";
import { publishSnapshot, sha256 } from "../../lib/ledger";

export const dynamic = "force-dynamic";

type PollRow = {
  id: string;
  prompt: string;
  option_a: string;
  option_b: string;
  topic: string;
  region: string;
  status: string;
};

async function livePoll(): Promise<PollRow | null> {
  return env.DB.prepare(
    `SELECT id, prompt, option_a, option_b, topic, region, status
     FROM questions
     WHERE status = 'live'
     ORDER BY created_at DESC
     LIMIT 1`,
  ).first<PollRow>();
}

async function totals(questionId: string) {
  const result = await env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN choice = 'a' THEN 1 ELSE 0 END) AS option_a,
       SUM(CASE WHEN choice = 'b' THEN 1 ELSE 0 END) AS option_b
     FROM votes
     WHERE question_id = ?`,
  ).bind(questionId).first<{ total: number; option_a: number; option_b: number }>();

  return {
    total: Number(result?.total ?? 0),
    optionA: Number(result?.option_a ?? 0),
    optionB: Number(result?.option_b ?? 0),
  };
}

export async function GET() {
  const poll = await livePoll();
  if (!poll) {
    return Response.json({ error: "No poll is live right now." }, { status: 404 });
  }

  const reasons = await env.DB.prepare(
    "SELECT id, label FROM question_reasons WHERE question_id = ? ORDER BY sort_order",
  ).bind(poll.id).all<{ id: string; label: string }>();
  return Response.json({
    poll: {
      id: poll.id,
      prompt: poll.prompt,
      optionA: poll.option_a,
      optionB: poll.option_b,
      topic: poll.topic,
      region: poll.region,
      status: poll.status,
    },
    reasons: reasons.results,
    resultPolicy: "Results unlock only after a human answer is counted.",
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    questionId?: string;
    choice?: string;
    voterKey?: string;
    rippleId?: string;
    parentRippleId?: string | null;
    responseMs?: number;
    reasonId?: string | null;
    explanation?: string | null;
    quoteConsent?: boolean;
  } | null;

  if (
    !body ||
    !body.questionId ||
    !["a", "b"].includes(body.choice ?? "") ||
    !body.voterKey ||
    body.voterKey.length > 80
  ) {
    return Response.json({ error: "Invalid vote." }, { status: 400 });
  }

  const ip = request.headers.get("cf-connecting-ip") || "local";
  const hour = Math.floor(Date.now() / 3_600_000);
  const guardKey = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}:${hour}`))),
  ).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const guard = await env.DB.prepare(
    `INSERT INTO vote_guards (guard_key, attempts, expires_at)
     VALUES (?, 1, ?)
     ON CONFLICT(guard_key) DO UPDATE SET attempts = attempts + 1
     RETURNING attempts`,
  ).bind(guardKey, (hour + 2) * 3_600_000).first<{ attempts: number }>();

  if (Number(guard?.attempts ?? 0) > 20) {
    return Response.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "retry-after": "3600" } },
    );
  }

  const poll = await env.DB.prepare(
    "SELECT id, status FROM questions WHERE id = ? LIMIT 1",
  ).bind(body.questionId).first<{ id: string; status: string }>();

  if (!poll || poll.status !== "live") {
    return Response.json({ error: "This poll is no longer accepting votes." }, { status: 409 });
  }

  const existing = await env.DB.prepare(
    "SELECT choice FROM votes WHERE question_id = ? AND voter_key = ? LIMIT 1",
  ).bind(body.questionId, body.voterKey).first<{ choice: string }>();

  if (existing) {
    return Response.json({
      accepted: true,
      duplicate: true,
      choice: existing.choice,
      totals: await totals(body.questionId),
    });
  }

  const id = crypto.randomUUID();
  const rippleId = body.rippleId?.slice(0, 80) || crypto.randomUUID();
  const createdAt = Date.now();
  const responseMs = Number.isFinite(body.responseMs) ? Math.max(0, Math.min(Number(body.responseMs), 600_000)) : null;
  const integrityStatus = responseMs !== null && responseMs < 900 ? "flagged" : "trusted";
  const integrityReason = integrityStatus === "flagged" ? "response_under_900ms" : "passed_v1_checks";
  const sourceClass = body.parentRippleId || body.rippleId ? "referred" : "direct";
  const eventId = crypto.randomUUID();
  const payloadHash = await sha256(JSON.stringify({
    eventId, voteId: id, questionId: body.questionId, choice: body.choice,
    responseMs, sourceClass, createdAt,
  }));
  const inserted = await env.DB.prepare(
    `INSERT OR IGNORE INTO votes
      (id, question_id, choice, ripple_id, parent_ripple_id, region_code, consent_version, voter_key, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, '2026-07-28', ?, ?)`,
  ).bind(
    id,
    body.questionId,
    body.choice,
    rippleId,
    body.parentRippleId?.slice(0, 80) || null,
    body.voterKey,
    createdAt,
  ).run();

  if (!inserted.meta.changes) {
    const counted = await env.DB.prepare(
      "SELECT choice FROM votes WHERE question_id = ? AND voter_key = ? LIMIT 1",
    ).bind(body.questionId, body.voterKey).first<{ choice: string }>();
    return Response.json({
      accepted: true,
      duplicate: true,
      choice: counted?.choice ?? body.choice,
      totals: await totals(body.questionId),
    });
  }

  await env.DB.prepare(
    `INSERT INTO vote_events
      (id, vote_id, question_id, payload_hash, integrity_status, integrity_reason,
       response_ms, source_class, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    eventId, id, body.questionId, payloadHash, integrityStatus, integrityReason,
    responseMs, sourceClass, createdAt,
  ).run();

  if (body.reasonId || body.explanation?.trim()) {
    const reason = body.reasonId
      ? await env.DB.prepare(
        "SELECT id FROM question_reasons WHERE id = ? AND question_id = ?",
      ).bind(body.reasonId, body.questionId).first<{ id: string }>()
      : null;
    await env.DB.prepare(
      `INSERT INTO explanations
        (id, vote_id, question_id, choice, reason_id, explanation, quote_consent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(), id, body.questionId, body.choice,
      reason?.id ?? null, body.explanation?.trim().slice(0, 280) || null,
      body.quoteConsent ? 1 : 0, createdAt,
    ).run();
  }

  await publishSnapshot(env, body.questionId);

  return Response.json({
    accepted: true,
    duplicate: false,
    voteId: id,
    choice: body.choice,
    integrity: { status: integrityStatus, reason: integrityReason },
    totals: await totals(body.questionId),
  }, { status: 201 });
}
