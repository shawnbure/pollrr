import Link from "next/link";
import VerifyClient from "./VerifyClient";

export default async function VerifyPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  return (
    <main className="legal-shell trust-shell">
      <Link className="brand" href="/"><span className="brand-mark">p</span><span>pollrr</span></Link>
      <article>
        <p className="eyebrow">PUBLIC VERIFICATION</p>
        <h1>Trust the proof, not a promise.</h1>
        <p>Pollrr publishes an ECDSA-signed snapshot and a Merkle commitment to every private human vote event. Anyone can verify that the aggregate is tied to the committed dataset without seeing choices, devices, or row-level records.</p>
        <VerifyClient questionId={questionId} />
        <h2>What this proves</h2>
        <p>The published aggregate, integrity counts, methodology version, timestamp, and vote-event commitment have not been altered since signing.</p>
        <h2>What remains private</h2>
        <p>Individual choices, device identifiers, referral details, free-text explanations, and monetizable row-level data never appear in the public manifest.</p>
        <a className="text-link" href={`/api/ledger/${questionId}`}>Download the audit manifest →</a>
      </article>
    </main>
  );
}
