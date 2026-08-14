import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pollrr Journal — Better questions need better receipts",
  description: "Notes on trustworthy online polling, human-first AI, transparent methodology, and what audiences really think.",
  alternates: { canonical: "/journal" },
};

export default function Journal() {
  return <main className="journal-shell">
    <header className="article-nav"><Link className="wordmark" href="/">pollrr<span>.</span></Link><a href="https://app.pollrr.com">Open Pollrr ↗</a></header>
    <section className="journal-hero"><p className="eyebrow"><span/>THE POLLRR JOURNAL</p><h1>Better questions need<br/><em>better receipts.</em></h1><p>Ideas about public opinion, creator-owned audiences, transparent methodology, and AI that interprets people without impersonating them.</p></section>
    <section className="journal-grid">
      <Link className="journal-feature" href="/journal/better-receipts"><span>PUBLIC OPINION · 8 MIN READ</span><h2>The internet has enough opinions. It needs better receipts.</h2><p>A percentage is easy to share and hard to trust. Here is what an online result should disclose—and why Pollrr starts with answer-before-results participation.</p><b>Read the essay →</b></Link>
      <article><span>COMING NEXT</span><h2>AI can explain a poll. It should not pretend to be a voter.</h2><p>Why Pollrr keeps measured human responses strictly separate from modeled estimates.</p></article>
    </section>
    <footer className="article-footer"><Link className="wordmark inverse" href="/">pollrr<span>.</span></Link><p>Public opinion, in motion.</p></footer>
  </main>;
}
