import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";

export const dynamic = "force-dynamic";

async function authorize() {
  return Boolean(await getChatGPTUser());
}

export async function POST(request: Request) {
  if (!(await authorize())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    prompt?: string;
    optionA?: string;
    optionB?: string;
    topic?: string;
    region?: string;
  } | null;

  const prompt = body?.prompt?.trim() ?? "";
  if (prompt.length < 12 || prompt.length > 180) {
    return Response.json({ error: "Question must be 12–180 characters." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO questions
      (id, prompt, option_a, option_b, topic, region, status, scheduled_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', NULL, ?)`,
  ).bind(
    id,
    prompt,
    body?.optionA?.trim().slice(0, 60) || "Yes",
    body?.optionB?.trim().slice(0, 60) || "No",
    body?.topic?.trim().slice(0, 50) || "General",
    body?.region?.trim().slice(0, 50) || "United States",
    Date.now(),
  ).run();

  return Response.json({ id, status: "draft" }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await authorize())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as {
    id?: string;
    status?: "live" | "paused" | "closed";
  } | null;
  if (!body?.id || !body.status || !["live", "paused", "closed"].includes(body.status)) {
    return Response.json({ error: "Invalid update." }, { status: 400 });
  }

  if (body.status === "live") {
    await env.DB.batch([
      env.DB.prepare("UPDATE questions SET status = 'paused' WHERE status = 'live'"),
      env.DB.prepare("UPDATE questions SET status = 'live' WHERE id = ?").bind(body.id),
    ]);
  } else {
    await env.DB.prepare("UPDATE questions SET status = ? WHERE id = ?")
      .bind(body.status, body.id).run();
  }
  return Response.json({ id: body.id, status: body.status });
}
