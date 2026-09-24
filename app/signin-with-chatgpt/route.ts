export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const destination = new URL("/start", requestUrl.origin);
  destination.searchParams.set("return_to", requestUrl.searchParams.get("return_to") || "/admin?start=create");
  return Response.redirect(destination, 308);
}
