import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Before you ask your audience, write down what the answer will change. — Pollrr",
  description:
    "A creator field note on turning a real editorial decision into a neutral question, an honest result, and a useful follow-up.",
  alternates: { canonical: "/journal/write-down-what-the-answer-will-change" },
  openGraph: {
    title: "Before you ask your audience, write down what the answer will change.",
    description: "A question earns attention when the answer has a job.",
    type: "article",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Before you ask your audience, write down what the answer will change.",
    description: "A question earns attention when the answer has a job.",
    images: [],
  },
};

export default function WriteDownWhatTheAnswerWillChange() {
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
          <p>CREATOR FIELD NOTE · SEPTEMBER 21, 2026</p>
          <h1>
            Before you ask your audience, write down <em>what the answer will change.</em>
          </h1>
          <p className="dek">
            A question earns attention when the creator can explain what decision, follow-up, or reporting
            choice the result will inform.
          </p>
        </div>

        <p className="lead">
          Many audience polls begin with a topic. Strong audience questions begin with a decision.
        </p>
        <p>
          “What should I ask this week?” is a difficult prompt because almost anything can become a poll.
          “Which part of next week&apos;s issue should the audience help choose?” gives the question a job.
          It creates a reason to answer and a clear obligation for the creator after the result arrives.
        </p>

        <h2>Name the decision before writing the choices</h2>
        <p>
          Write one sentence that begins, “I will use this result to…” It might select the next tutorial,
          prioritize questions for a guest, choose between two reporting angles, or learn which local issue
          deserves a deeper follow-up.
        </p>
        <p>
          This sentence is an internal test, not a promise that a small open poll represents an entire
          population. It prevents decorative engagement: questions that collect reactions but never change
          the creator&apos;s work.
        </p>

        <h2>Turn the decision into one neutral question</h2>
        <p>
          Choices should be plausible, distinct, and written at the same level of specificity. Avoid making
          the preferred answer longer, more vivid, or morally safer than the alternatives. If important
          context cannot fit without steering the response, link the source material and state the scenario
          plainly.
        </p>
        <p>Before publishing, check three things:</p>
        <ul>
          <li>Could a reasonable person choose any listed option?</li>
          <li>Would the wording still feel fair if your preferred choice lost?</li>
          <li>Can you describe what the result means without claiming more than the participants support?</li>
        </ul>

        <h2>Keep the result tied to its audience</h2>
        <p>
          A question distributed to newsletter subscribers describes the people who chose to answer through
          that route. It does not automatically describe all readers, all voters, or the public. Publish the
          response count, the distribution window, and the recruitment route beside the result.
        </p>
        <p>
          Pollrr asks people to answer before seeing the current result and keeps measured human responses
          separate from AI-generated interpretation. Those boundaries improve the receipt. They do not turn
          a convenience sample into a representative survey.
        </p>

        <blockquote>The audience should be able to see both the answer and the limits of the answer.</blockquote>

        <h2>Close the loop in public</h2>
        <p>
          When the poll ends, show what happened next. If the audience chose the tutorial, publish it. If the
          result exposed a split, interview people on both sides. If the response count was too small to guide
          the decision, say that and explain what you will try differently.
        </p>
        <p>
          This follow-through teaches people that participation has a purpose. It also gives the creator a
          natural distribution sequence: ask the question, share the disclosed result, publish the action,
          and invite the next question.
        </p>

        <h2>The useful metric is a return question</h2>
        <p>
          A large one-time vote can be interesting. A creator who returns with a second question has begun a
          format. Track whether respondents open the result, whether the result informs real content, and
          whether the creator asks again. That repeat is stronger evidence than the existence of a poll page.
        </p>

        <div className="article-cta">
          <span>POLLRR CREATOR PILOT</span>
          <h2>Bring one real editorial decision—not a generic topic.</h2>
          <p>
            The pilot helps turn it into a neutral question, a disclosed distribution link, a human-only
            result, and the follow-up that makes the answer useful.
          </p>
          <Link href="/creator-pilot">Apply the decision test →</Link>
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
