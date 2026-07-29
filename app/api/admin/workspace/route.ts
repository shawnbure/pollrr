import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";

export const dynamic = "force-dynamic";

async function membership() {
  const user = await getChatGPTUser();
  if (!user) return null;
  return env.DB.prepare(
    `SELECT om.organization_id, om.role, o.name organization_name
     FROM organization_members om JOIN organizations o ON o.id=om.organization_id
     WHERE om.email=? LIMIT 1`,
  ).bind(user.email).first<{ organization_id: string; role: string; organization_name: string }>();
}

export async function GET() {
  const member = await membership();
  if (!member) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [campaigns, audiences, links, questions] = await Promise.all([
    env.DB.prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM questions q WHERE q.campaign_id=c.id) polls,
        (SELECT COUNT(*) FROM distribution_links dl WHERE dl.campaign_id=c.id) links,
        (SELECT COALESCE(SUM(dl.clicks),0) FROM distribution_links dl WHERE dl.campaign_id=c.id) clicks
       FROM campaigns c WHERE c.organization_id=? ORDER BY c.created_at DESC`,
    ).bind(member.organization_id).all(),
    env.DB.prepare("SELECT * FROM audiences WHERE organization_id=? ORDER BY created_at DESC")
      .bind(member.organization_id).all(),
    env.DB.prepare(
      `SELECT dl.*, q.prompt, a.name audience_name
       FROM distribution_links dl JOIN questions q ON q.id=dl.question_id
       LEFT JOIN audiences a ON a.id=dl.audience_id
       WHERE dl.organization_id=? ORDER BY dl.created_at DESC`,
    ).bind(member.organization_id).all(),
    env.DB.prepare(
      `SELECT q.id,q.prompt,q.status,q.campaign_id,c.name campaign_name,COUNT(v.id) votes
       FROM questions q LEFT JOIN campaigns c ON c.id=q.campaign_id
       LEFT JOIN votes v ON v.question_id=q.id
       WHERE q.organization_id=? GROUP BY q.id ORDER BY q.created_at DESC`,
    ).bind(member.organization_id).all(),
  ]);
  return Response.json({
    organization: { id: member.organization_id, name: member.organization_name, role: member.role },
    campaigns: campaigns.results, audiences: audiences.results,
    links: links.results, questions: questions.results,
  });
}

export async function POST(request: Request) {
  const member = await membership();
  if (!member) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, string> | null;
  if (!body?.kind) return Response.json({ error: "Invalid request." }, { status: 400 });
  const id = crypto.randomUUID();
  const now = Date.now();
  if (body.kind === "campaign") {
    if (!body.name?.trim()) return Response.json({ error: "Campaign name is required." }, { status: 400 });
    await env.DB.prepare(
      `INSERT INTO campaigns (id,organization_id,name,objective,status,created_at)
       VALUES (?,?,?,?, 'draft',?)`,
    ).bind(id, member.organization_id, body.name.trim().slice(0, 100), body.objective?.trim().slice(0, 300) || null, now).run();
    return Response.json({ id, kind: body.kind }, { status: 201 });
  }
  if (body.kind === "audience") {
    if (!body.name?.trim()) return Response.json({ error: "Audience name is required." }, { status: 400 });
    await env.DB.prepare(
      `INSERT INTO audiences (id,organization_id,name,description,geography,created_at)
       VALUES (?,?,?,?,?,?)`,
    ).bind(id, member.organization_id, body.name.trim().slice(0, 100), body.description?.trim().slice(0, 300) || null, body.geography?.trim().slice(0, 100) || null, now).run();
    return Response.json({ id, kind: body.kind }, { status: 201 });
  }
  if (body.kind === "link") {
    const question = await env.DB.prepare(
      "SELECT id,campaign_id FROM questions WHERE id=? AND organization_id=?",
    ).bind(body.questionId, member.organization_id).first<{ id: string; campaign_id: string }>();
    if (!question?.campaign_id) return Response.json({ error: "Choose a campaign poll." }, { status: 400 });
    const token = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
    await env.DB.prepare(
      `INSERT INTO distribution_links
       (id,organization_id,campaign_id,question_id,audience_id,channel,label,token,clicks,created_at)
       VALUES (?,?,?,?,?,?,?,?,0,?)`,
    ).bind(id, member.organization_id, question.campaign_id, question.id, body.audienceId || null, body.channel || "link", body.label?.trim().slice(0, 100) || "Campaign link", token, now).run();
    return Response.json({ id, kind: body.kind, token, url: `/?p=${question.id}&src=${token}` }, { status: 201 });
  }
  return Response.json({ error: "Unsupported request." }, { status: 400 });
}
