import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { contactChannel, contactHash, encryptContact, maskContact, normalizeContact } from "../../../lib/contact-vault";

export const dynamic = "force-dynamic";

type AppEnv = typeof env & { CONTACT_VAULT_KEY?: string };
type Member = { email: string; organization_id: string; role: string; organization_name: string; platform_role?: string };

async function context(requestedOrganizationId?: string | null): Promise<Member | null> {
  const user = await getChatGPTUser();
  if (!user) return null;
  const platform = await env.DB.prepare("SELECT role FROM platform_admins WHERE email=?")
    .bind(user.email).first<{ role: string }>();
  const member = await env.DB.prepare(
    `SELECT om.organization_id,om.role,o.name organization_name
     FROM organization_members om JOIN organizations o ON o.id=om.organization_id
     WHERE om.email=? AND om.status='active' LIMIT 1`,
  ).bind(user.email).first<Omit<Member, "email">>();
  if (!member && !platform) return null;
  return {
    email: user.email,
    organization_id: platform && requestedOrganizationId ? requestedOrganizationId : member?.organization_id ?? "",
    role: member?.role ?? "platform",
    organization_name: member?.organization_name ?? "Pollrr platform",
    platform_role: platform?.role,
  };
}

const canManage = (member: Member) => ["owner", "admin"].includes(member.role) || Boolean(member.platform_role);

async function audit(member: Member, action: string, resourceType: string, resourceId: string | null, details: object = {}) {
  await env.DB.prepare(
    `INSERT INTO audit_log (id,organization_id,actor_email,action,resource_type,resource_id,details_json,created_at)
     VALUES (?,?,?,?,?,?,?,?)`,
  ).bind(crypto.randomUUID(), member.organization_id || null, member.email, action, resourceType, resourceId, JSON.stringify(details), Date.now()).run();
}

export async function GET(request: Request) {
  const member = await context();
  if (!member) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const requestedOrg = url.searchParams.get("organizationId");
  const organizationId = member.platform_role && requestedOrg ? requestedOrg : member.organization_id;
  if (!organizationId && member.platform_role) {
    const [organizations,platformPolls] = await Promise.all([env.DB.prepare(
      `SELECT o.*,
        (SELECT COUNT(*) FROM organization_members m WHERE m.organization_id=o.id) members,
        (SELECT COUNT(*) FROM campaigns c WHERE c.organization_id=o.id) campaigns,
        (SELECT COUNT(*) FROM votes v JOIN questions q ON q.id=v.question_id WHERE q.organization_id=o.id) responses
       FROM organizations o ORDER BY o.created_at DESC`,
    ).all(),env.DB.prepare(
      `SELECT q.id,q.public_token publicToken,q.prompt,q.option_a optionA,q.option_b optionB,q.status,q.topic,q.tags,q.region,q.created_by,q.created_at,o.name organization_name,
        COUNT(v.id) responses
       FROM questions q JOIN organizations o ON o.id=q.organization_id
       LEFT JOIN votes v ON v.question_id=q.id
       GROUP BY q.id ORDER BY q.created_at DESC`,
    ).all()]);
    return Response.json({ platform:true,organizations:organizations.results,platformPolls:platformPolls.results });
  }
  const [team, reports, integrations, imports, audienceMetrics, channels, daily, audits, organizations, platformPolls] = await Promise.all([
    env.DB.prepare("SELECT email,role,status,title,created_at FROM organization_members WHERE organization_id=? ORDER BY created_at").bind(organizationId).all(),
    env.DB.prepare("SELECT * FROM saved_reports WHERE organization_id=? ORDER BY updated_at DESC").bind(organizationId).all(),
    env.DB.prepare("SELECT id,provider,account_label,status,capabilities,updated_at FROM integrations WHERE organization_id=? ORDER BY provider").bind(organizationId).all(),
    env.DB.prepare(
      `SELECT ai.*,a.name audience_name FROM audience_imports ai JOIN audiences a ON a.id=ai.audience_id
       WHERE ai.organization_id=? ORDER BY ai.created_at DESC LIMIT 20`,
    ).bind(organizationId).all(),
    env.DB.prepare(
      `SELECT a.id,a.name,a.type,a.status,a.target_size,a.consent_basis,
        COUNT(ac.id) contacts,
        SUM(CASE WHEN ac.consent_status='consented' THEN 1 ELSE 0 END) consented
       FROM audiences a LEFT JOIN audience_contacts ac ON ac.audience_id=a.id
       WHERE a.organization_id=? GROUP BY a.id ORDER BY a.created_at DESC`,
    ).bind(organizationId).all(),
    env.DB.prepare(
      `SELECT channel,COUNT(*) links,COALESCE(SUM(clicks),0) opens,COALESCE(SUM(responses),0) responses
       FROM distribution_links WHERE organization_id=? GROUP BY channel ORDER BY responses DESC`,
    ).bind(organizationId).all(),
    env.DB.prepare(
      `SELECT date(v.created_at/1000,'unixepoch') day,COUNT(*) responses,
        SUM(CASE WHEN ve.integrity_status='trusted' THEN 1 ELSE 0 END) trusted
       FROM votes v JOIN questions q ON q.id=v.question_id LEFT JOIN vote_events ve ON ve.vote_id=v.id
       WHERE q.organization_id=? GROUP BY day ORDER BY day DESC LIMIT 30`,
    ).bind(organizationId).all(),
    env.DB.prepare(
      `SELECT actor_email,action,resource_type,created_at FROM audit_log
       WHERE organization_id=? ORDER BY created_at DESC LIMIT 20`,
    ).bind(organizationId).all(),
    member.platform_role ? env.DB.prepare(
      `SELECT o.*,
        (SELECT COUNT(*) FROM organization_members m WHERE m.organization_id=o.id) members,
        (SELECT COUNT(*) FROM campaigns c WHERE c.organization_id=o.id) campaigns,
        (SELECT COUNT(*) FROM votes v JOIN questions q ON q.id=v.question_id WHERE q.organization_id=o.id) responses
       FROM organizations o ORDER BY o.created_at DESC`,
    ).all() : Promise.resolve({ results: [] }),
    member.platform_role ? env.DB.prepare(
      `SELECT q.id,q.public_token publicToken,q.prompt,q.option_a optionA,q.option_b optionB,q.status,q.topic,q.tags,q.region,q.created_by,q.created_at,o.name organization_name,
        COUNT(v.id) responses
       FROM questions q JOIN organizations o ON o.id=q.organization_id
       LEFT JOIN votes v ON v.question_id=q.id
       GROUP BY q.id ORDER BY q.created_at DESC`,
    ).all() : Promise.resolve({ results: [] }),
  ]);
  return Response.json({
    platform: Boolean(member.platform_role), organizationId, organizations: organizations.results,
    team: team.results, reports: reports.results, integrations: integrations.results,
    imports: imports.results, audienceMetrics: audienceMetrics.results,
    analytics: { channels: channels.results, daily: daily.results },
    audits: audits.results,
    platformPolls: platformPolls.results,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const member = await context(String(body?.organizationId ?? "") || null);
  if (!member || !canManage(member)) return Response.json({ error: "Owner or administrator access required." }, { status: 403 });
  const kind = String(body?.kind ?? "");
  const now = Date.now();

  if (kind === "organization" && member.platform_role) {
    const name = String(body?.name ?? "").trim().slice(0, 100);
    const contactEmail = String(body?.contactEmail ?? "").trim().toLowerCase();
    if (!name || !contactEmail.includes("@")) return Response.json({ error: "Name and client email are required." }, { status: 400 });
    const id = crypto.randomUUID();
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 45)}-${id.slice(0, 6)}`;
    await env.DB.batch([
      env.DB.prepare("INSERT INTO organizations (id,name,slug,status,plan,contact_email,created_at) VALUES (?,?,?,'active',?,?,?)")
        .bind(id, name, slug, String(body?.plan ?? "pilot"), contactEmail, now),
      env.DB.prepare("INSERT INTO organization_members (organization_id,email,role,status,title,created_at) VALUES (?,?,'owner','active','Client owner',?)")
        .bind(id, contactEmail, now),
    ]);
    await audit(member, "create", "organization", id, { name });
    return Response.json({ id }, { status: 201 });
  }

  if (!member.organization_id) return Response.json({ error: "Choose an organization." }, { status: 400 });
  if (kind === "member") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = String(body?.role ?? "viewer");
    if (!email.includes("@") || !["owner","admin","analyst","editor","viewer"].includes(role)) {
      return Response.json({ error: "Valid email and role required." }, { status: 400 });
    }
    await env.DB.prepare(
      `INSERT INTO organization_members (organization_id,email,role,status,title,created_at)
       VALUES (?,?,?,'invited',?,?)
       ON CONFLICT(organization_id,email) DO UPDATE SET role=excluded.role,status='invited',title=excluded.title`,
    ).bind(member.organization_id, email, role, String(body?.title ?? "").slice(0, 80) || null, now).run();
    await audit(member, "invite", "member", email, { role });
    return Response.json({ email, status: "invited" }, { status: 201 });
  }
  if (kind === "report") {
    const id = crypto.randomUUID();
    const name = String(body?.name ?? "").trim().slice(0, 100);
    if (!name) return Response.json({ error: "Report name is required." }, { status: 400 });
    await env.DB.prepare(
      `INSERT INTO saved_reports (id,organization_id,campaign_id,name,description,filters_json,visibility,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).bind(id, member.organization_id, body?.campaignId || null, name, String(body?.description ?? "").slice(0, 300) || null,
      JSON.stringify(body?.filters ?? {}), String(body?.visibility ?? "workspace"), member.email, now, now).run();
    await audit(member, "create", "report", id, { name });
    return Response.json({ id }, { status: 201 });
  }
  if (kind === "integration") {
    const provider = String(body?.provider ?? "").toLowerCase();
    if (!["facebook","instagram","tiktok","linkedin","email","sms","embed"].includes(provider)) {
      return Response.json({ error: "Unsupported provider." }, { status: 400 });
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO integrations (id,organization_id,provider,account_label,status,capabilities,created_by,created_at,updated_at)
       VALUES (?,?,?,?,'setup_required',?,?,?,?)
       ON CONFLICT(organization_id,provider) DO UPDATE SET account_label=excluded.account_label,updated_at=excluded.updated_at`,
    ).bind(id, member.organization_id, provider, String(body?.accountLabel ?? "").slice(0, 100) || null,
      JSON.stringify(["creative_export","tracked_share"]), member.email, now, now).run();
    await audit(member, "configure", "integration", provider);
    return Response.json({ id, status: "setup_required" }, { status: 201 });
  }
  if (kind === "import") {
    const vaultKey = (env as AppEnv).CONTACT_VAULT_KEY;
    if (!vaultKey) return Response.json({ error: "Contact vault is not configured." }, { status: 503 });
    const audienceId = String(body?.audienceId ?? "");
    const audience = await env.DB.prepare("SELECT id FROM audiences WHERE id=? AND organization_id=?")
      .bind(audienceId, member.organization_id).first();
    if (!audience) return Response.json({ error: "Audience not found." }, { status: 404 });
    const csv = String(body?.csv ?? "");
    if (csv.length > 1_000_000) return Response.json({ error: "Import must be under 1 MB." }, { status: 413 });
    const lines = csv.split(/\r?\n/).filter(Boolean).slice(0, 5001);
    const header = lines.shift()?.split(",").map((value) => value.trim().toLowerCase()) ?? [];
    const contactIndex = Math.max(header.indexOf("email"), header.indexOf("phone"), header.indexOf("contact"));
    const firstNameIndex = header.indexOf("first_name");
    if (contactIndex < 0) return Response.json({ error: "CSV needs an email, phone, or contact column." }, { status: 400 });
    let accepted = 0;
    let duplicates = 0;
    const statements: D1PreparedStatement[] = [];
    for (const line of lines) {
      const columns = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
      const normalized = normalizeContact(columns[contactIndex] ?? "");
      if (normalized.length < 6) continue;
      const hash = await contactHash(normalized);
      statements.push(env.DB.prepare(
        `INSERT OR IGNORE INTO audience_contacts
         (id,organization_id,audience_id,channel,contact_ciphertext,contact_hash,masked_contact,first_name_ciphertext,
          consent_status,consent_source,consent_text,consented_at,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(crypto.randomUUID(), member.organization_id, audienceId, contactChannel(normalized),
        await encryptContact(normalized, vaultKey), hash, maskContact(normalized),
        firstNameIndex >= 0 && columns[firstNameIndex] ? await encryptContact(columns[firstNameIndex], vaultKey) : null,
        body?.confirmedConsent ? "consented" : "pending", "customer_import",
        String(body?.consentText ?? "Customer confirmed lawful permission to contact this person.").slice(0, 300),
        body?.confirmedConsent ? now : null, now));
    }
    for (let index = 0; index < statements.length; index += 75) {
      const results = await env.DB.batch(statements.slice(index, index + 75));
      for (const result of results) {
        if (result.meta.changes) accepted++;
        else duplicates++;
      }
    }
    const importId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO audience_imports (id,organization_id,audience_id,filename,row_count,accepted_count,duplicate_count,status,created_by,created_at)
       VALUES (?,?,?,?,?,?,?,'complete',?,?)`,
    ).bind(importId, member.organization_id, audienceId, String(body?.filename ?? "contacts.csv").slice(0, 120),
      lines.length, accepted, duplicates, member.email, now).run();
    await audit(member, "import", "audience", audienceId, { accepted, duplicates });
    return Response.json({ id: importId, accepted, duplicates }, { status: 201 });
  }
  return Response.json({ error: "Unsupported operation." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, string> | null;
  const member = await context(body?.organizationId);
  if (!member || !canManage(member)) return Response.json({ error: "Administrator access required." }, { status: 403 });
  if (!body?.resource || !body.id) return Response.json({ error: "Invalid update." }, { status: 400 });
  if (body.resource === "organization") {
    if (!member.platform_role) return Response.json({ error: "Platform administrator access required." }, { status: 403 });
    const name = String(body.name ?? "").trim().slice(0, 100);
    const contactEmail = String(body.contactEmail ?? "").trim().toLowerCase();
    const plan = String(body.plan ?? "pilot");
    if (!name || !contactEmail.includes("@") || !["free","pilot","professional","enterprise"].includes(plan)) {
      return Response.json({ error: "Valid client name, owner email, and plan are required." }, { status: 400 });
    }
    const status=["active","archived"].includes(String(body.status))?String(body.status):"active";
    await env.DB.prepare("UPDATE organizations SET name=?,contact_email=?,plan=?,status=? WHERE id=?")
      .bind(name, contactEmail, plan, status, body.id).run();
  } else if (body.resource === "member") {
    await env.DB.prepare("UPDATE organization_members SET role=?,status=? WHERE organization_id=? AND email=?")
      .bind(body.role, body.status, member.organization_id, body.id).run();
  } else if (body.resource === "campaign") {
    await env.DB.prepare("UPDATE campaigns SET name=?,objective=?,status=? WHERE organization_id=? AND id=?")
      .bind(body.name, body.objective || null, body.status, member.organization_id, body.id).run();
  } else if (body.resource === "audience") {
    await env.DB.prepare("UPDATE audiences SET name=?,description=?,geography=?,type=?,status=?,target_size=?,consent_basis=? WHERE organization_id=? AND id=?")
      .bind(body.name, body.description || null, body.geography || null, body.type, body.status, Number(body.targetSize) || null, body.consentBasis || null, member.organization_id, body.id).run();
  } else if (body.resource === "report") {
    await env.DB.prepare("UPDATE saved_reports SET name=?,description=?,visibility=?,updated_at=? WHERE organization_id=? AND id=?")
      .bind(body.name, body.description || null, body.visibility, Date.now(), member.organization_id, body.id).run();
  } else return Response.json({ error: "Unsupported resource." }, { status: 400 });
  await audit(member, "update", body.resource, body.id);
  return Response.json({ id: body.id });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const member = await context(url.searchParams.get("organizationId"));
  if (!member || !canManage(member)) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const resource = url.searchParams.get("resource");
  const id = url.searchParams.get("id");
  if (!resource || !id) return Response.json({ error: "Invalid delete." }, { status: 400 });
  if (resource === "organization") {
    if (!member.platform_role) return Response.json({ error: "Platform administrator access required." }, { status: 403 });
    const usage = await env.DB.prepare(
      `SELECT
       (SELECT COUNT(*) FROM campaigns WHERE organization_id=?) campaigns,
       (SELECT COUNT(*) FROM votes v JOIN questions q ON q.id=v.question_id WHERE q.organization_id=?) responses`,
    ).bind(id, id).first<{ campaigns:number;responses:number }>();
    if (Number(usage?.campaigns) || Number(usage?.responses)) {
      await env.DB.prepare("UPDATE organizations SET status='archived' WHERE id=?").bind(id).run();
      await audit(member, "archive", "organization", id);
      return Response.json({ id, archived: true });
    }
    await audit(member, "delete", "organization", id);
    await env.DB.prepare("DELETE FROM organization_members WHERE organization_id=?").bind(id).run();
    await env.DB.prepare("DELETE FROM organizations WHERE id=?").bind(id).run();
    return Response.json({ id, deleted: true });
  }
  const statements: Record<string, { sql: string; key: string }> = {
    member: { sql: "DELETE FROM organization_members WHERE organization_id=? AND email=? AND role!='owner'", key: id },
    report: { sql: "DELETE FROM saved_reports WHERE organization_id=? AND id=?", key: id },
    integration: { sql: "DELETE FROM integrations WHERE organization_id=? AND id=?", key: id },
  };
  const target = statements[resource];
  if (!target) return Response.json({ error: "This resource must be archived instead of deleted." }, { status: 409 });
  await env.DB.prepare(target.sql).bind(member.organization_id, target.key).run();
  await audit(member, "delete", resource, id);
  return Response.json({ deleted: true });
}
