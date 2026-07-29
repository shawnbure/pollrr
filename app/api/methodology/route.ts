import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET() {
  const methods = await env.DB.prepare(
    `SELECT version, title, sampling_method, integrity_method, explanation_method,
            model_policy, published_at
     FROM methodology_versions ORDER BY published_at DESC`,
  ).all();
  return Response.json({
    labels: {
      rawHumanResult: "What participating humans answered. No weighting or synthetic respondents.",
      integrityFilteredView: "Human answers passing disclosed integrity checks. Flagged votes remain in the raw result.",
      adjustedEstimate: "A separately labeled modeled estimate. Not currently produced.",
      syntheticEstimate: "Prohibited from human totals.",
    },
    versions: methods.results,
  });
}
