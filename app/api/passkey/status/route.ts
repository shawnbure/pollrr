import { verifyCreatorId } from "../../../lib/creator-cookie";
import { env } from "cloudflare:workers";
import { cookies } from "next/headers";

export async function GET(){
  const id=await verifyCreatorId((await cookies()).get("pollrr_creator")?.value) || "";
  const account=/^[a-f0-9-]{36}$/.test(id)?await env.DB.prepare("SELECT handle FROM creator_accounts WHERE id=?").bind(id).first<{handle:string}>():null;
  return Response.json({claimed:Boolean(account),handle:account?.handle||null,passkeySupported:true});
}
