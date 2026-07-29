import Link from "next/link";
import OpinionMapClient from "./OpinionMapClient";

export default function OpinionMapPage() {
  return <main className="legal-shell">
    <Link className="brand" href="/"><span className="brand-mark">p</span><span>pollrr</span></Link>
    <article><p className="eyebrow">PRIVATE OPINION MAP</p><h1>Your views, held by you.</h1><p>This optional longitudinal map lives only in this browser. Pollrr cannot sell it, target against it, or recover it after deletion.</p><OpinionMapClient /></article>
  </main>;
}
