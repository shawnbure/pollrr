import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI can explain a poll. It should not pretend to be a voter. — Pollrr",
  description:
    "Why Pollrr keeps measured human responses separate from AI summaries, modeled estimates, and synthetic personas.",
  alternates: { canonical: "/journal/ai-is-not-a-voter" },
  openGraph: {
    title: "AI can explain a poll. It should not pretend to be a voter.",
    description: "Human responses are measurements. AI output is analysis.",
    type: "article",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "AI can explain a poll. It should not pretend to be a voter.",
    description: "Human responses are measurements. AI output is analysis.",
    images: [],
  },
};

export default function AiIsNotAVoter() {
  return (
    <main className="article-shell">
      <header className="article-nav">
        <Link className="wordmark" href="/">
          pollrr<span>.</span>
        </Link>
        <Link href="/journal">Journal</Link>
        <a href="https://app.pollrr.com">Open Pollrr ↗</a>
      </header>
      <article className="article-body">
        <div className="article-heading">
          <p>HUMAN-FIRST AI · AUGUST 20, 2026</p>
          <h1>
            AI can explain a poll. <em>It should not pretend to be a voter.</em>
          </h1>
          <p className="dek">
            A model can organize evidence. It cannot retroactively become a person who answered the question.
          </p>
        </div>

        <p className="lead">
          Artificial intelligence can draft questions, detect loaded language, cluster written explanations,
          and summarize a complicated result. Those are valuable capabilities. They do not make an AI model a
          respondent.
        </p>
        <p>
          Pollrr uses a strict separation: human responses are measured records; AI output is an analytical
          layer. That boundary sounds simple. It becomes important the moment a polished summary starts to look
          more complete than the people and method behind it.
        </p>

        <h2>Completeness is not measurement</h2>
        <p>
          A model can generate an answer for every demographic segment, every hypothetical persona, and every
          variation of a question. That output may help someone explore a scenario. It is still not a human
          sample.
        </p>
        <p>
          If no person was recruited, shown the question, and recorded under a disclosed method, the result is an
          estimate. Calling it a vote erases the difference between observing people and predicting them.
        </p>
        <blockquote>AI may help us understand the room. It does not get a seat in the headcount.</blockquote>

        <h2>Every summary needs its denominator</h2>
        <p>
          Suppose 120 people answer a poll and 30 choose to explain their answer. An AI summary of those written
          explanations can be useful, but it must not imply that all 120 respondents expressed the themes found
          in the smaller group.
        </p>
        <p>A trustworthy summary should make four things clear:</p>
        <ul>
          <li>the verified number of human responses;</li>
          <li>the number of people who supplied written explanations;</li>
          <li>the recruitment and sampling limitations;</li>
          <li>and the role AI played in organizing or describing the material.</li>
        </ul>
        <p>
          “Eight of 30 explanations mentioned cost” is evidence. “People care about cost” may be a reasonable
          interpretation, but it is a broader claim and should be presented with the appropriate caution.
        </p>

        <h2>The right jobs for AI</h2>
        <p>Pollrr is designed around four practical uses:</p>
        <ol>
          <li>Help a creator ask a clearer, more neutral question.</li>
          <li>Suggest useful follow-ups based on gaps in the existing human record.</li>
          <li>Organize qualitative explanations without losing their denominator.</li>
          <li>Turn verified aggregate results into concise, platform-ready communication.</li>
        </ol>
        <p>
          Each job assists a person who is asking, answering, or interpreting a question. None of them expands
          the human sample.
        </p>

        <h2>Keep estimates in their own lane</h2>
        <p>
          Modeled estimates can be useful when they are clearly labeled. If Pollrr publishes them, they should
          appear separately with the model version, inputs, assumptions, and timestamp. The measured human total
          should remain unchanged and visible beside the estimate—not quietly blended into it.
        </p>
        <p>
          The same rule applies to synthetic personas and generated audience simulations. They can help someone
          form a hypothesis worth testing. They cannot supply the test result.
        </p>

        <h2>Human-first does not mean AI-free</h2>
        <p>
          The most credible use of AI is not to manufacture a larger crowd. It is to help people ask better
          questions, examine real responses, and communicate what the evidence does and does not support.
        </p>
        <p>
          Public opinion already has a trust problem. The answer is not to hide synthetic certainty inside a
          precise-looking percentage. It is to preserve the line between the people who answered and the tools
          that helped explain them.
        </p>

        <div className="article-cta">
          <span>HUMANS ANSWER. AI ASSISTS.</span>
          <h2>Ask your audience a question without inventing the audience.</h2>
          <a href="https://app.pollrr.com/admin">Create a free poll ↗</a>
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
