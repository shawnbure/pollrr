import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { generateAuthenticationOptions, generateRegistrationOptions } from "@simplewebauthn/server";

export const dynamic = "force-dynamic";

function creatorId(value?: string) {
  return value && /^[a-f0-9-]{36}$/.test(value) ? value : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { mode?:string;handle?:string } | null;
  const mode = body?.mode;
  const url = new URL(request.url);
  const rpID = url.hostname;
  const origin = url.origin;
  const challengeId = crypto.randomUUID();
  const expiresAt = Date.now() + 5 * 60_000;

  if (mode === "register") {
    const accountId = creatorId((await cookies()).get("pollrr_creator")?.value);
    if (!accountId) return Response.json({ error:"Start a creator account first." }, { status:401 });
    const handle = String(body?.handle || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30);
    if (handle.length < 3) return Response.json({ error:"Choose a handle with at least 3 characters." }, { status:400 });
    const occupied = await env.DB.prepare("SELECT id FROM creator_accounts WHERE handle=? AND id<>?").bind(handle, accountId).first();
    if (occupied) return Response.json({ error:"That handle is already taken." }, { status:409 });
    const passkeys = await env.DB.prepare("SELECT credential_id id,transports FROM creator_passkeys WHERE account_id=?").bind(accountId).all<{id:string;transports:string}>();
    const options = await generateRegistrationOptions({
      rpName:"Pollrr",
      rpID,
      userID:new TextEncoder().encode(accountId),
      userName:handle,
      userDisplayName:`@${handle}`,
      attestationType:"none",
      excludeCredentials:passkeys.results.map(item=>({id:item.id,transports:JSON.parse(item.transports)})),
      authenticatorSelection:{residentKey:"required",userVerification:"required"},
      supportedAlgorithmIDs:[-7,-257],
    });
    await env.DB.prepare("INSERT INTO creator_auth_challenges (id,challenge,ceremony,account_id,handle,rp_id,origin,expires_at) VALUES (?,?,?,?,?,?,?,?)")
      .bind(challengeId,options.challenge,"register",accountId,handle,rpID,origin,expiresAt).run();
    return Response.json({ challengeId, options });
  }

  if (mode === "authenticate") {
    const options = await generateAuthenticationOptions({ rpID, userVerification:"required" });
    await env.DB.prepare("INSERT INTO creator_auth_challenges (id,challenge,ceremony,account_id,handle,rp_id,origin,expires_at) VALUES (?,?,? ,NULL,NULL,?,?,?)")
      .bind(challengeId,options.challenge,"authenticate",rpID,origin,expiresAt).run();
    return Response.json({ challengeId, options });
  }
  return Response.json({ error:"Invalid passkey request." }, { status:400 });
}
