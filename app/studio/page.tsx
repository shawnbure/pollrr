import { requireChatGPTUser } from "../chatgpt-auth";
import CreatorClient from "../admin/CreatorClient";

export const dynamic = "force-dynamic";

export default async function StudioPage({searchParams}:{searchParams:Promise<{start?:string}>}) {
  const query = await searchParams;
  const returnTo = query.start === "create" ? "/studio?start=create" : "/studio";
  const user = await requireChatGPTUser(returnTo);
  return <CreatorClient displayName={user.email} initialView={query.start === "create" ? "create" : "home"}/>;
}
