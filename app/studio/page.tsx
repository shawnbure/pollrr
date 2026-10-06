import { requireChatGPTUser } from "../chatgpt-auth";
import CreatorClient from "../admin/CreatorClient";

export const dynamic = "force-dynamic";

export default async function StudioPage({searchParams}:{searchParams:Promise<{start?:string}>}) {
  const query = await searchParams;
  const returnTo = ["create","claim","plans"].includes(query.start||"") ? `/studio?start=${query.start}` : "/studio";
  const user = await requireChatGPTUser(returnTo);
  return <CreatorClient displayName={user.email} initialView={query.start === "create" ? "create" : query.start === "claim" ? "account" : query.start === "plans" ? "plans" : "home"}/>;
}
