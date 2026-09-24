import { requireChatGPTUser } from "../chatgpt-auth";
import AdminClient from "./AdminClient";
import CreatorClient from "./CreatorClient";
import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export default async function AdminPage({searchParams}:{searchParams:Promise<{mode?:string;start?:string}>}) {
  const user = await requireChatGPTUser("/admin");
  const query=await searchParams;
  const invitation = await env.DB.prepare(
    "SELECT status FROM organization_members WHERE email=? LIMIT 1",
  ).bind(user.email).first<{ status: string }>();
  if (invitation?.status === "invited") {
    await env.DB.prepare("UPDATE organization_members SET status='active' WHERE email=? AND status='invited'")
      .bind(user.email).run();
  }
  const platform=Boolean(await env.DB.prepare("SELECT role FROM platform_admins WHERE email=?").bind(user.email).first());
  if(query.mode==="platform"&&platform)return <AdminClient displayName={user.displayName}/>;
  return <CreatorClient displayName={user.email} initialView={query.start==="create"?"create":"home"}/>;
}
