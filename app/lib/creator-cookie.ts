import { env } from "cloudflare:workers";
const encoder = new TextEncoder();
function secret() {
  const value = (env as typeof env & { CREATOR_SESSION_SECRET?: string }).CREATOR_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("Set CREATOR_SESSION_SECRET to at least 32 random characters.");
  return value;
}
async function key() { return crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
export async function signCreatorId(id: string) {
  return `${id}.${hex(new Uint8Array(await crypto.subtle.sign("HMAC", await key(), encoder.encode(id))))}`;
}
export async function verifyCreatorId(value?: string) {
  if (!value) return null;
  const [id, signature, extra] = value.split(".");
  if (extra || !/^[a-f0-9-]{36}$/.test(id || "") || !/^[a-f0-9]{64}$/.test(signature || "")) return null;
  const bytes = Uint8Array.from(signature.match(/../g)!, b => parseInt(b, 16));
  return await crypto.subtle.verify("HMAC", await key(), bytes, encoder.encode(id)) ? id : null;
}
export async function creatorCookie(id: string) { return `pollrr_creator=${await signCreatorId(id)}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`; }
