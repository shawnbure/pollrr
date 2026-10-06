import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "A poll result needs a return path — Pollrr",
  description:
    "A creator field note on planning distribution, disclosed results, follow-up content, and the next audience question as one repeatable loop.",
  alternates: { canonical: "/journal/a-poll-result-needs-a-return-path" },
  openGraph: {
    title: "A poll result needs a return path.",
    description: "The useful creator loop begins after the first vote arrives.",
    type: "article",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "A poll result needs a return path.",
    description: "The useful creator loop begins after the first vote arrives.",
    images: [],
  },
};

export default function APollResultNeedsAReturnPath() {
  return (
    <main className="article-shell">
      <header className="article-nav">
        <Link className="wordmark" href="/">
          pollrr<span>.</span>
        </Link>
        <Link href="/journal">Journal</Link>
        <Link href="/creator-pilot">Creator pilot</Link>
      </header>
      <article className="article-body">
        <div className="article-heading">
          <p>CREATOR FIELD NOTE · SEPTEMBER 23, 2026</p>
          <h1>
            A poll result needs <em>a return path.</em>
          </h1>
          <p className="dek">
            Plan how the question reaches people, how the result comes back, what the creator will publish
            next, and why anyone should answer again.
          </p>
        </div>

        <p className="lead">
          Publishing a question is not the creator loop. It is the opening move.
        </p>
        <p>
          A poll becomes useful when a creator can carry the audience from the original decision to the
          question, from the question to an honest result, and from that result to the next piece of work.
          The return path should be designed before distribution begins.
        </p>

        <h2>Choose one audience route you can describe</h2>
        <p>
          Start with a specific route: one newsletter issue, one video description, one community thread, or
          one event follow-up. A link posted everywhere may create more traffic, but it also makes the
          respondent pool harder to explain and the follow-up harder to deliver.
        </p>
        <p>
          Write down where the link will appear, how long the question will remain open, and who is likely to
          see it. This is not a claim of representativeness. It is the context a reader needs to understand
          what the result can and cannot say.
        </p>

        <h2>Give the distribution link one promise</h2>
        <p>
          A strong invitation tells people why the question exists and what will happen after they answer.
          “Vote now” asks for attention. “Help choose which teardown I publish Friday; I will share the count
          and the winning example in the next issue” creates a visible contract.
        </p>
        <p>
          Keep the promise proportional to the question. Do not imply that an open convenience sample speaks
          for an entire city, profession, customer base, or electorate. It speaks for the people who chose to
          participate through the stated route.
        </p>

        <h2>Bring the result back to the same people</h2>
        <p>
          The result should not disappear into a dashboard. Return it through the route that recruited the
          participants. Include the response count, dates, distribution context, and any material limitation.
          If the response was too small or uneven to guide the decision, say so plainly.
        </p>
        <p>
          Pollrr asks people to answer before seeing the current result and keeps measured human responses
          separate from AI-generated interpretation. Those choices make the receipt clearer, but the creator
          still owns the explanation and the follow-through.
        </p>

        <blockquote>A result earns a second question when people can see what the first answer changed.</blockquote>

        <h2>Publish the action, not only the percentage</h2>
        <p>
          If the audience selected the tutorial, publish it and cite the disclosed result. If two choices were
          close, explain how the creator handled the split. If the question exposed a better follow-up, invite
          that next question while the context is still fresh.
        </p>
        <p>
          This turns one poll into a compact editorial sequence: decision, neutral question, distribution,
          human vote, disclosed result, action, and return question. Each step gives the audience a reason to
          trust the next one.
        </p>

        <h2>Measure whether the loop repeats</h2>
        <p>
          Useful evidence includes a person opening the distribution link, a completed human vote, a reader
          returning for the result, the creator publishing the promised action, and the creator asking again.
          Page views alone cannot establish that sequence.
        </p>
        <p>
          The most important early signal is not a large total. It is whether one real creator can complete
          the loop with one real audience and decide to repeat it.
        </p>

        <div className="article-cta">
          <span>POLLRR CREATOR PILOT</span>
          <h2>Bring one decision and one audience route.</h2>
          <p>
            The pilot helps turn them into a neutral question, a disclosed distribution link, a human-only
            result, a visible follow-up, and the next question if the format earns one.
          </p>
          <Link href="/creator-pilot">Build the return path →</Link>
        </div>
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
