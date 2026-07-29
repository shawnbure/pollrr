import { requireChatGPTUser } from "../chatgpt-auth";
import AdminClient from "./AdminClient";
import { env } from "cloudflare:workers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const invitation = await env.DB.prepare(
    "SELECT status FROM organization_members WHERE email=? LIMIT 1",
  ).bind(user.email).first<{ status: string }>();
  if (invitation?.status === "invited") {
    await env.DB.prepare("UPDATE organization_members SET status='active' WHERE email=? AND status='invited'")
      .bind(user.email).run();
  }
  const access = await env.DB.prepare(
    `SELECT 'member' access FROM organization_members WHERE email=? AND status='active'
     UNION ALL SELECT 'platform' access FROM platform_admins WHERE email=? LIMIT 1`,
  ).bind(user.email, user.email).first();
  if (!access) return <main className="legal-shell"><article><p className="eyebrow">ACCESS PENDING</p><h1>You are signed in, but not part of a Pollrr workspace.</h1><p>Ask your organization owner to invite {user.email}.</p><Link className="text-link" href="/">Return to Pollrr</Link></article></main>;
  return <AdminClient displayName={user.displayName} />;
}
