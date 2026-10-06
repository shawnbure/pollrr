import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pollrr Journal — Better questions need better receipts",
  description: "Notes on trustworthy online polling, human-first AI, transparent methodology, and what audiences really think.",
  alternates: { canonical: "/journal" },
};

export default function Journal() {
  return <main className="journal-shell">
    <header className="article-nav"><Link className="wordmark" href="/">pollrr<span>.</span></Link><Link href="/creator-pilot">Creator pilot</Link><a href="https://app.pollrr.com">Open Pollrr ↗</a></header>
    <section className="journal-hero"><p className="eyebrow"><span/>THE POLLRR JOURNAL</p><h1>Better questions need<br/><em>better receipts.</em></h1><p>Ideas about public opinion, creator-owned audiences, transparent methodology, and AI that interprets people without impersonating them.</p></section>
    <section className="journal-grid">
      <Link className="journal-feature" href="/journal/close-the-poll-before-the-decision"><span>CREATOR FIELD NOTE · 7 MIN READ</span><h2>Close the poll before the decision is due.</h2><p>Set the closing rule from the real decision, then return with the count, limitations, and what changed.</p><b>Read the field note →</b></Link>
      <Link className="journal-feature" href="/journal/publish-the-denominator-before-the-percentage"><span>CREATOR FIELD NOTE · 7 MIN READ</span><h2>Publish the denominator before the percentage.</h2><p>Report the response count, distribution route, limitations, and visible follow-through before promoting a poll percentage.</p><b>Read the field note →</b></Link>
      <Link className="journal-feature" href="/journal/a-poll-result-needs-a-return-path"><span>CREATOR FIELD NOTE · 7 MIN READ</span><h2>A poll result needs a return path.</h2><p>Plan the distribution route, disclosed result, visible follow-up, and next question as one repeatable creator loop.</p><b>Read the field note →</b></Link>
      <Link className="journal-feature" href="/journal/write-down-what-the-answer-will-change"><span>CREATOR FIELD NOTE · 7 MIN READ</span><h2>Before you ask your audience, write down what the answer will change.</h2><p>Start with one editorial decision, write a neutral question, disclose the respondent pool, and close the loop in public.</p><b>Read the field note →</b></Link>
      <Link className="journal-feature" href="/journal/a-question-worth-sharing"><span>CREATOR PLAYBOOK · 8 MIN READ</span><h2>A good audience question is a distribution asset—not just a poll.</h2><p>A practical creator loop: ask one answerable question, let people commit before seeing the crowd, publish the evidence, and use the result to earn the next conversation.</p><b>Read the playbook →</b></Link>
      <Link className="journal-feature" href="/journal/better-receipts"><span>PUBLIC OPINION · 8 MIN READ</span><h2>The internet has enough opinions. It needs better receipts.</h2><p>A percentage is easy to share and hard to trust. Here is what an online result should disclose—and why Pollrr starts with answer-before-results participation.</p><b>Read the essay →</b></Link>
      <Link className="journal-feature" href="/journal/ai-is-not-a-voter"><span>HUMAN-FIRST AI · 7 MIN READ</span><h2>AI can explain a poll. It should not pretend to be a voter.</h2><p>Why measured human responses must remain separate from AI summaries, modeled estimates, and synthetic personas.</p><b>Read the essay →</b></Link>
    </section>
    <footer className="article-footer"><Link className="wordmark inverse" href="/">pollrr<span>.</span></Link><p>Public opinion, in motion.</p></footer>
  </main>;
}
