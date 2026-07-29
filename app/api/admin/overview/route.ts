import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const live = await env.DB.prepare(
    `SELECT q.id, q.prompt, q.topic, q.region, q.status, q.created_at,
      COUNT(v.id) AS votes,
      SUM(CASE WHEN v.choice = 'a' THEN 1 ELSE 0 END) AS option_a,
      SUM(CASE WHEN v.choice = 'b' THEN 1 ELSE 0 END) AS option_b
     FROM questions q
     LEFT JOIN votes v ON v.question_id = q.id
     WHERE q.status IN ('live', 'paused')
     GROUP BY q.id
     ORDER BY q.created_at DESC
     LIMIT 1`,
  ).first();

  const pipeline = await env.DB.prepare(
    `SELECT q.id, q.prompt, q.status, q.created_at, COUNT(v.id) AS votes
     FROM questions q
     LEFT JOIN votes v ON v.question_id = q.id
     GROUP BY q.id
     ORDER BY q.created_at DESC
     LIMIT 20`,
  ).all();

  const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM votes")
    .first<{ count: number }>();
  const integrity = await env.DB.prepare(
    `SELECT COUNT(*) total,
      SUM(CASE WHEN integrity_status='trusted' THEN 1 ELSE 0 END) trusted,
      SUM(CASE WHEN integrity_status='flagged' THEN 1 ELSE 0 END) flagged
     FROM vote_events`,
  ).first();
  const ledger = await env.DB.prepare(
    `SELECT snapshot_hash, human_total, created_at FROM aggregate_snapshots
     ORDER BY created_at DESC LIMIT 1`,
  ).first();

  return Response.json({
    user,
    live,
    totalResponses: Number(total?.count ?? 0),
    integrity,
    ledger,
    questions: pipeline.results,
  });
}
