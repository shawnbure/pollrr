"use client";

import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";
import { useState } from "react";

export default function LoginPage(){
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const login=async()=>{setBusy(true);setError("");try{const optionResponse=await fetch("/api/passkey/options",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode:"authenticate"})});const data=await optionResponse.json() as {challengeId:string;options:Parameters<typeof startAuthentication>[0]["optionsJSON"];error?:string};if(!optionResponse.ok)throw new Error(data.error);const response=await startAuthentication({optionsJSON:data.options});const verify=await fetch("/api/passkey/verify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode:"authenticate",challengeId:data.challengeId,response})});const result=await verify.json() as {error?:string};if(!verify.ok)throw new Error(result.error);location.href="/studio"}catch(reason){setError(reason instanceof Error?reason.message:"Could not sign in.");setBusy(false)}};
  return <main className="login-shell"><section><Link className="creator-logo" href="/"><span>p</span>pollrr</Link><p className="eyebrow">WELCOME BACK</p><h1>Your polls,<br/>one tap away.</h1><p>Use the passkey saved on your phone or computer. No password and no email code.</p><button onClick={login} disabled={busy}>{busy?"Checking passkey…":"Continue with passkey"}</button>{error&&<small className="login-error">{error}</small>}<Link className="login-new" href="/studio?start=create">New here? Create a poll free →</Link></section></main>;
}
