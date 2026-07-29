type LedgerEnv = {
  DB: D1Database;
  LEDGER_PRIVATE_KEY?: string;
  LEDGER_PUBLIC_KEY?: string;
};

const encoder = new TextEncoder();

export async function sha256(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function merkleRoot(leaves: string[]): Promise<string> {
  if (!leaves.length) return sha256("pollrr:empty");
  let layer = [...leaves].sort();
  while (layer.length > 1) {
    const next: string[] = [];
    for (let index = 0; index < layer.length; index += 2) {
      next.push(await sha256(`${layer[index]}:${layer[index + 1] ?? layer[index]}`));
    }
    layer = next;
  }
  return layer[0];
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function toBase64(value: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(value)));
}

export async function publishSnapshot(env: LedgerEnv, questionId: string) {
  if (!env.LEDGER_PRIVATE_KEY || !env.LEDGER_PUBLIC_KEY) return;
  const events = await env.DB.prepare(
    `SELECT payload_hash, integrity_status FROM vote_events
     WHERE question_id = ? ORDER BY created_at, id`,
  ).bind(questionId).all<{ payload_hash: string; integrity_status: string }>();
  const counts = await env.DB.prepare(
    `SELECT COUNT(*) total,
      SUM(CASE WHEN choice='a' THEN 1 ELSE 0 END) a,
      SUM(CASE WHEN choice='b' THEN 1 ELSE 0 END) b
     FROM votes WHERE question_id = ?`,
  ).bind(questionId).first<{ total: number; a: number; b: number }>();
  const previous = await env.DB.prepare(
    `SELECT snapshot_hash FROM aggregate_snapshots
     WHERE question_id = ? ORDER BY created_at DESC LIMIT 1`,
  ).bind(questionId).first<{ snapshot_hash: string }>();
  const root = await merkleRoot(events.results.map((event) => event.payload_hash));
  const createdAt = Date.now();
  const trusted = events.results.filter((event) => event.integrity_status === "trusted").length;
  const total = Number(counts?.total ?? 0);
  const canonical = JSON.stringify({
    questionId,
    methodologyVersion: "1.0.0",
    humanTotal: total,
    humanA: Number(counts?.a ?? 0),
    humanB: Number(counts?.b ?? 0),
    trustedTotal: trusted,
    flaggedTotal: total - trusted,
    merkleRoot: root,
    previousSnapshotHash: previous?.snapshot_hash ?? null,
    createdAt,
  });
  const snapshotHash = await sha256(canonical);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    fromBase64(env.LEDGER_PRIVATE_KEY),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(snapshotHash),
  );
  await env.DB.prepare(
    `INSERT INTO aggregate_snapshots
      (id, question_id, methodology_version, human_total, human_a, human_b,
       trusted_total, flagged_total, merkle_root, previous_snapshot_hash,
       snapshot_hash, signature, public_key, created_at)
     VALUES (?, ?, '1.0.0', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(), questionId, total, Number(counts?.a ?? 0), Number(counts?.b ?? 0),
    trusted, total - trusted, root, previous?.snapshot_hash ?? null, snapshotHash,
    toBase64(signature), env.LEDGER_PUBLIC_KEY, createdAt,
  ).run();
}
