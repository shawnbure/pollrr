"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Choice = "a" | "b";
type Stage = "loading" | "vote" | "sending" | "queued" | "result" | "empty";
type Poll = {
  id: string;
  prompt: string;
  optionA: string;
  optionB: string;
  topic: string;
  region: string;
};
type Totals = { total: number; optionA: number; optionB: number };
type PendingVote = { questionId: string; choice: Choice; voterKey: string; rippleId: string };

const PENDING_KEY = "pollrr:pending-vote";
const VOTER_KEY = "pollrr:voter-key";

function deviceKey() {
  let key = localStorage.getItem(VOTER_KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, key);
  }
  return key;
}

export default function Home() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [totals, setTotals] = useState<Totals>({ total: 0, optionA: 0, optionB: 0 });
  const [choice, setChoice] = useState<Choice | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [online, setOnline] = useState(true);

  const loadPoll = useCallback(async () => {
    try {
      const response = await fetch("/api/poll", { cache: "no-store" });
      if (!response.ok) throw new Error("No live poll");
      const data = await response.json() as { poll: Poll; totals: Totals };
      setPoll(data.poll);
      setTotals(data.totals);
      setStage("vote");
    } catch {
      setStage("empty");
    }
  }, []);

  const sendVote = useCallback(async (pending: PendingVote) => {
    const response = await fetch("/api/poll", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(pending),
    });
    const data = await response.json() as {
      error?: string;
      totals?: Totals;
      choice?: Choice;
    };
    if (!response.ok || !data.totals) throw new Error(data.error || "Could not count vote");
    localStorage.removeItem(PENDING_KEY);
    setChoice(data.choice ?? pending.choice);
    setTotals(data.totals);
    setStage("result");
    setMessage("");
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const timer = window.setTimeout(loadPoll, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [loadPoll]);

  useEffect(() => {
    if (!online) return;
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as PendingVote;
      const timer = window.setTimeout(() => {
        setChoice(pending.choice);
        setStage("sending");
        sendVote(pending).catch(() => {
          setStage("queued");
          setMessage("Still trying. Tap to retry.");
        });
      }, 0);
      return () => window.clearTimeout(timer);
    } catch {
      localStorage.removeItem(PENDING_KEY);
    }
  }, [online, sendVote]);

  const vote = async (value: Choice) => {
    if (!poll || !["vote", "queued"].includes(stage)) return;
    const pending: PendingVote = {
      questionId: poll.id,
      choice: value,
      voterKey: deviceKey(),
      rippleId: new URLSearchParams(location.search).get("r") || crypto.randomUUID(),
    };
    setChoice(value);
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    if (!navigator.onLine) {
      setStage("queued");
      setMessage("Saved on this device. We’ll count it when you reconnect.");
      return;
    }
    setStage("sending");
    try {
      await sendVote(pending);
    } catch (error) {
      setStage("queued");
      setMessage(error instanceof Error ? error.message : "Saved. Tap to retry.");
    }
  };

  const retry = () => {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return setStage("vote");
    setStage("sending");
    sendVote(JSON.parse(raw) as PendingVote).catch(() => {
      setStage("queued");
      setMessage("Still saved. Check your connection and retry.");
    });
  };

  const share = async () => {
    if (!poll) return;
    const url = new URL(location.href);
    url.searchParams.set("r", crypto.randomUUID());
    const data = {
      title: "What does your circle think?",
      text: `${poll.prompt} Vote before you see the split.`,
      url: url.toString(),
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Closing the native share sheet is a successful exit.
    }
  };

  const chosenCount = choice === "a" ? totals.optionA : totals.optionB;
  const agreement = totals.total ? Math.round((chosenCount / totals.total) * 100) : 100;

  return (
    <main className="public-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="public-nav">
        <Link className="brand" href="/" aria-label="Pollrr home">
          <span className="brand-mark">p</span><span>pollrr</span>
        </Link>
        <span className="trust-note"><i /> Anonymous by design</span>
      </header>

      {!online && <div className="offline-bar">Offline · answers stay safely on this device</div>}

      <section className={`vote-card ${stage === "result" ? "result-card" : ""}`}>
        {stage === "loading" && <div className="loading-card"><span className="spinner" />Loading today&apos;s poll…</div>}

        {stage === "empty" && (
          <div className="empty-poll">
            <p className="eyebrow">POLLRR</p>
            <h1>The next question is coming.</h1>
            <p>Check back soon. Good questions are worth getting right.</p>
            <button onClick={loadPoll}>Check again</button>
          </div>
        )}

        {poll && stage !== "loading" && stage !== "empty" && stage !== "result" && (
          <>
            <div className="card-topline">
              <span className="topic-pill">{poll.region} · {poll.topic}</span>
              <span className="time-note">3 sec</span>
            </div>
            <div className="question-wrap">
              <p className="eyebrow">TODAY&apos;S POLL</p>
              <h1>{poll.prompt}</h1>
              <p className="blind-note">Vote to reveal the live split.</p>
            </div>
            <div className="vote-actions" aria-label="Answer choices">
              <button onClick={() => vote("a")} disabled={stage === "sending"}>
                <span className="choice-key">A</span><span><b>{poll.optionA}</b><small>Tap once to count</small></span><span className="arrow">→</span>
              </button>
              <button onClick={() => vote("b")} disabled={stage === "sending"}>
                <span className="choice-key dark">B</span><span><b>{poll.optionB}</b><small>Tap once to count</small></span><span className="arrow">→</span>
              </button>
            </div>
            {stage === "sending" && <div className="sending-state"><span className="spinner" />Counting your answer…</div>}
            {stage === "queued" && <button className="retry-state" onClick={retry}>{message}</button>}
            <div className="privacy-line">No sign-up <span>·</span> No name attached <span>·</span> One vote per device</div>
          </>
        )}

        {poll && stage === "result" && (
          <>
            <div className="result-head">
              <div><p className="eyebrow">YOU&apos;RE COUNTED</p><h1>{totals.total === 1 ? "You started the conversation." : `${agreement}% chose the same answer.`}</h1></div>
            </div>
            <div className="result-hero">
              <span className="result-number">{agreement}<sup>%</sup></span>
              <span className="result-label">agree with you</span>
              <div className="split-bar"><span style={{ width: `${agreement}%` }} /></div>
              <div className="split-labels"><span>Your answer: {choice === "a" ? poll.optionA : poll.optionB}</span><span>{totals.total.toLocaleString()} {totals.total === 1 ? "vote" : "votes"}</span></div>
            </div>
            <div className="surprise">
              <span className="spark">✦</span>
              <div><b>{totals.total < 10 ? "The split gets better with every answer." : "This result updates live."}</b><small>Share it to see what your circle really thinks.</small></div>
            </div>
            <button className="share-primary" onClick={share}><span>{copied ? "Link copied" : "Ask your circle"}</span><span className="share-icon">↗</span></button>
            <p className="share-sub">They vote before seeing the result.</p>
          </>
        )}
      </section>

      <footer className="public-footer">
        <span>Neutral wording · Aggregate results</span>
        <nav><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/admin">Admin</a></nav>
      </footer>
    </main>
  );
}
