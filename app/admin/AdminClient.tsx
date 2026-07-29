"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Question = { id: string; prompt: string; status: string; votes: number };
type Live = Question & { topic: string; region: string; option_a: number; option_b: number };
type Overview = {
  live: Live | null;
  totalResponses: number;
  questions: Question[];
  integrity?: { total: number; trusted: number; flagged: number };
  ledger?: { snapshot_hash: string; human_total: number; created_at: number } | null;
};

export default function AdminClient({ displayName }: { displayName: string }) {
  const [active, setActive] = useState("Overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [modal, setModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/overview", { cache: "no-store" });
    if (response.ok) setOverview(await response.json() as Overview);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggleLive = async () => {
    if (!overview?.live) return;
    setBusy(true);
    const status = overview.live.status === "live" ? "paused" : "live";
    await fetch("/api/admin/questions", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: overview.live.id, status }),
    });
    await load();
    setBusy(false);
  };

  const createQuestion = async () => {
    setBusy(true);
    const response = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, optionA: "Yes", optionB: "No", topic: "General", region: "United States" }),
    });
    const data = await response.json() as { error?: string };
    setBusy(false);
    if (!response.ok) return setNotice(data.error || "Could not save question.");
    setModal(false); setPrompt(""); setNotice("Draft saved."); await load();
  };

  const live = overview?.live;
  const total = overview?.totalResponses ?? 0;

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <Link className="brand admin-brand" href="/"><span className="brand-mark">p</span><span>pollrr</span></Link>
        <nav>
          {["Overview", "Questions", "Polls", "Audience", "Reports"].map((item, i) => (
            <button className={active === item ? "active" : ""} onClick={() => setActive(item)} key={item}>
              <span className="nav-icon">{["⌂", "◫", "◎", "◉", "▥"][i]}</span>{item}
              {item === "Questions" && <em>{overview?.questions.length ?? 0}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button><span className="nav-icon">⚙</span>Settings</button>
          <div className="admin-user"><span>{displayName.slice(0, 2).toUpperCase()}</span><div><b>{displayName}</b><small>Workspace owner</small></div></div>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div><p>POLLRR CONTROL</p><h1>{active}</h1></div>
          <div className="header-actions">
            <span className={`system-health ${live?.status === "paused" ? "paused" : ""}`}><i />{live?.status === "paused" ? "Collection paused" : "Cloudflare healthy"}</span>
            <button className="preview-btn" onClick={() => window.open("/", "_blank")}>Preview voter view</button>
            <button className="new-btn" onClick={() => setModal(true)}>＋ New question</button>
          </div>
        </header>

        {notice && <div className="admin-notice">{notice}<button onClick={() => setNotice("")}>×</button></div>}

        {active !== "Overview" ? (
          <div className="section-placeholder">
            <span>{active === "Polls" ? "◎" : active === "Audience" ? "◉" : "▥"}</span>
            <h2>{active}</h2><p>{active === "Questions" ? "Create, review, and publish from the pipeline below." : "Ready for the next product pass."}</p>
            {active === "Questions" && <div className="compact-pipeline">{overview?.questions.map(q => <div key={q.id}><span className={`status ${q.status}`}>{q.status}</span><b>{q.prompt}</b><em>{Number(q.votes).toLocaleString()} votes</em></div>)}</div>}
            <button onClick={() => setActive("Overview")}>Return to overview</button>
          </div>
        ) : (
          <>
            <div className="live-banner">
              <div className="live-pulse"><i /><span>{live?.status === "paused" ? "PAUSED" : live ? "LIVE NOW" : "NO LIVE POLL"}</span></div>
              <div className="live-question"><small>{live ? `${live.region} · ${live.topic}` : "Publish a question to begin"}</small><b>{live?.prompt ?? "No question is collecting votes."}</b></div>
              <div className="live-stat"><small>VOTES</small><b>{Number(live?.votes ?? 0).toLocaleString()}</b><em>Real-time D1</em></div>
              <div className="live-stat"><small>STATUS</small><b>{live?.status ?? "Idle"}</b><em>Edge hosted</em></div>
              <button disabled={!live || busy} className={live?.status === "paused" ? "resume" : ""} onClick={toggleLive}>{live?.status === "paused" ? "Resume" : "Pause"}</button>
            </div>

            <div className="metric-grid">
              <article><div className="metric-top"><span>Total responses</span><i className="green">Live</i></div><b>{total.toLocaleString()}</b><small>All polls</small><div className="mini-bars">{[30,44,39,58,51,64,61,75,70,86,82,96].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></article>
              <article><div className="metric-top"><span>Current split</span><i>Live</i></div><b>{live?.votes ? Math.round((Number(live.option_a || 0) / Number(live.votes)) * 100) : 0}%</b><small>Option A</small><div className="donut"><span>{live?.votes ?? 0}</span></div></article>
              <article><div className="metric-top"><span>Infrastructure</span><i className="green">Healthy</i></div><b>100%</b><small>Workers · D1 · R2</small><div className="sparkline">⌁⌁⌁</div></article>
              <article><div className="metric-top"><span>Signal integrity</span><i>Auditable</i></div><b>{overview?.integrity?.total ? Math.round(Number(overview.integrity.trusted) / Number(overview.integrity.total) * 100) : 100}<span>% trusted</span></b><small>{Number(overview?.integrity?.flagged ?? 0)} flagged · never silently deleted</small><div className="quality-row"><span/><span/><span/><span/><span/></div></article>
            </div>

            <article className="panel ledger-panel">
              <div className="panel-head"><div><h2>Public results ledger</h2><p>Human-only aggregate commitment</p></div><a href={live ? `/verify/${live.id}` : "/methodology"} target="_blank">Open verifier →</a></div>
              <code>{overview?.ledger?.snapshot_hash ?? "Waiting for first signed snapshot"}</code>
              <small>Raw rows stay private. Public proofs expose hashes, methodology, counts, and signatures only.</small>
            </article>

            <article className="panel questions-panel">
              <div className="panel-head"><div><h2>Question pipeline</h2><p>Cloudflare D1 source of truth</p></div><button onClick={() => setActive("Questions")}>Manage questions →</button></div>
              <div className="question-table">
                {overview?.questions.map(q => (
                  <div className="question-row" key={q.id}><span className={`status ${q.status}`}>{q.status}</span><b>{q.prompt}</b><span>{Number(q.votes).toLocaleString()} votes</span><span>Pollrr</span><em>Ready</em><button>•••</button></div>
                ))}
              </div>
            </article>
          </>
        )}
      </section>

      {modal && (
        <div className="modal-backdrop" onMouseDown={() => setModal(false)}>
          <div className="question-modal" onMouseDown={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(false)}>×</button>
            <span className="modal-step">NEW QUESTION · DRAFT</span>
            <h2>What do you want to ask?</h2><p>Keep it neutral, specific, and answerable in one tap.</p>
            <textarea autoFocus value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={180} aria-label="Question text" />
            <div className="modal-meta"><span>{prompt.length} / 180</span><span>Target: under 8 seconds</span></div>
            <div className="modal-actions"><button onClick={() => setModal(false)}>Cancel</button><button disabled={busy} className="continue" onClick={createQuestion}>{busy ? "Saving…" : "Save draft →"}</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
