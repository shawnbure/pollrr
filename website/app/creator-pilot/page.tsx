import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pollrr creator pilot — One question, one audience, one useful decision",
  description:
    "A practical Pollrr pilot for U.S. newsletter writers, podcasters, local publishers, and civic creators with a real audience question.",
  alternates: { canonical: "/creator-pilot" },
};

const appUrl =
  "https://app.pollrr.com/admin?utm_source=pollrr_site&utm_medium=owned_page&utm_campaign=creator_pilot_sep2026";

export default function CreatorPilot() {
  return (
    <main>
      <header className="article-nav">
        <Link className="wordmark" href="/">
          pollrr<span>.</span>
        </Link>
        <Link href="/journal/a-question-worth-sharing">Creator playbook</Link>
        <a href={appUrl}>Open Pollrr ↗</a>
      </header>

      <article className="article-body">
        <div className="article-heading">
          <p>CREATOR PILOT · SEPTEMBER 2026</p>
          <h1>
            Bring one real audience question. <em>Leave with a decision.</em>
          </h1>
          <p className="dek">
            Pollrr is looking for five U.S.-based newsletter writers, podcasters, local publishers,
            and civic creators who want to test a complete question-to-conversation loop.
          </p>
        </div>

        <p className="lead">
          This is not a promise of representative public opinion. It is a focused test of whether one
          plainly written question can help a creator learn something useful from the people who choose
          to answer it.
        </p>

        <h2>A good pilot starts with a real editorial decision</h2>
        <p>
          Bring a choice you expect to make this month: which story to report next, which guest to book,
          which neighborhood issue needs more attention, or which follow-up would be most useful to your
          audience. Pollrr works best when the answer can change what you do next.
        </p>

        <h2>The pilot loop</h2>
        <ol>
          <li>Write one neutral, answerable question with two clear choices.</li>
          <li>Publish it in Pollrr and create a distinct distribution link for your channel.</li>
          <li>Invite your audience to answer before seeing the result.</li>
          <li>Report who was invited, how the link was distributed, and how many people responded.</li>
          <li>Use the result to make one decision or ask one better follow-up question.</li>
        </ol>

        <blockquote>
          The pilot succeeds when a creator asks, real people answer, and the result earns a useful next
          question—not when a page collects views.
        </blockquote>

        <h2>What Pollrr will not claim</h2>
        <ul>
          <li>An open-link convenience sample represents the United States or a whole community.</li>
          <li>A published question proves creator activation before a real person responds.</li>
          <li>An AI summary is a vote, a respondent, or evidence of what people believe.</li>
          <li>A first question proves repeat use before the creator publishes again.</li>
        </ul>

        <h2>Who fits</h2>
        <p>
          The strongest fit is a U.S.-based creator with an existing audience, a genuine question, and a
          willingness to publish the respondent count and sampling limits. Audience size is not the test;
          honest distribution and a useful follow-up are.
        </p>

        <section className="article-cta">
          <span>START THE LOOP</span>
          <h2>Create the question you can act on.</h2>
          <a href={appUrl}>Open the creator workspace →</a>
          <p>
            Or email <a href="mailto:hello@pollrr.com?subject=Pollrr%20creator%20pilot">hello@pollrr.com</a>{" "}
            with your channel, audience, and the decision the question should inform.
          </p>
        </section>
      </article>

      <footer className="article-footer">
        <Link className="wordmark inverse" href="/">
          pollrr<span>.</span>
        </Link>
        <p>Public opinion, in motion.</p>
      </footer>
    </main>
  );
}
