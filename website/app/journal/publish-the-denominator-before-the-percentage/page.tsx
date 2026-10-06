import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Publish the denominator before the percentage — Pollrr",
  description:
    "A creator field note on reporting response counts, distribution context, limitations, and visible follow-through before promoting a poll percentage.",
  alternates: { canonical: "/journal/publish-the-denominator-before-the-percentage" },
  openGraph: {
    title: "Publish the denominator before the percentage.",
    description: "A percentage is easier to trust when the audience can see who had a chance to answer and how many people did.",
    type: "article",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Publish the denominator before the percentage.",
    description: "Give a small audience result enough context to be useful without making it look larger than it is.",
    images: [],
  },
};

export default function PublishTheDenominatorBeforeThePercentage() {
  return (
    <main className="article-shell">
      <header className="article-nav">
        <Link className="wordmark" href="/">pollrr<span>.</span></Link>
        <Link href="/journal">Journal</Link>
        <Link href="/creator-pilot">Creator pilot</Link>
      </header>
      <article className="article-body">
        <div className="article-heading">
          <p>CREATOR FIELD NOTE · SEPTEMBER 28, 2026</p>
          <h1>Publish the denominator <em>before the percentage.</em></h1>
          <p className="dek">
            Give a small audience result enough context to guide a decision without making it look larger,
            broader, or more representative than it is.
          </p>
        </div>

        <p className="lead">“Seventy percent chose option A” sounds complete. It is not.</p>
        <p>
          Seven of ten people and 7,000 of 10,000 people can both produce 70%. The percentage does not say
          how the question reached people, who could participate, when it was open, or whether anyone saw the
          result before answering.
        </p>

        <h2>Start the result with the count</h2>
        <p>
          For a creator poll, the clearest first line is often the simplest: “Fourteen people answered; ten
          chose the teardown and four chose the interview.” The percentage can follow when it helps comparison,
          but the count keeps the scale visible.
        </p>
        <p>
          Small does not mean useless. A small response can help choose a newsletter topic, prioritize a live
          question, or reveal that the options need work. It becomes misleading only when the report implies a
          certainty or population it did not measure.
        </p>

        <h2>Name the distribution route</h2>
        <p>
          Say where the link appeared: one newsletter issue, a public video description, a member community,
          or several channels. That route helps readers understand who was likely to encounter the question.
        </p>
        <p>
          An open link is usually a convenience sample of the people who chose to respond. It is not a random
          sample of every subscriber, resident, customer, or voter. Writing that limitation down makes the
          result more credible, not less.
        </p>

        <h2>Keep the crowd hidden until the answer is committed</h2>
        <p>
          Pollrr asks a person to answer before seeing the current result. That reduces one obvious source of
          social influence, but it does not eliminate self-selection, repeat exposure, uneven distribution, or
          other sampling limits. Report the control precisely and keep the larger limitations visible.
        </p>

        <blockquote>A percentage is a summary. The denominator and route are the receipt.</blockquote>

        <h2>Publish what the result changed</h2>
        <p>
          The best follow-through is not a chart. It is the promised action: publish the selected tutorial,
          invite the winning guest, revise the schedule, or explain why the response was too limited to decide.
          Bring that outcome back through the same route that recruited participants.
        </p>
        <p>
          This closes the loop from creator decision to neutral question, distribution, human vote, disclosed
          result, visible action, and the next question. People can see whether answering mattered.
        </p>

        <h2>Use one compact disclosure</h2>
        <p>A creator can report a useful small poll in four lines:</p>
        <p>
          <strong>14 people answered between September 28 and 30.</strong><br />
          The link appeared in one newsletter issue and one public post.<br />
          Respondents answered before seeing the current result.<br />
          This open-link convenience sample represents participants, not the entire audience.
        </p>
        <p>
          Add the option counts and what the answer changed. That is enough context for a reader to inspect the
          result without burying a small creative decision under research language it cannot support.
        </p>

        <div className="article-cta">
          <span>POLLRR CREATOR PILOT</span>
          <h2>Bring one decision your audience can actually influence.</h2>
          <p>
            The pilot helps turn it into a neutral question, a disclosed distribution route, a human-only
            result, a visible follow-through, and the next question if the loop earns one.
          </p>
          <Link href="/creator-pilot">Build the first question →</Link>
        </div>
      </article>
      <footer className="article-footer"><Link className="wordmark inverse" href="/">pollrr<span>.</span></Link><p>Public opinion, in motion.</p></footer>
    </main>
  );
}
