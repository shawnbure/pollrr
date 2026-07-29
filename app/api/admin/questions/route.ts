import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";

export const dynamic = "force-dynamic";

async function authorize() {
  return getChatGPTUser();
}

export async function POST(request: Request) {
  const user = await authorize();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    prompt?: string;
    optionA?: string;
    optionB?: string;
    topic?: string;
    region?: string;
    campaignId?: string;
  } | null;

  const prompt = body?.prompt?.trim() ?? "";
  if (prompt.length < 12 || prompt.length > 180) {
    return Response.json({ error: "Question must be 12–180 characters." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const campaign = body?.campaignId
    ? await env.DB.prepare(
      `SELECT c.id,c.organization_id FROM campaigns c
       WHERE c.id=? AND (
         EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id=c.organization_id AND om.email=? AND om.role IN ('owner','admin','editor'))
         OR EXISTS (SELECT 1 FROM platform_admins pa WHERE pa.email=?)
       )`,
    ).bind(body.campaignId, user.email, user.email).first<{ id: string; organization_id: string }>()
    : null;
  if (!campaign) return Response.json({ error: "Choose a campaign." }, { status: 400 });
  await env.DB.prepare(
    `INSERT INTO questions
      (id, prompt, option_a, option_b, topic, region, status, scheduled_at, created_at, organization_id, campaign_id)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', NULL, ?, ?, ?)`,
  ).bind(
    id,
    prompt,
    body?.optionA?.trim().slice(0, 60) || "Yes",
    body?.optionB?.trim().slice(0, 60) || "No",
    body?.topic?.trim().slice(0, 50) || "General",
    body?.region?.trim().slice(0, 50) || "United States",
    Date.now(),
    campaign.organization_id,
    campaign.id,
  ).run();

  return Response.json({ id, status: "draft" }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await authorize();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as {
    id?: string;
    status?: "live" | "paused" | "closed";
    prompt?: string;
    optionA?: string;
    optionB?: string;
    topic?: string;
    region?: string;
  } | null;
  if (!body?.id) {
    return Response.json({ error: "Invalid update." }, { status: 400 });
  }
  const owned = await env.DB.prepare(
    `SELECT q.id FROM questions q JOIN organization_members om ON om.organization_id=q.organization_id
     WHERE q.id=? AND om.email=? AND om.role IN ('owner','admin','editor')`,
  ).bind(body.id, user.email).first();
  if (!owned) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (body.prompt) {
    await env.DB.prepare(
      "UPDATE questions SET prompt=?,option_a=?,option_b=?,topic=?,region=? WHERE id=?",
    ).bind(body.prompt.trim().slice(0, 180), body.optionA?.trim().slice(0, 60) || "Yes",
      body.optionB?.trim().slice(0, 60) || "No", body.topic?.trim().slice(0, 50) || "General",
      body.region?.trim().slice(0, 50) || "United States", body.id).run();
  }
  if (body.status === "live") {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE questions SET status='paused' WHERE status='live' AND organization_id=
         (SELECT organization_id FROM questions WHERE id=?)`,
      ).bind(body.id),
      env.DB.prepare("UPDATE questions SET status = 'live' WHERE id = ?").bind(body.id),
    ]);
  } else if (body.status && ["paused", "closed", "draft"].includes(body.status)) {
    await env.DB.prepare("UPDATE questions SET status = ? WHERE id = ?")
      .bind(body.status, body.id).run();
  }
  return Response.json({ id: body.id, status: body.status ?? "updated" });
}

export async function DELETE(request: Request) {
  const user = await authorize();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Question id required." }, { status: 400 });
  const row = await env.DB.prepare(
    `SELECT q.id,(SELECT COUNT(*) FROM votes v WHERE v.question_id=q.id) votes
     FROM questions q JOIN organization_members om ON om.organization_id=q.organization_id
     WHERE q.id=? AND om.email=? AND om.role IN ('owner','admin')`,
  ).bind(id, user.email).first<{ id: string; votes: number }>();
  if (!row) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (Number(row.votes) > 0) return Response.json({ error: "Close this poll; immutable vote history cannot be deleted." }, { status: 409 });
  await env.DB.batch([
    env.DB.prepare("DELETE FROM question_reasons WHERE question_id=?").bind(id),
    env.DB.prepare("DELETE FROM questions WHERE id=?").bind(id),
  ]);
  return Response.json({ deleted: true });
}
