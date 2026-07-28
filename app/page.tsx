"use client";

import { useEffect, useState } from "react";

type Choice = "yes" | "no" | null;
type Stage = "vote" | "sending" | "result";

export default function Home() {
  const [choice, setChoice] = useState<Choice>(null);
  const [stage, setStage] = useState<Stage>("vote");
  const [copied, setCopied] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const vote = (value: Exclude<Choice, null>) => {
    if (stage !== "vote") return;
    setChoice(value);
    setStage("sending");
    window.setTimeout(() => setStage("result"), 480);
  };

  const share = async () => {
    const data = {
      title: "What does your circle think?",
      text: "My circle is split on Arizona housing. Vote before you see our result.",
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Closing the native share sheet is not an error for the voter.
    }
  };

  return (
    <main className="public-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="public-nav">
        <a className="brand" href="/" aria-label="Ripple home">
          <span className="brand-mark">r</span>
          <span>ripple</span>
        </a>
        <span className="trust-note"><i /> Anonymous pulse</span>
      </header>

      {!online && (
        <div className="offline-bar" role="status">
          You&apos;re offline. Your answer is safe and will send when you reconnect.
        </div>
      )}

      <section className={`vote-card ${stage === "result" ? "result-card" : ""}`}>
        {stage !== "result" ? (
          <>
            <div className="card-topline">
              <span className="topic-pill">Arizona · Housing</span>
              <span className="time-note">3 sec</span>
            </div>
            <div className="question-wrap">
              <p className="eyebrow">TODAY&apos;S PULSE</p>
              <h1>
                Should Arizona allow more homes if it lowers prices but increases
                neighborhood density?
              </h1>
              <p className="blind-note">Vote to reveal what everyone else thinks.</p>
            </div>

            <div className="vote-actions" aria-label="Answer choices">
              <button onClick={() => vote("yes")} disabled={stage === "sending"}>
                <span className="choice-key">A</span>
                <span><b>Yes</b><small>Build more homes</small></span>
                <span className="arrow">→</span>
              </button>
              <button onClick={() => vote("no")} disabled={stage === "sending"}>
                <span className="choice-key dark">B</span>
                <span><b>No</b><small>Protect neighborhoods</small></span>
                <span className="arrow">→</span>
              </button>
            </div>

            {stage === "sending" && (
              <div className="sending-state" aria-live="polite">
                <span className="spinner" /> Counting your answer…
              </div>
            )}
            <div className="privacy-line">
              No sign-up <span>·</span> No name attached <span>·</span> Change anytime
            </div>
          </>
        ) : (
          <>
            <div className="result-head">
              <div>
                <p className="eyebrow">YOUR RIPPLE</p>
                <h1>Your circle leans toward building.</h1>
              </div>
              <button className="close-result" onClick={() => { setStage("vote"); setChoice(null); }} aria-label="Change answer">↺</button>
            </div>

            <div className="result-hero">
              <span className="result-number">{choice === "yes" ? "64" : "36"}<sup>%</sup></span>
              <span className="result-label">agree with you</span>
              <div className="split-bar">
                <span style={{ width: choice === "yes" ? "64%" : "36%" }} />
              </div>
              <div className="split-labels"><span>Your answer</span><span>328 votes</span></div>
            </div>

            <div className="surprise">
              <span className="spark">✦</span>
              <div><b>Your circle is 16 points more pro-housing</b><small>than Arizona voters overall.</small></div>
            </div>

            <div className="ripple-preview" aria-label="Your ripple reached 328 people">
              <span className="dot d1" /><span className="dot d2" /><span className="dot d3" />
              <span className="dot d4" /><span className="dot d5" /><span className="dot d6" />
              <div><b>328</b><small>people in your ripple</small></div>
            </div>

            <button className="share-primary" onClick={share}>
              <span>{copied ? "Link copied" : "Challenge your circle"}</span>
              <span className="share-icon">↗</span>
            </button>
            <p className="share-sub">They must vote before seeing your result.</p>
          </>
        )}
      </section>

      <footer className="public-footer">
        <span>Question reviewed for neutral wording</span>
        <a href="/admin">Admin demo</a>
      </footer>
    </main>
  );
}
