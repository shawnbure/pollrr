import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ questionId: string }> },
) {
  const { questionId } = await context.params;
  const question = await env.DB.prepare(
    "SELECT id, prompt, option_a, option_b FROM questions WHERE id = ?",
  ).bind(questionId).first();
  if (!question) return Response.json({ error: "Unknown question." }, { status: 404 });
  const snapshots = await env.DB.prepare(
    `SELECT methodology_version, human_total, human_a, human_b, trusted_total,
            flagged_total, merkle_root, previous_snapshot_hash, snapshot_hash,
            signature, public_key, created_at
     FROM aggregate_snapshots WHERE question_id = ? ORDER BY created_at`,
  ).bind(questionId).all();
  const leaves = await env.DB.prepare(
    `SELECT payload_hash FROM vote_events
     WHERE question_id = ? ORDER BY created_at, id`,
  ).bind(questionId).all<{ payload_hash: string }>();
  return Response.json({
    question,
    proofType: "SHA-256 Merkle commitment with a hash-chained, ECDSA P-256 signed snapshot log",
    privacy: "Leaf hashes commit to private vote events without publishing choices, devices, explanations, or row-level records.",
    humanOnly: true,
    modelEstimates: null,
    snapshots: snapshots.results,
    auditManifest: {
      leafCount: leaves.results.length,
      leafHashes: leaves.results.map((leaf) => leaf.payload_hash),
      reproduction: "Sort leaf hashes lexicographically; hash adjacent pairs as SHA-256(left + ':' + right), duplicating the final odd leaf, until one root remains.",
    },
  });
}
