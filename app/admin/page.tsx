"use client";

import { useState } from "react";

const questions = [
  { state: "Live", title: "Should Arizona allow more homes if it lowers prices but increases neighborhood density?", votes: "18,420", trend: "+2,184/hr", health: "Strong" },
  { state: "Scheduled", title: "Should groundwater pumping limits apply equally to farms and new subdivisions?", votes: "Tomorrow, 7:00 AM", trend: "6 channels", health: "Ready" },
  { state: "Draft", title: "Would you pay $4 more each month to add shade structures at public bus stops?", votes: "Not scheduled", trend: "Needs review", health: "Draft" },
];

export default function AdminPage() {
  const [active, setActive] = useState("Overview");
  const [paused, setPaused] = useState(false);
  const [modal, setModal] = useState(false);

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <a className="brand admin-brand" href="/"><span className="brand-mark">r</span><span>ripple</span></a>
        <nav>
          {["Overview", "Questions", "Ripples", "Audience", "Reports"].map((item, i) => (
            <button className={active === item ? "active" : ""} onClick={() => setActive(item)} key={item}>
              <span className="nav-icon">{["⌂", "◫", "◎", "◉", "▥"][i]}</span>{item}
              {item === "Questions" && <em>3</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button><span className="nav-icon">⚙</span>Settings</button>
          <div className="admin-user"><span>SB</span><div><b>Shawn Bure</b><small>Workspace owner</small></div><i>•••</i></div>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div><p>RIPPLE CONTROL</p><h1>{active}</h1></div>
          <div className="header-actions">
            <span className={`system-health ${paused ? "paused" : ""}`}><i />{paused ? "Collection paused" : "All systems healthy"}</span>
            <button className="preview-btn" onClick={() => window.open("/", "_blank")}>Preview voter view</button>
            <button className="new-btn" onClick={() => setModal(true)}>＋ New question</button>
          </div>
        </header>

        {active !== "Overview" ? (
          <div className="section-placeholder">
            <span>{active === "Ripples" ? "◎" : active === "Audience" ? "◉" : "▥"}</span>
            <h2>{active}</h2>
            <p>This workspace is ready for the next product pass.</p>
            <button onClick={() => setActive("Overview")}>Return to overview</button>
          </div>
        ) : (
          <>
            <div className="live-banner">
              <div className="live-pulse"><i /><span>LIVE NOW</span></div>
              <div className="live-question">
                <small>Arizona · Housing · Published 2h 14m ago</small>
                <b>Should Arizona allow more homes if it lowers prices but increases neighborhood density?</b>
              </div>
              <div className="live-stat"><small>VOTES</small><b>18,420</b><em>+2,184/hr</em></div>
              <div className="live-stat"><small>COMPLETION</small><b>94.8%</b><em>Excellent</em></div>
              <button className={paused ? "resume" : ""} onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</button>
            </div>

            <div className="metric-grid">
              <article><div className="metric-top"><span>Total responses</span><i className="green">↗ 18.2%</i></div><b>184,291</b><small>Last 30 days</small><div className="mini-bars">{[32,47,39,62,52,78,68,91,76,100,88,96].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></article>
              <article><div className="metric-top"><span>Share rate</span><i className="green">↗ 4.1%</i></div><b>31.4%</b><small>Visitors who start a ripple</small><div className="donut"><span>31%</span></div></article>
              <article><div className="metric-top"><span>Viral coefficient</span><i className="green">↗ 0.18</i></div><b>1.37×</b><small>New voters per participant</small><div className="sparkline">⌁⌁⌁</div></article>
              <article><div className="metric-top"><span>Quality score</span><i>Stable</i></div><b>96<span>/100</span></b><small>Bot, speed & bias checks</small><div className="quality-row"><span /><span /><span /><span /><span /></div></article>
            </div>

            <div className="admin-content-grid">
              <article className="panel response-panel">
                <div className="panel-head"><div><h2>Response velocity</h2><p>Votes per 15 minutes · today</p></div><div className="legend"><i />Organic <i />Partners</div></div>
                <div className="chart">
                  <div className="chart-y"><span>2k</span><span>1.5k</span><span>1k</span><span>500</span><span>0</span></div>
                  <div className="chart-area">
                    <div className="grid-lines"><i/><i/><i/><i/></div>
                    <div className="area-shape" />
                    <div className="line-shape" />
                    <div className="chart-x"><span>8 AM</span><span>11 AM</span><span>2 PM</span><span>5 PM</span><span>Now</span></div>
                  </div>
                </div>
              </article>
              <article className="panel sources-panel">
                <div className="panel-head"><div><h2>Where voters came from</h2><p>Current question</p></div><button>View all</button></div>
                {[
                  ["Direct messages", "6,448", "35%", "coral"],
                  ["Instagram", "4,789", "26%", "purple"],
                  ["Local publishers", "3,684", "20%", "lime"],
                  ["X / Threads", "2,394", "13%", "yellow"],
                  ["Other", "1,105", "6%", "gray"],
                ].map(([name,count,pct,color]) => (
                  <div className="source-row" key={name}><span className={`source-dot ${color}`} /><b>{name}</b><span>{count}</span><em>{pct}</em></div>
                ))}
              </article>
            </div>

            <article className="panel questions-panel">
              <div className="panel-head"><div><h2>Question pipeline</h2><p>Everything publishing next</p></div><button onClick={() => setActive("Questions")}>Manage questions →</button></div>
              <div className="question-table">
                {questions.map((q) => (
                  <div className="question-row" key={q.title}>
                    <span className={`status ${q.state.toLowerCase()}`}>{q.state}</span>
                    <b>{q.title}</b><span>{q.votes}</span><span>{q.trend}</span><em>{q.health}</em><button>•••</button>
                  </div>
                ))}
              </div>
            </article>
          </>
        )}
      </section>

      {modal && (
        <div className="modal-backdrop" onMouseDown={() => setModal(false)}>
          <div className="question-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(false)}>×</button>
            <span className="modal-step">NEW QUESTION · STEP 1 OF 3</span>
            <h2>What do you want to ask?</h2>
            <p>Write naturally. Ripple checks neutrality, clarity, and reading time before publishing.</p>
            <textarea autoFocus defaultValue="Should Arizona " aria-label="Question text" />
            <div className="modal-meta"><span>0 / 180</span><span>Target: under 8 seconds</span></div>
            <div className="modal-actions"><button onClick={() => setModal(false)}>Save draft</button><button className="continue">Check question →</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
