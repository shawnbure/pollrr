const COOKIE_NAME = "pollrr_creator";

function safeReturnTo(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/admin?start=create";
  try {
    const url = new URL(value, "https://app.pollrr.com");
    if (url.origin !== "https://app.pollrr.com") return "/admin?start=create";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin?start=create";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const destination = new URL(safeReturnTo(requestUrl.searchParams.get("return_to")), requestUrl.origin);
  return new Response(null, {
    status: 303,
    headers: {
      location: destination.toString(),
      "set-cookie": `${COOKIE_NAME}=${crypto.randomUUID()}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}
