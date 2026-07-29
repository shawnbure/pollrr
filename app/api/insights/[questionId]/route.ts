import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ questionId: string }> },
) {
  const { questionId } = await context.params;
  const reasons = await env.DB.prepare(
    `SELECT qr.id, qr.label,
      SUM(CASE WHEN e.choice='a' THEN 1 ELSE 0 END) side_a,
      SUM(CASE WHEN e.choice='b' THEN 1 ELSE 0 END) side_b,
      COUNT(e.id) total
     FROM question_reasons qr
     LEFT JOIN explanations e ON e.reason_id = qr.id
     WHERE qr.question_id = ?
     GROUP BY qr.id, qr.label ORDER BY total DESC, qr.sort_order`,
  ).bind(questionId).all<{ id: string; label: string; side_a: number; side_b: number; total: number }>();
  const explanationTotal = reasons.results.reduce((sum, reason) => sum + Number(reason.total), 0);
  const commonGround = reasons.results
    .filter((reason) => Number(reason.side_a) > 0 && Number(reason.side_b) > 0)
    .map((reason) => ({
      reason: reason.label,
      supportA: Number(reason.side_a),
      supportB: Number(reason.side_b),
      explanationRespondents: Number(reason.total),
    }));
  const snapshots = await env.DB.prepare(
    `SELECT human_total, human_a, human_b, trusted_total, flagged_total, created_at
     FROM aggregate_snapshots WHERE question_id = ? ORDER BY created_at`,
  ).bind(questionId).all();
  return Response.json({
    denominator: {
      humanVoters: snapshots.results.at(-1)?.human_total ?? 0,
      explanationRespondents: explanationTotal,
      note: "Reason shares use explanation respondents, not all voters.",
    },
    reasons: reasons.results.map((reason) => ({
      id: reason.id,
      label: reason.label,
      sideA: Number(reason.side_a),
      sideB: Number(reason.side_b),
      explanationRespondents: Number(reason.total),
    })),
    commonGround,
    longitudinalHumanResults: snapshots.results,
    modelEstimates: null,
  });
}
