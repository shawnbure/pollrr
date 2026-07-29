import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";

export const dynamic = "force-dynamic";

async function membership(requestedOrganizationId?: string | null) {
  const user = await getChatGPTUser();
  if (!user) return null;
  if (requestedOrganizationId) {
    const platform = await env.DB.prepare("SELECT role FROM platform_admins WHERE email=?").bind(user.email).first();
    if (platform) return env.DB.prepare(
      "SELECT id organization_id,'platform_admin' role,name organization_name FROM organizations WHERE id=?",
    ).bind(requestedOrganizationId).first<{ organization_id: string; role: string; organization_name: string }>();
  }
  return env.DB.prepare(
    `SELECT om.organization_id, om.role, o.name organization_name
     FROM organization_members om JOIN organizations o ON o.id=om.organization_id
     WHERE om.email=? LIMIT 1`,
  ).bind(user.email).first<{ organization_id: string; role: string; organization_name: string }>();
}

export async function GET(request: Request) {
  const member = await membership(new URL(request.url).searchParams.get("organizationId"));
  if (!member) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [campaigns, audiences, links, questions] = await Promise.all([
    env.DB.prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM questions q WHERE q.campaign_id=c.id) polls,
        (SELECT COUNT(*) FROM distribution_links dl WHERE dl.campaign_id=c.id) links,
        (SELECT COALESCE(SUM(dl.clicks),0) FROM distribution_links dl WHERE dl.campaign_id=c.id) clicks
       FROM campaigns c WHERE c.organization_id=? ORDER BY c.created_at DESC`,
    ).bind(member.organization_id).all(),
    env.DB.prepare(
      `SELECT a.*,
        (SELECT COUNT(*) FROM audience_contacts ac WHERE ac.audience_id=a.id) contacts,
        (SELECT COUNT(*) FROM audience_contacts ac WHERE ac.audience_id=a.id AND ac.consent_status='consented') consented
       FROM audiences a WHERE a.organization_id=? ORDER BY a.created_at DESC`,
    )
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
  const body = await request.json().catch(() => null) as Record<string, string> | null;
  const member = await membership(body?.organizationId);
  if (!member) return Response.json({ error: "Unauthorized" }, { status: 401 });
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
      `INSERT INTO audiences
       (id,organization_id,name,description,geography,type,status,target_size,consent_basis,created_at)
       VALUES (?,?,?,?,?,?,'draft',?,?,?)`,
    ).bind(id, member.organization_id, body.name.trim().slice(0, 100),
      body.description?.trim().slice(0, 300) || null, body.geography?.trim().slice(0, 100) || null,
      body.type || "organic", Number(body.targetSize) || null, body.consentBasis?.trim().slice(0, 200) || null, now).run();
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

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, string> | null;
  const member = await membership(body?.organizationId);
  if (!member || !["owner", "admin", "editor"].includes(member.role)) {
    if (member?.role !== "platform_admin")
    return Response.json({ error: "Editor access required." }, { status: 403 });
  }
  if (!body?.kind || !body.id) return Response.json({ error: "Invalid update." }, { status: 400 });
  if (body.kind === "campaign") {
    await env.DB.prepare("UPDATE campaigns SET name=?,objective=?,status=? WHERE id=? AND organization_id=?")
      .bind(body.name?.trim().slice(0, 100), body.objective?.trim().slice(0, 300) || null,
        body.status || "draft", body.id, member.organization_id).run();
  } else if (body.kind === "audience") {
    await env.DB.prepare(
      `UPDATE audiences SET name=?,description=?,geography=?,type=?,status=?,target_size=?,consent_basis=?
       WHERE id=? AND organization_id=?`,
    ).bind(body.name?.trim().slice(0, 100), body.description?.trim().slice(0, 300) || null,
      body.geography?.trim().slice(0, 100) || null, body.type || "organic", body.status || "draft",
      Number(body.targetSize) || null, body.consentBasis?.trim().slice(0, 200) || null,
      body.id, member.organization_id).run();
  } else if (body.kind === "link") {
    await env.DB.prepare("UPDATE distribution_links SET label=?,channel=?,status=? WHERE id=? AND organization_id=?")
      .bind(body.label?.trim().slice(0, 100), body.channel || "link", body.status || "active", body.id, member.organization_id).run();
  } else return Response.json({ error: "Unsupported resource." }, { status: 400 });
  return Response.json({ id: body.id });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const member = await membership(url.searchParams.get("organizationId"));
  if (!member || !["owner", "admin"].includes(member.role)) {
    if (member?.role !== "platform_admin")
    return Response.json({ error: "Administrator access required." }, { status: 403 });
  }
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id");
  if (!kind || !id) return Response.json({ error: "Invalid delete." }, { status: 400 });
  if (kind === "link") {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM distribution_events WHERE distribution_link_id=?").bind(id),
      env.DB.prepare("DELETE FROM distribution_links WHERE id=? AND organization_id=?").bind(id, member.organization_id),
    ]);
    return Response.json({ deleted: true });
  }
  const table = kind === "campaign" ? "campaigns" : kind === "audience" ? "audiences" : null;
  if (!table) return Response.json({ error: "Unsupported resource." }, { status: 400 });
  const dependencies = kind === "campaign"
    ? await env.DB.prepare("SELECT COUNT(*) count FROM questions WHERE campaign_id=?").bind(id).first<{ count: number }>()
    : await env.DB.prepare("SELECT COUNT(*) count FROM audience_contacts WHERE audience_id=?").bind(id).first<{ count: number }>();
  if (Number(dependencies?.count ?? 0) > 0) {
    return Response.json({ error: "Archive this record because it has history." }, { status: 409 });
  }
  await env.DB.prepare(`DELETE FROM ${table} WHERE id=? AND organization_id=?`).bind(id, member.organization_id).run();
  return Response.json({ deleted: true });
}
