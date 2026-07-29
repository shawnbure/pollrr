import { env } from "cloudflare:workers";
import { contactChannel, contactHash, encryptContact, maskContact, normalizeContact } from "../../lib/contact-vault";

export const dynamic = "force-dynamic";
type AppEnv = typeof env & { CONTACT_VAULT_KEY?: string };

export async function POST(request: Request) {
  const vaultKey = (env as AppEnv).CONTACT_VAULT_KEY;
  if (!vaultKey) return Response.json({ error: "Contact vault unavailable." }, { status: 503 });
  const body = await request.json().catch(() => null) as {
    organizationId?: string; contact?: string; interests?: string; consent?: boolean;
  } | null;
  if (!body?.consent || !body.organizationId || !body.contact) {
    return Response.json({ error: "Explicit consent and contact information are required." }, { status: 400 });
  }
  const organization = await env.DB.prepare("SELECT id FROM organizations WHERE id=? AND status='active'")
    .bind(body.organizationId).first();
  const normalized = normalizeContact(body.contact);
  if (!organization || normalized.length < 6 || (!normalized.includes("@") && normalized.replace(/\D/g, "").length < 10)) {
    return Response.json({ error: "Enter a valid email address or mobile number." }, { status: 400 });
  }
  const now = Date.now();
  const hash = await contactHash(normalized);
  const consentText = "I want Pollrr to notify me about future polls. My contact information is stored separately from my votes, is not sold, and I can unsubscribe.";
  await env.DB.prepare(
    `INSERT INTO contact_opt_ins
     (id,organization_id,channel,contact_ciphertext,contact_hash,masked_contact,interests,consent_version,consent_text,status,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,'active',?)
     ON CONFLICT(organization_id,contact_hash) DO UPDATE SET
       contact_ciphertext=excluded.contact_ciphertext,interests=excluded.interests,consent_text=excluded.consent_text,status='active',revoked_at=NULL`,
  ).bind(crypto.randomUUID(), body.organizationId, contactChannel(normalized),
    await encryptContact(normalized, vaultKey), hash, maskContact(normalized),
    body.interests?.trim().slice(0, 150) || null, "2026-07-29", consentText, now).run();
  return Response.json({ saved: true, maskedContact: maskContact(normalized), separation: "No vote or question identifier is stored with this contact." }, { status: 201 });
}
