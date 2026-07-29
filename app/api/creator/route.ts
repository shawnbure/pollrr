import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

type CreatorContext = { email:string; organizationId:string; platform:boolean };

async function creatorContext(create = false): Promise<CreatorContext | null> {
  const user = await getChatGPTUser();
  if (!user) return null;
  const platform = Boolean(await env.DB.prepare("SELECT role FROM platform_admins WHERE email=?").bind(user.email).first());
  let member = await env.DB.prepare(
    "SELECT organization_id FROM organization_members WHERE email=? AND status='active' ORDER BY created_at LIMIT 1",
  ).bind(user.email).first<{ organization_id:string }>();
  if (!member && create) {
    const organizationId = crypto.randomUUID();
    const now = Date.now();
    const slug = `creator-${organizationId.slice(0,8)}`;
    await env.DB.batch([
      env.DB.prepare("INSERT INTO organizations (id,name,slug,status,plan,contact_email,created_at) VALUES (?,?,?,'active','free',?,?)")
        .bind(organizationId, `${user.displayName}'s polls`, slug, user.email, now),
      env.DB.prepare("INSERT INTO organization_members (organization_id,email,role,status,title,created_at) VALUES (?,?,'owner','active','Creator',?)")
        .bind(organizationId, user.email, now),
    ]);
    member = { organization_id: organizationId };
  }
  if (!member) return { email:user.email,organizationId:"",platform };
  return { email:user.email,organizationId:member.organization_id,platform };
}

async function defaultCampaign(organizationId:string) {
  let campaign = await env.DB.prepare(
    "SELECT id FROM campaigns WHERE organization_id=? ORDER BY created_at LIMIT 1",
  ).bind(organizationId).first<{ id:string }>();
  if (!campaign) {
    campaign = { id:crypto.randomUUID() };
    await env.DB.prepare(
      "INSERT INTO campaigns (id,organization_id,name,objective,status,created_at) VALUES (?,?,?,'Creator poll library','active',?)",
    ).bind(campaign.id, organizationId, "My polls", Date.now()).run();
  }
  return campaign.id;
}

export async function GET() {
  const context = await creatorContext();
  if (!context) return Response.json({ error:"Unauthorized" },{ status:401 });
  if (!context.organizationId) return Response.json({ polls:[],preferences:{nightlyResults:false,aiPlan:"free"},platform:context.platform });
  const [polls,preferences] = await Promise.all([
    env.DB.prepare(
      `SELECT q.id,q.prompt,q.option_a optionA,q.option_b optionB,q.topic,q.tags,q.region,q.status,
        q.theme,q.is_public isPublic,q.created_at createdAt,
        COUNT(v.id) responses,
        SUM(CASE WHEN v.choice='a' THEN 1 ELSE 0 END) optionACount,
        SUM(CASE WHEN v.choice='b' THEN 1 ELSE 0 END) optionBCount,
        (SELECT snapshot_hash FROM aggregate_snapshots s WHERE s.question_id=q.id ORDER BY s.created_at DESC LIMIT 1) snapshotHash
       FROM questions q LEFT JOIN votes v ON v.question_id=q.id
       WHERE q.organization_id=? AND (q.created_by=? OR q.created_by IS NULL)
       GROUP BY q.id ORDER BY q.created_at DESC`,
    ).bind(context.organizationId,context.email).all(),
    env.DB.prepare("SELECT nightly_results,ai_plan FROM creator_preferences WHERE email=?")
      .bind(context.email).first<{ nightly_results:number;ai_plan:string }>(),
  ]);
  return Response.json({
    polls:polls.results,
    preferences:{nightlyResults:Boolean(preferences?.nightly_results),aiPlan:preferences?.ai_plan||"free"},
    platform:context.platform,
  });
}

export async function POST(request:Request) {
  const context = await creatorContext(true);
  if (!context?.organizationId) return Response.json({ error:"Unauthorized" },{ status:401 });
  const body = await request.json().catch(()=>null) as Record<string,unknown>|null;
  const prompt = String(body?.prompt||"").trim();
  const optionA = String(body?.optionA||"").trim();
  const optionB = String(body?.optionB||"").trim();
  if (prompt.length < 6 || prompt.length > 180) return Response.json({ error:"Ask a question between 6 and 180 characters." },{ status:400 });
  if (!optionA || !optionB) return Response.json({ error:"Add two answer choices." },{ status:400 });
  const id=crypto.randomUUID();
  const campaignId=await defaultCampaign(context.organizationId);
  await env.DB.prepare(
    `INSERT INTO questions
     (id,prompt,option_a,option_b,topic,tags,region,status,scheduled_at,created_at,organization_id,campaign_id,created_by,theme,is_public)
     VALUES (?,?,?,?,?, ?,?,'live',NULL,?,?,?,?,?,?)`,
  ).bind(id,prompt,optionA.slice(0,60),optionB.slice(0,60),String(body?.topic||"General").slice(0,50),
    String(body?.tags||"").split(",").map(tag=>tag.trim().toLowerCase()).filter(Boolean).slice(0,8).join(","),
    String(body?.region||"Everywhere").slice(0,50),Date.now(),context.organizationId,campaignId,context.email,
    ["paper","sunset","ocean","night"].includes(String(body?.theme))?String(body?.theme):"paper",body?.isPublic===false?0:1).run();
  return Response.json({ id,url:`/?p=${id}` },{ status:201 });
}

export async function PATCH(request:Request) {
  const context=await creatorContext();
  if (!context) return Response.json({ error:"Unauthorized" },{ status:401 });
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  if (body?.kind==="preferences") {
    const now=Date.now();
    await env.DB.prepare(
      `INSERT INTO creator_preferences (email,nightly_results,ai_plan,created_at,updated_at)
       VALUES (?,?, 'free',?,?)
       ON CONFLICT(email) DO UPDATE SET nightly_results=excluded.nightly_results,updated_at=excluded.updated_at`,
    ).bind(context.email,body.nightlyResults?1:0,now,now).run();
    return Response.json({ saved:true });
  }
  if (body?.kind==="poll") {
    const id=String(body.id||"");
    const prompt=String(body.prompt||"").trim();
    const optionA=String(body.optionA||"").trim();
    const optionB=String(body.optionB||"").trim();
    if(!id||prompt.length<6||prompt.length>180||!optionA||!optionB) {
      return Response.json({error:"Add a question and two answer choices."},{status:400});
    }
    const row=await env.DB.prepare(
      `SELECT q.id,(SELECT COUNT(*) FROM votes v WHERE v.question_id=q.id) votes
       FROM questions q WHERE q.id=? AND q.organization_id=? AND (q.created_by=? OR q.created_by IS NULL)`,
    ).bind(id,context.organizationId,context.email).first<{id:string;votes:number}>();
    if(!row)return Response.json({error:"Poll not found."},{status:404});
    if(Number(row.votes)>0)return Response.json({error:"Question wording and choices lock after the first response. Duplicate the poll to ask a revised version."},{status:409});
    await env.DB.prepare(
      "UPDATE questions SET prompt=?,option_a=?,option_b=?,topic=?,tags=? WHERE id=?",
    ).bind(prompt,optionA.slice(0,60),optionB.slice(0,60),String(body.topic||"General").slice(0,50),
      String(body.tags||"").split(",").map(tag=>tag.trim().toLowerCase()).filter(Boolean).slice(0,8).join(","),id).run();
    return Response.json({id,updated:true});
  }
  const id=String(body?.id||"");
  const status=String(body?.status||"");
  if (!id || !["live","paused","closed"].includes(status)) return Response.json({ error:"Invalid update." },{ status:400 });
  await env.DB.prepare(
    "UPDATE questions SET status=? WHERE id=? AND organization_id=? AND (created_by=? OR created_by IS NULL)",
  ).bind(status,id,context.organizationId,context.email).run();
  return Response.json({ id,status });
}

export async function DELETE(request:Request) {
  const context=await creatorContext();
  if(!context)return Response.json({error:"Unauthorized"},{status:401});
  const id=new URL(request.url).searchParams.get("id")||"";
  const row=await env.DB.prepare(
    `SELECT q.id,(SELECT COUNT(*) FROM votes v WHERE v.question_id=q.id) votes
     FROM questions q WHERE q.id=? AND q.organization_id=? AND (q.created_by=? OR q.created_by IS NULL)`,
  ).bind(id,context.organizationId,context.email).first<{id:string;votes:number}>();
  if(!row)return Response.json({error:"Poll not found."},{status:404});
  if(Number(row.votes)>0){
    await env.DB.prepare("UPDATE questions SET status='closed',is_public=0 WHERE id=?").bind(id).run();
    return Response.json({id,archived:true});
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM question_reasons WHERE question_id=?").bind(id),
    env.DB.prepare("DELETE FROM questions WHERE id=?").bind(id),
  ]);
  return Response.json({id,deleted:true});
}
