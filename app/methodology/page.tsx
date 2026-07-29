import { env } from "cloudflare:workers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const method = await env.DB.prepare(
    "SELECT * FROM methodology_versions ORDER BY published_at DESC LIMIT 1",
  ).first<Record<string, string>>();
  return (
    <main className="legal-shell">
      <Link className="brand" href="/"><span className="brand-mark">p</span><span>pollrr</span></Link>
      <article>
        <p className="eyebrow">METHODOLOGY · VERSION {method?.version ?? "—"}</p>
        <h1>Exactly what the numbers mean.</h1>
        <h2>Raw human result</h2><p>{method?.sampling_method}</p>
        <h2>Integrity view</h2><p>{method?.integrity_method}</p>
        <h2>Qualitative explanations</h2><p>{method?.explanation_method}</p>
        <h2>Models and AI</h2><p>{method?.model_policy}</p>
        <div className="method-labels"><b>Human votes</b><span>Observed answers from participating people.</span><b>Adjusted estimate</b><span>Not currently produced. It would always appear separately.</span><b>Synthetic estimate</b><span>Never counted as a respondent or blended into human totals.</span></div>
        <a className="text-link" href="/api/methodology">Machine-readable methodology →</a>
      </article>
    </main>
  );
}
