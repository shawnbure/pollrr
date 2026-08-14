const appUrl = "https://app.pollrr.com";

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function SignalMark({ className = "" }: { className?: string }) {
  return (
    <span className={`signal-mark ${className}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export default function Home() {
  return (
    <main>
      <header className="nav-wrap">
        <a className="wordmark" href="#top" aria-label="Pollrr home">
          pollrr<span>.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#why-pollrr">Why Pollrr</a>
          <a href="#for-organizations">For organizations</a>
          <a href="/journal">Journal</a>
        </nav>
        <a className="nav-cta" href={appUrl}>
          Cast a vote <Arrow />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span />
            Public opinion, without the noise
          </p>
          <h1>
            What people think.
            <br />
            <em>Right now.</em>
          </h1>
          <p className="hero-lede">
            Pollrr turns one honest answer into a clearer picture of what people
            really believe—before the comments, the pile-ons, and the spin.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href={appUrl}>
              Vote on today&apos;s question <Arrow />
            </a>
            <a className="text-link" href="#how-it-works">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="trust-line">
            <span>●</span> No account required <i /> One tap to vote <i /> Results
            revealed after you answer
          </p>
        </div>

        <div className="hero-visual" aria-label="Illustration of a live Pollrr result">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="vote-dot dot-a">✓</span>
          <span className="vote-dot dot-b">✓</span>
          <span className="vote-dot dot-c coral">✓</span>
          <span className="vote-dot dot-d coral">✓</span>
          <article className="poll-card">
            <div className="card-top">
              <span>LIVE QUESTION</span>
              <span className="live"><i /> 8,291 answers</span>
            </div>
            <h2>Should cities make room for more housing?</h2>
            <div className="results">
              <div className="result-number">64%</div>
              <div className="result-label">
                <strong>YES</strong>
                <span>Most people agree</span>
              </div>
            </div>
            <div className="split">
              <span style={{ width: "64%" }} />
            </div>
            <div className="split-labels">
              <span>64% YES</span>
              <span>36% NO</span>
            </div>
            <p className="card-foot">
              Your answer stays yours. The signal belongs to everyone.
            </p>
          </article>
          <div className="annotation">
            <SignalMark />
            <span>
              <strong>Signal, not spectacle.</strong>
              Results appear only after you vote.
            </span>
          </div>
        </div>
      </section>

      <section className="marquee" aria-label="Pollrr principles">
        <div>
          VOTE FIRST <b>✦</b> SEE THE SPLIT <b>✦</b> SHARE THE SIGNAL <b>✦</b>{" "}
          VOTE FIRST <b>✦</b> SEE THE SPLIT <b>✦</b> SHARE THE SIGNAL <b>✦</b>
        </div>
      </section>

      <section className="steps section" id="how-it-works">
        <div className="section-intro">
          <p className="eyebrow"><span /> A better way to ask</p>
          <h2>One question.<br /><em>Zero theater.</em></h2>
          <p>
            Pollrr is intentionally simple. No feeds to perform for. No comments
            to fight through. Just a real question and an honest answer.
          </p>
        </div>
        <div className="step-list">
          <article>
            <span className="step-num">01</span>
            <div className="step-icon question-icon">?</div>
            <h3>Read one clear question</h3>
            <p>Timely, plain-language questions about the choices shaping daily life.</p>
          </article>
          <article>
            <span className="step-num">02</span>
            <div className="step-icon tap-icon"><span>YES</span><i /></div>
            <h3>Answer before influence</h3>
            <p>Your choice is locked before you see how anyone else responded.</p>
          </article>
          <article>
            <span className="step-num">03</span>
            <div className="step-icon bars-icon"><i /><i /></div>
            <h3>See the real split</h3>
            <p>Get the live result instantly, then share the question—not your answer.</p>
          </article>
        </div>
      </section>

      <section className="manifesto" id="why-pollrr">
        <div className="manifesto-top">
          <p className="eyebrow light"><span /> Built for honesty</p>
          <p className="manifesto-kicker">Most platforms reward the loudest voice.</p>
        </div>
        <h2>Pollrr measures the room.</h2>
        <div className="manifesto-grid">
          <div className="big-stat">
            <strong>1</strong>
            <span>question at a time</span>
          </div>
          <div className="principles">
            <article>
              <span>01</span>
              <div><h3>Independent answers</h3><p>Results stay hidden until the vote is cast, reducing social pressure and bandwagon effects.</p></div>
            </article>
            <article>
              <span>02</span>
              <div><h3>Privacy by design</h3><p>Participation is account-free. Pollrr is built to measure opinions, not expose individuals.</p></div>
            </article>
            <article>
              <span>03</span>
              <div><h3>Neutral by default</h3><p>No party badges, rage-bait comments, or winner-take-all framing—just the question and the signal.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section className="organizations section" id="for-organizations">
        <div className="org-art" aria-hidden="true">
          <div className="signal-rings">
            <span /><span /><span /><span />
            <b>8,291<small>responses</small></b>
          </div>
          <div className="mini-card mini-one"><i /> Phoenix metro <b>67%</b></div>
          <div className="mini-card mini-two"><i /> Ages 25–44 <b>61%</b></div>
          <div className="mini-card mini-three"><i /> Shared link <b>72%</b></div>
        </div>
        <div className="org-copy">
          <p className="eyebrow"><span /> For researchers & organizations</p>
          <h2>Turn responses into <em>responsible insight.</em></h2>
          <p>
            Pollrr helps organizations understand how opinions move across
            communities—through aggregate, privacy-conscious reporting designed
            for clearer decisions.
          </p>
          <ul>
            <li><span>✓</span> Real-time aggregate results</li>
            <li><span>✓</span> Source and geographic trend analysis</li>
            <li><span>✓</span> Transparent question methodology</li>
            <li><span>✓</span> Privacy-conscious data practices</li>
          </ul>
          <a className="button button-dark" href="mailto:hello@pollrr.com?subject=Pollrr%20for%20organizations">
            Talk to Pollrr <Arrow />
          </a>
        </div>
      </section>

      <section className="closing">
        <SignalMark className="large" />
        <p className="eyebrow centered"><span /> The room is waiting</p>
        <h2>What do you think?</h2>
        <p>One question. One tap. See where you stand.</p>
        <a className="button button-coral" href={appUrl}>
          Cast your vote <Arrow />
        </a>
        <span className="closing-note">No sign-up. No public profile. Just your answer.</span>
      </section>

      <footer>
        <div className="footer-brand">
          <a className="wordmark inverse" href="#top">pollrr<span>.</span></a>
          <p>Public opinion, in motion.</p>
        </div>
        <div className="footer-links">
          <div><span>EXPLORE</span><a href="#how-it-works">How it works</a><a href="#why-pollrr">Why Pollrr</a><a href="#for-organizations">For organizations</a><a href="/journal">Journal</a></div>
          <div><span>LEGAL</span><a href={`${appUrl}/privacy`}>Privacy</a><a href={`${appUrl}/terms`}>Terms</a></div>
          <div><span>CONNECT</span><a href="mailto:hello@pollrr.com">hello@pollrr.com</a><a href={appUrl}>Open the app ↗</a></div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Pollrr. All rights reserved.</span>
          <span>Built for better questions.</span>
        </div>
      </footer>
    </main>
  );
}
