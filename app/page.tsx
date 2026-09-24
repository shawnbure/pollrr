"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  organizationId?: string;
};
type Totals = { total: number; optionA: number; optionB: number };
type Circle = Totals;
type Reason = { id: string; label: string };
type PendingVote = { questionId: string; choice: Choice; voterKey: string; rippleId: string; parentRippleId?: string | null; responseMs?: number; sourceToken?: string | null };

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

export default function Home({ publicToken }: { publicToken?:string } = {}) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [totals, setTotals] = useState<Totals>({ total: 0, optionA: 0, optionB: 0 });
  const [choice, setChoice] = useState<Choice | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [online, setOnline] = useState(true);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [reasonId, setReasonId] = useState("");
  const [explanation, setExplanation] = useState("");
  const [explanationSaved, setExplanationSaved] = useState(false);
  const [privateMap, setPrivateMap] = useState(false);
  const [commonGround, setCommonGround] = useState<string[]>([]);
  const [contact, setContact] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [answeredRipple, setAnsweredRipple] = useState("");
  const [circle, setCircle] = useState<Circle>({ total: 0, optionA: 0, optionB: 0 });
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const startedAt = useRef(0);

  const loadPoll = useCallback(async () => {
    try {
      const query = new URLSearchParams(location.search);
      if (publicToken) query.set("t", publicToken);
      query.set("voterKey", deviceKey());
      const response = await fetch(`/api/poll?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error("No live poll");
      const data = await response.json() as { poll: Poll; reasons: Reason[]; previousVote?: { choice:Choice;rippleId:string;totals:Totals;circle:Circle } | null };
      setPoll(data.poll);
      setReasons(data.reasons ?? []);
      if (data.previousVote) {
        setChoice(data.previousVote.choice);
        setAnsweredRipple(data.previousVote.rippleId);
        setTotals(data.previousVote.totals);
        setCircle(data.previousVote.circle);
        setStage("result");
        return;
      }
      startedAt.current = Date.now();
      setStage("vote");
    } catch {
      setStage("empty");
    }
  }, [publicToken]);

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
    setAnsweredRipple(pending.rippleId);
    setTotals(data.totals);
    setStage("result");
    if (localStorage.getItem("pollrr:private-map") === "yes") {
      const history = JSON.parse(localStorage.getItem("pollrr:opinion-history") || "[]") as object[];
      if (!history.some((item) => (item as { questionId?: string }).questionId === pending.questionId)) {
        history.push({ questionId: pending.questionId, choice: data.choice ?? pending.choice, answeredAt: Date.now() });
        localStorage.setItem("pollrr:opinion-history", JSON.stringify(history));
      }
    }
    setMessage("");
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const timer = window.setTimeout(() => {
      setPrivateMap(localStorage.getItem("pollrr:private-map") === "yes");
      loadPoll();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [loadPoll]);

  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

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

  useEffect(() => {
    if (stage !== "result" || !poll) return;
    fetch(`/api/insights/${poll.id}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data: { commonGround?: { reason: string }[] } | null) =>
        setCommonGround(data?.commonGround?.map((item) => item.reason) ?? []))
      .catch(() => setCommonGround([]));
  }, [stage, poll]);

  const vote = async (value: Choice) => {
    if (!poll || !["vote", "queued"].includes(stage)) return;
    const pending: PendingVote = {
      questionId: poll.id,
      choice: value,
      voterKey: deviceKey(),
      rippleId: new URLSearchParams(location.search).get("r") || crypto.randomUUID(),
      parentRippleId: new URLSearchParams(location.search).get("parent"),
      responseMs: Date.now() - startedAt.current,
      sourceToken: new URLSearchParams(location.search).get("src"),
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

  const togglePrivateMap = (enabled: boolean) => {
    setPrivateMap(enabled);
    localStorage.setItem("pollrr:private-map", enabled ? "yes" : "no");
  };

  const saveExplanation = async () => {
    if (!poll || (!reasonId && !explanation.trim())) return;
    const response = await fetch("/api/explanations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        questionId: poll.id,
        voterKey: deviceKey(),
        reasonId: reasonId || null,
        explanation: explanation.trim() || null,
        quoteConsent: false,
      }),
    });
    if (response.ok) setExplanationSaved(true);
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
    if (answeredRipple) url.searchParams.set("parent", answeredRipple);
    const data = {
      title: "Think we agree?",
      text: `${poll.prompt} Pick your answer before you see mine.`,
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

  const install = async () => {
    if (!installPrompt) return;
    await (installPrompt as Event & { prompt:()=>Promise<void> }).prompt();
    setInstallPrompt(null);
  };

  const saveContact = async () => {
    if (!poll?.organizationId || !contactConsent) return;
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId: poll.organizationId, contact, consent: contactConsent, interests: poll.topic }),
    });
    const data = await response.json() as { error?: string; maskedContact?: string };
    if (!response.ok) return setContactMessage(data.error || "Could not save your preference.");
    setContactSaved(true);
    setContactMessage(`Saved ${data.maskedContact}. This contact is not linked to your vote.`);
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
        <div className="public-nav-actions"><span className="trust-note"><i /> Anonymous by design</span><Link className="create-poll-cta" href="/admin?start=create"><b>Create a poll</b><small>Free · about 15 seconds</small></Link></div>
      </header>

      {!online && <div className="offline-bar">Offline · answers stay safely on this device</div>}

      <section className={`vote-card ${stage === "result" ? "result-card" : ""}`}>
        {stage === "loading" && <div className="loading-card"><span className="spinner" />Loading today&apos;s poll…</div>}

        {stage === "empty" && (
          <div className="empty-poll">
            <p className="eyebrow">FREE POLL CREATOR</p>
            <h1>Ask one question. Share one link.</h1>
            <p>Create a poll in seconds. No setup, no response limits.</p>
            <Link className="empty-create-cta" href="/admin?start=create">Create a poll →</Link>
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
            <label className="private-map-opt"><input type="checkbox" checked={privateMap} onChange={event => togglePrivateMap(event.target.checked)} /> Remember my answers privately on this device</label>
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
            <div className="circle-score"><span>{circle.total}</span><div><b>{circle.total === 1 ? "friend answered your challenge" : "friends answered your challenge"}</b><small>{circle.total ? "Come back anytime—the count updates automatically." : "Be the first to start a ripple."}</small></div></div>
            <button className="share-primary" onClick={share}><span>{copied ? "Challenge copied" : "Challenge a friend"}</span><span className="share-icon">↗</span></button>
            <p className="share-sub">One tap to share. They answer before seeing your result.</p>
            {installPrompt && <button className="install-pwa" onClick={install}>Add Pollrr to your phone</button>}
            <div className="explain-box">
              <p className="eyebrow">OPTIONAL · WHY?</p>
              {explanationSaved ? <b>Thank you. Your explanation is counted separately from your vote.</b> : <>
                <select value={reasonId} onChange={event => setReasonId(event.target.value)} aria-label="Main reason">
                  <option value="">Choose the reason that mattered most</option>
                  {reasons.map(reason => <option key={reason.id} value={reason.id}>{reason.label}</option>)}
                </select>
                <textarea value={explanation} onChange={event => setExplanation(event.target.value)} maxLength={280} placeholder="Add context in your own words (optional)" />
                <button onClick={saveExplanation} disabled={!reasonId && !explanation.trim()}>Save explanation</button>
              </>}
            </div>
            {commonGround.length > 0 && <div className="common-ground"><span>Common ground</span><b>People on both sides mentioned {commonGround.slice(0, 2).join(" and ")}.</b><small>Based only on optional human explanations.</small></div>}
            {poll.organizationId&&<div className="contact-optin">
              <p className="eyebrow">OPTIONAL · STAY INVOLVED</p>
              <h2>Hear about future polls.</h2>
              <p>Your contact information is stored in a separate vault and is never attached to this vote.</p>
              {contactSaved?<b>{contactMessage}</b>:<>
                <input value={contact} onChange={event=>setContact(event.target.value)} placeholder="Email or mobile number"/>
                <label><input type="checkbox" checked={contactConsent} onChange={event=>setContactConsent(event.target.checked)}/> I want Pollrr to notify me about future polls. My information will not be sold and I can unsubscribe.</label>
                <button disabled={!contactConsent||contact.length<6} onClick={saveContact}>Keep me involved</button>
                {contactMessage&&<small>{contactMessage}</small>}
              </>}
            </div>}
            <div className="trust-links"><a href={`/verify/${poll.id}`}>Verify this result</a><a href="/methodology">Read the methodology</a><a href="/me">My private opinion map</a></div>
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
