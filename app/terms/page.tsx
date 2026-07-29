import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="legal-shell">
      <Link className="brand" href="/"><span className="brand-mark">p</span><span>pollrr</span></Link>
      <article>
        <p className="eyebrow">TERMS</p>
        <h1>Simple rules for an honest signal.</h1>
        <h2>Use Pollrr fairly</h2>
        <p>Do not automate votes, evade one-vote controls, disrupt the service, submit unlawful material, or misrepresent Pollrr results as scientific election forecasts.</p>
        <h2>Results and availability</h2>
        <p>Pollrr results reflect voluntary responses from people who received a link. They are not representative polling unless a report explicitly describes a validated sampling method. Results may change as more people respond.</p>
        <h2>Questions and content</h2>
        <p>Poll questions are informational and are not endorsements. Pollrr may pause or remove questions that are misleading, unsafe, unlawful, or inconsistent with neutral civic participation.</p>
        <h2>No election administration</h2>
        <p>Pollrr does not register voters, collect official ballots, determine eligibility, or administer any public election.</p>
        <p className="legal-updated">Effective July 28, 2026</p>
      </article>
    </main>
  );
}
