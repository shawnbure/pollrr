import { env } from "cloudflare:workers";

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
    totals: await totals(poll.id),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    questionId?: string;
    choice?: string;
    voterKey?: string;
    rippleId?: string;
    parentRippleId?: string | null;
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
    Date.now(),
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

  return Response.json({
    accepted: true,
    duplicate: false,
    choice: body.choice,
    totals: await totals(body.questionId),
  }, { status: 201 });
}
