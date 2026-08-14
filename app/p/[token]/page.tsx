import Home from "../../page";

export default async function PublicPollPage({ params }: { params: Promise<{ token:string }> }) {
  const { token } = await params;
  return <Home publicToken={token} />;
}

