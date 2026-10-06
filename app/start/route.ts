import { creatorCookie } from "../lib/creator-cookie";


function safeReturnTo(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/studio?start=create";
  try {
    const url = new URL(value, "https://pollrr.ai");
    if (url.origin !== "https://pollrr.ai") return "/studio?start=create";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/studio?start=create";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const destination = new URL(safeReturnTo(requestUrl.searchParams.get("return_to")), requestUrl.origin);
  return new Response(null, {
    status: 303,
    headers: {
      location: destination.toString(),
      "set-cookie": await creatorCookie(crypto.randomUUID()),
    },
  });
}
