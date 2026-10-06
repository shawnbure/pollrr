import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Close the poll before the decision is due — Pollrr",
  description: "A creator field note on giving an audience question a decision deadline, a closing rule, and a visible return path.",
  alternates: { canonical: "/journal/close-the-poll-before-the-decision" },
  openGraph: { title: "Close the poll before the decision is due.", description: "A useful audience question needs a deadline that leaves time to act on the answer.", type: "article", images: [] },
  twitter: { card: "summary", title: "Close the poll before the decision is due.", description: "Set the closing rule from the real decision, then return with the count and what changed.", images: [] },
};

export default function CloseThePollBeforeTheDecision() {
  return (
    <main className="article-shell">
      <header className="article-nav">
        <Link className="wordmark" href="/">pollrr<span>.</span></Link>
        <Link href="/journal">Journal</Link>
        <Link href="/creator-pilot">Creator pilot</Link>
      </header>
      <article className="article-body">
        <div className="article-heading">
          <p>CREATOR FIELD NOTE · OCTOBER 1, 2026</p>
          <h1>Close the poll <em>before the decision is due.</em></h1>
          <p className="dek">A question becomes useful when the audience knows when answers stop, what decision follows, and where the creator will return with the result.</p>
        </div>

        <p className="lead">“Vote whenever” is not a decision process.</p>
        <p>An open-ended poll may keep collecting reactions, but it gives the creator no clear moment to read the answer and gives participants no expectation about when their input can matter. If the result is meant to influence a newsletter, stream, event, product choice, or community action, the real decision already has a deadline. The question should inherit it.</p>

        <h2>Start with the action date</h2>
        <p>Name the moment when the creator must act: the outline is locked Tuesday, the guest invitation goes out Friday, the live session happens next week, or the next issue is scheduled on the first business day of the month. Work backward from that point.</p>
        <p>Leave enough time to inspect the count, check whether the response is usable, and publish the promised follow-through. A poll that closes one minute before the decision encourages the appearance of audience participation without creating a practical way to use it.</p>

        <h2>Publish the closing rule with the question</h2>
        <p>A closing rule can be a date and time, a fixed interval, or a disclosed response cap. Use the rule that matches the decision, and do not quietly move it after seeing the early result. If circumstances require an extension, publish the change before collecting more answers and preserve the original timing.</p>
        <p>Also state the time zone. “Closes Thursday” means different things to a national audience. A precise close such as “Thursday at 5 p.m. America/Phoenix” lets participants understand the boundary without guessing where the creator lives.</p>

        <blockquote>The decision sets the deadline. The deadline gives the question a real job.</blockquote>

        <h2>Do not turn urgency into false representation</h2>
        <p>A short poll can inform a small creative choice. It does not become representative merely because the decision is urgent. Report how the link was distributed, how many people answered, the option counts, and the limitations of an open-link convenience sample.</p>
        <p>Pollrr asks a person to answer before seeing the current result. That reduces one visible source of social influence. It does not remove self-selection, uneven reach, or the possibility that only a small part of the intended audience encountered the link.</p>

        <h2>Plan the return before distribution</h2>
        <p>Decide where participants will see the outcome: the next newsletter, the same public thread, a video description, or a community update. The return should include the closing time, response count, option counts, distribution route, what the result changed, and what happens next.</p>
        <p>If the response was too small or too uneven to guide the decision, say so and explain how the creator decided instead. That is better evidence than forcing a thin result to carry more authority than it earned.</p>

        <h2>Use the result to earn the next question</h2>
        <p>A repeatable creator loop is not a stream of unrelated polls. The first question helps make a visible choice. The creator returns with the receipt. Then the next question can refine the work: which example needs a deeper explanation, which follow-up deserves a live session, or which tradeoff still blocks the audience from acting.</p>
        <p>The loop is decision → question → disclosed distribution → human vote → visible action → next question. A closing rule connects the vote to the action instead of leaving the result stranded on a chart.</p>

        <div className="article-cta">
          <span>POLLRR CREATOR PILOT</span>
          <h2>Bring one audience decision with a real deadline.</h2>
          <p>The pilot helps shape a neutral question, publish the closing rule and distribution boundary, keep the human result distinct, and return with what the answer changed.</p>
          <Link href="/creator-pilot">Build the first question →</Link>
        </div>
      </article>
      <footer className="article-footer"><Link className="wordmark inverse" href="/">pollrr<span>.</span></Link><p>Public opinion, in motion.</p></footer>
    </main>
  );
}
