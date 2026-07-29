import PrivacyClient from "./PrivacyClient";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <Link className="brand" href="/"><span className="brand-mark">p</span><span>pollrr</span></Link>
      <article>
        <p className="eyebrow">PRIVACY</p>
        <h1>Your opinion is not your identity.</h1>
        <p>Pollrr collects the answer you choose, the poll identifier, an anonymous device identifier, referral identifiers used to measure sharing, and coarse infrastructure data needed to prevent abuse.</p>
        <h2>What we do not collect</h2>
        <p>Voting requires no name, email address, account, precise location, political-party registration, or contact list. We do not attach a real-world identity to a vote.</p>
        <h2>Optional future-poll notifications</h2>
        <p>After voting, you may separately choose to provide an email address or mobile number for future poll invitations. This is never required to vote. Contact information is encrypted in a separate contact vault that stores no vote identifier, answer, question identifier, or device identifier. It is not sold, and consent can be withdrawn.</p>
        <h2>Customer audience lists</h2>
        <p>Organizations may upload contact lists only after documenting a lawful permission to contact those people. Pollrr encrypts contact values, deduplicates them using one-way hashes, records the stated consent basis, and keeps them separate from individual vote records. Pending or suppressed contacts cannot be used for outreach.</p>
        <h2>How data is used</h2>
        <p>Answers are aggregated to show opinion trends and may be included in anonymized research or commercial reports. We do not sell identifiable voter profiles.</p>
        <h2>Retention and control</h2>
        <p>Anonymous votes remain in aggregate datasets. Device and pending-vote identifiers are stored in your browser and can be cleared below. Abuse-prevention identifiers are cryptographically hashed and expire automatically.</p>
        <PrivacyClient />
        <p className="legal-updated">Effective July 29, 2026 · This product is not an official election or voter-registration service.</p>
      </article>
    </main>
  );
}
