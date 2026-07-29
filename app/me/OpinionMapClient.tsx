"use client";

import { useEffect, useState } from "react";

type Entry = { questionId: string; choice: "a" | "b"; answeredAt: number };

export default function OpinionMapClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setEnabled(localStorage.getItem("pollrr:private-map") === "yes");
      setEntries(JSON.parse(localStorage.getItem("pollrr:opinion-history") || "[]"));
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const clear = () => {
    localStorage.removeItem("pollrr:opinion-history");
    localStorage.setItem("pollrr:private-map", "no");
    setEntries([]); setEnabled(false);
  };
  const download = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), answers: entries }, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "pollrr-opinion-map.json"; link.click(); URL.revokeObjectURL(link.href);
  };
  return <div className="opinion-map">
    <div className="map-status"><span>{enabled ? "Private map enabled" : "Private map off"}</span><b>{entries.length} remembered answers</b></div>
    {entries.map(entry => <div className="map-entry" key={entry.questionId}><b>{entry.questionId}</b><span>Answer {entry.choice.toUpperCase()}</span><small>{new Date(entry.answeredAt).toLocaleDateString()}</small></div>)}
    {!entries.length && <p>Your opted-in answers will appear here. They stay only in this browser.</p>}
    <div className="map-actions"><button onClick={download} disabled={!entries.length}>Export JSON</button><button onClick={clear}>Delete private map</button></div>
  </div>;
}
