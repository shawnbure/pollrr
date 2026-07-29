"use client";

import { useState } from "react";

const encoder = new TextEncoder();
const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, "0")).join("");
const hash = async (value: string) => hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
const bytes = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));

export default function VerifyClient({ questionId }: { questionId: string }) {
  const [status, setStatus] = useState("Ready to independently check the public proof.");

  const verify = async () => {
    setStatus("Recomputing…");
    const data = await fetch(`/api/ledger/${questionId}`, { cache: "no-store" }).then(response => response.json());
    const snapshot = data.snapshots.at(-1);
    if (!snapshot) return setStatus("No signed snapshot exists yet.");
    let layer: string[] = [...data.auditManifest.leafHashes].sort();
    if (!layer.length) layer = [await hash("pollrr:empty")];
    while (layer.length > 1) {
      const next: string[] = [];
      for (let index = 0; index < layer.length; index += 2) {
        next.push(await hash(`${layer[index]}:${layer[index + 1] ?? layer[index]}`));
      }
      layer = next;
    }
    const canonical = JSON.stringify({
      questionId,
      methodologyVersion: snapshot.methodology_version,
      humanTotal: snapshot.human_total,
      humanA: snapshot.human_a,
      humanB: snapshot.human_b,
      trustedTotal: snapshot.trusted_total,
      flaggedTotal: snapshot.flagged_total,
      merkleRoot: snapshot.merkle_root,
      previousSnapshotHash: snapshot.previous_snapshot_hash,
      createdAt: snapshot.created_at,
    });
    const snapshotHash = await hash(canonical);
    const publicKey = await crypto.subtle.importKey(
      "spki", bytes(snapshot.public_key), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"],
    );
    const signatureValid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" }, publicKey, bytes(snapshot.signature), encoder.encode(snapshotHash),
    );
    setStatus(layer[0] === snapshot.merkle_root && snapshotHash === snapshot.snapshot_hash && signatureValid
      ? `Verified: ${snapshot.human_total} human votes are committed by the signed ledger.`
      : "Verification failed. This snapshot should not be trusted.");
  };

  return <div className="verify-action"><button onClick={verify}>Verify latest snapshot</button><p>{status}</p></div>;
}
