import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let membership = await env.DB.prepare(
    "SELECT organization_id FROM organization_members WHERE email=? AND status='active' LIMIT 1",
  ).bind(user.email).first<{ organization_id: string }>();
  const requestedOrganizationId = new URL(request.url).searchParams.get("organizationId");
  if (requestedOrganizationId) {
    const platform = await env.DB.prepare("SELECT role FROM platform_admins WHERE email=?").bind(user.email).first();
    if (platform) membership = { organization_id: requestedOrganizationId };
  }
  if (!membership) return Response.json({ error: "No active workspace membership." }, { status: 403 });

  const live = await env.DB.prepare(
    `SELECT q.id, q.prompt, q.topic, q.region, q.status, q.created_at,
      COUNT(v.id) AS votes,
      SUM(CASE WHEN v.choice = 'a' THEN 1 ELSE 0 END) AS option_a,
      SUM(CASE WHEN v.choice = 'b' THEN 1 ELSE 0 END) AS option_b
     FROM questions q
     LEFT JOIN votes v ON v.question_id = q.id
     WHERE q.status IN ('live', 'paused') AND q.organization_id=?
     GROUP BY q.id
     ORDER BY q.created_at DESC
     LIMIT 1`,
  ).bind(membership.organization_id).first();

  const pipeline = await env.DB.prepare(
    `SELECT q.id, q.prompt, q.status, q.created_at, COUNT(v.id) AS votes
     FROM questions q
     LEFT JOIN votes v ON v.question_id = q.id
     WHERE q.organization_id=?
     GROUP BY q.id
     ORDER BY q.created_at DESC
     LIMIT 20`,
  ).bind(membership.organization_id).all();

  const total = await env.DB.prepare(
    "SELECT COUNT(*) count FROM votes v JOIN questions q ON q.id=v.question_id WHERE q.organization_id=?",
  ).bind(membership.organization_id).first<{ count: number }>();
  const integrity = await env.DB.prepare(
    `SELECT COUNT(*) total,
      SUM(CASE WHEN integrity_status='trusted' THEN 1 ELSE 0 END) trusted,
      SUM(CASE WHEN integrity_status='flagged' THEN 1 ELSE 0 END) flagged
     FROM vote_events ve JOIN questions q ON q.id=ve.question_id WHERE q.organization_id=?`,
  ).bind(membership.organization_id).first();
  const ledger = await env.DB.prepare(
    `SELECT s.snapshot_hash,s.human_total,s.created_at FROM aggregate_snapshots s
     JOIN questions q ON q.id=s.question_id WHERE q.organization_id=?
     ORDER BY s.created_at DESC LIMIT 1`,
  ).bind(membership.organization_id).first();

  return Response.json({
    user,
    live,
    totalResponses: Number(total?.count ?? 0),
    integrity,
    ledger,
    questions: pipeline.results,
  });
}
