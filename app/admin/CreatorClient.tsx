"use client";

import Link from "next/link";
import { useCallback,useEffect,useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

type Poll={id:string;publicToken:string;prompt:string;optionA:string;optionB:string;topic:string;tags?:string;region:string;status:string;theme:string;isPublic:number;createdAt:number;responses:number;optionACount:number;optionBCount:number;snapshotHash?:string};
type CreatorData={polls:Poll[];preferences:{nightlyResults:boolean;aiPlan:string;aiLimit:number;aiRemaining:number;aiWaitlist:boolean};platform:boolean};
type View="home"|"create"|"polls"|"results"|"account";

const publicPollOrigin=()=>location.hostname==="app.pollrr.com"?"https://pollrr.com":location.origin;

export default function CreatorClient({displayName,initialView="home"}:{displayName:string;initialView?:View}) {
  const [data,setData]=useState<CreatorData>({polls:[],preferences:{nightlyResults:false,aiPlan:"free",aiLimit:10,aiRemaining:10,aiWaitlist:false},platform:false});
  const [view,setView]=useState<View>(initialView);
  const [selected,setSelected]=useState("");
  const [form,setForm]=useState({prompt:"",optionA:"Yes",optionB:"No",topic:"",tags:"",theme:"paper",isPublic:true});
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [editing,setEditing]=useState<Poll|null>(null);
  const [justCreated,setJustCreated]=useState<{publicToken:string;prompt:string}|null>(null);
  const load=useCallback(async()=>{const r=await fetch("/api/studio",{cache:"no-store"});if(r.ok){const next=await r.json() as CreatorData;setData(next);setSelected(current=>current||next.polls[0]?.id||"")}},[]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);
  const active=data.polls.find(p=>p.id===selected)||data.polls[0];
  const total=data.polls.reduce((sum,p)=>sum+Number(p.responses),0);
  const create=async()=>{
    setBusy(true);setNotice("");
    const r=await fetch("/api/studio",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
    const result=await r.json() as {id?:string;publicToken?:string;url?:string;error?:string};
    setBusy(false);
    if(!r.ok)return setNotice(result.error||"Could not create that poll.");
    const createdPrompt=form.prompt;
    setForm({prompt:"",optionA:"Yes",optionB:"No",topic:"",tags:"",theme:"paper",isPublic:true});setSelected(result.id||"");await load();setView("polls");
    if(result.publicToken)setJustCreated({publicToken:result.publicToken,prompt:createdPrompt});
    else setNotice("Your poll is live and ready to share.");
  };
  const copy=async(publicToken:string,platform="universal")=>{
    const url=new URL(`/p/${publicToken}`,publicPollOrigin());if(platform!=="universal")url.searchParams.set("src",platform);
    await navigator.clipboard.writeText(url.toString());setNotice(`${platform==="universal"?"Poll":"Tracked"} link copied.`);
  };
  const update=async(id:string,status:string)=>{await fetch("/api/studio",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,status})});await load()};
  const saveEdit=async()=>{
    if(!editing)return;
    setBusy(true);
    const r=await fetch("/api/studio",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({kind:"poll",...editing})});
    const result=await r.json() as {error?:string};setBusy(false);
    if(!r.ok)return setNotice(result.error||"Could not update that poll.");
    setEditing(null);setNotice("Poll updated.");await load();
  };
  const removePoll=async(id:string)=>{
    if(!confirm("Delete this poll? Polls with responses will be closed so their immutable evidence remains available."))return;
    const r=await fetch(`/api/studio?id=${encodeURIComponent(id)}`,{method:"DELETE"});
    const result=await r.json() as {error?:string;archived?:boolean};
    if(!r.ok)return setNotice(result.error||"Could not delete that poll.");
    setNotice(result.archived?"Poll closed. Its immutable response record was preserved.":"Poll deleted.");await load();
  };
  const nightly=async(value:boolean)=>{setData({...data,preferences:{...data.preferences,nightlyResults:value}});await fetch("/api/studio",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({kind:"preferences",nightlyResults:value})})};
  const joinAiWaitlist=async()=>{await fetch("/api/studio",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({kind:"aiWaitlist"})});setData({...data,preferences:{...data.preferences,aiWaitlist:true}});setNotice("You’re on the Pollrr AI launch list.")};
  const initials=displayName.split(/\s|@/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  return <main className="creator-shell">
    <header className="creator-top"><Link className="creator-logo" href="/studio"><span>p</span>pollrr</Link><nav>{(["home","create","polls","results","account"] as View[]).map(item=><button key={item} className={view===item?"active":""} onClick={()=>setView(item)}>{item==="polls"?"My polls":item}</button>)}{data.platform&&<Link href="/admin?mode=platform">Admin</Link>}</nav><button className="creator-avatar" onClick={()=>setView("account")}>{initials}</button></header>
    {notice&&<div className="creator-toast">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
    <section className="creator-content">
      {view==="home"&&<Home name={displayName} polls={data.polls} total={total} create={()=>setView("create")} results={(id)=>{setSelected(id);setView("results")}}/>}
      {view==="create"&&<Create form={form} setForm={setForm} create={create} busy={busy} aiPlan={data.preferences.aiPlan} aiRemaining={data.preferences.aiRemaining} onAiUsed={load} upgrade={()=>setView("account")}/>}
      {view==="polls"&&<Polls polls={data.polls} copy={copy} update={update} edit={setEditing} remove={removePoll} results={(id)=>{setSelected(id);setView("results")}} create={()=>setView("create")}/>}
      {view==="results"&&<Results polls={data.polls} active={active} selected={selected} select={setSelected} copy={copy} aiPlan={data.preferences.aiPlan} aiRemaining={data.preferences.aiRemaining} onAiUsed={load} upgrade={()=>setView("account")}/>}
      {view==="account"&&<Account nightly={data.preferences.nightlyResults} setNightly={nightly} aiPlan={data.preferences.aiPlan} aiLimit={data.preferences.aiLimit} aiRemaining={data.preferences.aiRemaining} aiWaitlist={data.preferences.aiWaitlist} joinAiWaitlist={joinAiWaitlist}/>} 
    </section>
    {editing&&<div className="modal-backdrop" onMouseDown={()=>setEditing(null)}><div className="question-modal creator-editor" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setEditing(null)}>×</button><span className="modal-step">EDIT POLL</span><h2>Update your poll</h2><textarea value={editing.prompt} onChange={e=>setEditing({...editing,prompt:e.target.value})}/><div className="two-fields"><input value={editing.optionA} onChange={e=>setEditing({...editing,optionA:e.target.value})}/><input value={editing.optionB} onChange={e=>setEditing({...editing,optionB:e.target.value})}/></div><div className="two-fields"><input placeholder="Topic" value={editing.topic||""} onChange={e=>setEditing({...editing,topic:e.target.value})}/><input placeholder="Tags" value={editing.tags||""} onChange={e=>setEditing({...editing,tags:e.target.value})}/></div><div className="modal-actions"><button onClick={()=>setEditing(null)}>Cancel</button><button className="continue" disabled={busy} onClick={saveEdit}>{busy?"Saving…":"Save changes"}</button></div></div></div>}
    {justCreated&&<ShareLaunch poll={justCreated} close={()=>setJustCreated(null)} copied={()=>setNotice("Poll link copied.")} claim={()=>{setJustCreated(null);setView("account")}}/>} 
  </main>
}

function ShareLaunch({poll,close,copied,claim}:{poll:{publicToken:string;prompt:string};close:()=>void;copied:()=>void;claim:()=>void}){
  const [copyState,setCopyState]=useState("");
  const url=(platform="universal")=>{const target=new URL(`/p/${poll.publicToken}`,publicPollOrigin());if(platform!=="universal")target.searchParams.set("src",platform);return target.toString()};
  const message=(platform="universal")=>`${poll.prompt}\nPick your answer before you see the split: ${url(platform)}`;
  const copy=async(platform="universal")=>{await navigator.clipboard.writeText(message(platform));setCopyState(platform);copied();window.setTimeout(()=>setCopyState(""),1800)};
  const open=(target:string)=>window.open(target,"_blank","noopener,noreferrer");
  const social=(platform:string)=>{
    const link=encodeURIComponent(url(platform));const text=encodeURIComponent(`${poll.prompt} Pick your answer before you see the split.`);
    if(platform==="sms")window.open(`sms:?&body=${encodeURIComponent(message("sms"))}`,"_self");
    else if(platform==="whatsapp")open(`https://wa.me/?text=${encodeURIComponent(message("whatsapp"))}`);
    else if(platform==="facebook")open(`https://www.facebook.com/sharer/sharer.php?u=${link}`);
    else if(platform==="x")open(`https://twitter.com/intent/tweet?text=${text}&url=${link}`);
    else if(platform==="linkedin")open(`https://www.linkedin.com/sharing/share-offsite/?url=${link}`);
    else if(platform==="reddit")open(`https://www.reddit.com/submit?url=${link}&title=${encodeURIComponent(poll.prompt)}`);
    else if(platform==="email")window.open(`mailto:?subject=${encodeURIComponent("What do you think?")}&body=${encodeURIComponent(message("email"))}`,"_self");
    else void copy(platform);
  };
  const share=async()=>{
    const data={title:"Vote before you see the split",text:`${poll.prompt} Pick your answer before you see mine.`,url:url()};
    if(navigator.share)await navigator.share(data).catch(()=>undefined);else await copy();
  };
  const channels=[['sms','Message','◌'],['whatsapp','WhatsApp','W'],['facebook','Facebook','f'],['x','X','𝕏'],['linkedin','LinkedIn','in'],['reddit','Reddit','r'],['email','Email','@'],['instagram','Instagram','◎'],['tiktok','TikTok','♪']] as const;
  return <div className="modal-backdrop share-launch-backdrop"><section className="share-launch"><span className="launch-check">✓</span><p>YOUR POLL IS LIVE</p><h2>Share your poll.</h2><p className="share-launch-question">{poll.prompt}</p><div className="share-channel-grid">{channels.map(([id,label,icon])=><button key={id} onClick={()=>social(id)}><i>{icon}</i><span>{copyState===id?"Copied":label}</span>{(id==="instagram"||id==="tiktok")&&<small>copies link</small>}</button>)}</div><button className="share-launch-primary" onClick={share}>More share options <span>↗</span></button><button className="share-launch-copy" onClick={()=>copy()}>{copyState==="universal"?"Copied":"Copy link & caption"}</button><small>Every platform link is tagged so results can show where responses came from.</small><button className="share-launch-claim" onClick={claim}>Claim this creator account</button><button className="share-launch-close" onClick={close}>Done</button></section></div>;
}

function Home({name,polls,total,create,results}:{name:string;polls:Poll[];total:number;create:()=>void;results:(id:string)=>void}){
  const recent=polls[0];return <div className="creator-home"><section className="welcome-block"><p>WELCOME BACK</p><h1>What do you want to ask?</h1><button onClick={create}>Create a poll <span>→</span></button><small>Free forever. No response limits.</small></section><div className="creator-stats"><article><span>Polls</span><b>{polls.length}</b></article><article><span>Responses</span><b>{total.toLocaleString()}</b></article><article><span>Immutable records</span><b>{total.toLocaleString()}</b></article></div>{recent?<article className="recent-poll"><div><small>LATEST POLL</small><h2>{recent.prompt}</h2><p>{recent.responses} responses · {recent.status}</p></div><button onClick={()=>results(recent.id)}>Read results</button></article>:<p className="creator-empty">Hi {name.split("@")[0]}. Your first poll takes about fifteen seconds.</p>}</div>
}
function Create({form,setForm,create,busy,aiPlan,aiRemaining,onAiUsed,upgrade}:{form:{prompt:string;optionA:string;optionB:string;topic:string;tags:string;theme:string;isPublic:boolean};setForm:(v:typeof form)=>void;create:()=>void;busy:boolean;aiPlan:string;aiRemaining:number;onAiUsed:()=>Promise<void>;upgrade:()=>void}){
  const [idea,setIdea]=useState("");const [aiBusy,setAiBusy]=useState("");const [review,setReview]=useState<{score:number;issues:string[];neutralRewrite:string;optionA:string;optionB:string;verdict:string}|null>(null);const [ideas,setIdeas]=useState<string[]>([]);const [aiError,setAiError]=useState("");
  const ai=async(action:string,payload:object={})=>{setAiBusy(action);setAiError("");const r=await fetch("/api/studio-ai",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,...payload})});const result=await r.json() as Record<string,unknown>&{error?:string};setAiBusy("");if(r.ok)await onAiUsed();if(!r.ok){setAiError(result.error||"AI could not complete that.");return null}return result};
  const generate=async()=>{const r=await ai("create",{idea});if(r)setForm({...form,prompt:String(r.question||""),optionA:String(r.optionA||""),optionB:String(r.optionB||""),topic:String(r.topic||""),tags:Array.isArray(r.tags)?r.tags.join(", "):""})};
  const reviewPoll=async(values={prompt:form.prompt,optionA:form.optionA,optionB:form.optionB})=>{const r=await ai("review",values);if(r)setReview(r as unknown as typeof review)};
  const applyRewrite=async()=>{if(!review)return;const rewritten={prompt:review.neutralRewrite,optionA:review.optionA,optionB:review.optionB};setForm({...form,...rewritten});await reviewPoll(rewritten)};
  const getIdeas=async()=>{const r=await ai("ideas");if(r)setIdeas(Array.isArray(r.followUps)?r.followUps.map(String):[])};
  const aiAvailable=aiPlan==="pro"||aiRemaining!==0;
  return <div className="creator-create"><div className="create-copy"><p>NEW POLL</p><h1>One question.<br/>That&apos;s it.</h1><span>Backgrounds are optional themes for the poll and its share card. The clean theme is always the default.</span><aside className="ai-studio"><div><b>Pollrr AI</b><span>{aiPlan==="pro"?"Pro":`${aiRemaining} free left`}</span></div>{aiAvailable?<><textarea placeholder="Describe what you want to learn…" value={idea} onChange={e=>setIdea(e.target.value)}/><button disabled={aiBusy!==""||idea.length<3} onClick={generate}>{aiBusy==="create"?"Writing…":"Create poll with AI"}</button><button className="ai-secondary" disabled={aiBusy!==""} onClick={getIdeas}>{aiBusy==="ideas"?"Thinking…":"Ideas from my history"}</button>{ideas.length>0&&<div className="ai-ideas">{ideas.map(x=><button onClick={()=>setIdea(x)} key={x}>{x}</button>)}</div>}</>:<><p>Your free AI actions are used for this month. Join the launch list for paid access.</p><button onClick={upgrade}>View AI access</button></>}{aiError&&<small>{aiError}</small>}</aside></div><section className={`create-card theme-${form.theme}`}><label>Your question<textarea autoFocus maxLength={180} placeholder="Should our city make downtown parking free on weekends?" value={form.prompt} onChange={e=>{setForm({...form,prompt:e.target.value});setReview(null)}}/></label><div className="creator-options"><label>Answer one<input maxLength={60} value={form.optionA} onChange={e=>{setForm({...form,optionA:e.target.value});setReview(null)}}/></label><label>Answer two<input maxLength={60} value={form.optionB} onChange={e=>{setForm({...form,optionB:e.target.value});setReview(null)}}/></label></div>{aiAvailable&&form.prompt&&<button className="ai-review-button" disabled={aiBusy!==""} onClick={()=>reviewPoll()}>{aiBusy==="review"?"Reviewing…":"Review neutrality with AI"}</button>}{review&&<section className={`ai-review ${review.score>=80?"review-good":review.score>=55?"review-watch":"review-needs-work"}`}><header><div className="review-score"><strong>{review.score}</strong><span>/ 100</span></div><div><span className="review-label">NEUTRALITY REVIEW</span><h3>{review.score>=80?"Ready to publish":review.score>=55?"A few things to improve":"Rewrite recommended"}</h3></div></header><p className="review-verdict">{review.verdict}</p>{review.issues.length>0&&<div className="review-issues">{review.issues.map(x=><span key={x}>{x}</span>)}</div>}<div className="review-rewrite"><span>SUGGESTED VERSION</span><b>{review.neutralRewrite}</b><small>{review.optionA} <i>or</i> {review.optionB}</small></div><button disabled={aiBusy!==""} onClick={applyRewrite}>{aiBusy==="review"?"Applying & rescoring…":"Use rewrite & rescore"}</button></section>}<div className="creator-options"><label>Topic <span>optional</span><input placeholder="Housing" value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}/></label><label>Tags <span>optional</span><input placeholder="local, budget, policy" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/></label></div><div className="theme-row"><span>Look</span>{["paper","sunset","ocean","night"].map(theme=><button aria-label={`${theme} theme`} className={`theme-dot ${theme} ${form.theme===theme?"selected":""}`} onClick={()=>setForm({...form,theme})} key={theme}/>)}</div><label className="public-toggle"><input type="checkbox" checked={form.isPublic} onChange={e=>setForm({...form,isPublic:e.target.checked})}/><span><b>Public poll</b><small>Eligible for de-identified aggregate trends</small></span></label><button className="creator-primary" disabled={busy||form.prompt.length<6} onClick={create}>{busy?"Creating…":"Create & copy link"} <span>→</span></button></section></div>
}
function Polls({polls,copy,update,edit,remove,results,create}:{polls:Poll[];copy:(id:string,p?:string)=>void;update:(id:string,s:string)=>void;edit:(p:Poll)=>void;remove:(id:string)=>void;results:(id:string)=>void;create:()=>void}){
  const download=(poll:Poll)=>{
    const platforms=["universal","facebook","instagram","youtube","tiktok","reddit","discord","slack"];
    const rows=["platform,url",...platforms.map(platform=>{const url=new URL(`/p/${poll.publicToken}`,publicPollOrigin());if(platform!=="universal")url.searchParams.set("src",platform);return `${platform},${url}`})];
    const blob=new Blob([rows.join("\n")],{type:"text/csv"});const href=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=href;anchor.download=`pollrr-${poll.id.slice(0,8)}-links.csv`;anchor.click();URL.revokeObjectURL(href);
  };
  return <div><div className="creator-title"><div><p>YOUR LIBRARY</p><h1>My polls</h1></div><button onClick={create}>＋ New poll</button></div><div className="poll-library">{polls.length?polls.map(p=><article key={p.id}><span className={`poll-theme theme-${p.theme}`}/><div><small>{p.topic||"General"} · {new Date(p.createdAt).toLocaleDateString()}</small><h2>{p.prompt}</h2><p>{p.responses} responses · <b>{p.status}</b></p></div><div className="poll-actions"><button onClick={()=>window.open(`/p/${p.publicToken}`,"_blank")}>Open</button><button onClick={()=>copy(p.publicToken)}>Copy</button><button onClick={()=>download(p)}>Download links</button><button onClick={()=>results(p.id)}>Results</button><button onClick={()=>edit(p)}>Edit</button><button onClick={()=>update(p.id,p.status==="live"?"paused":"live")}>{p.status==="live"?"Pause":"Publish"}</button><button className="action-danger" onClick={()=>remove(p.id)}>Delete</button></div></article>):<div className="creator-empty"><h2>No polls yet.</h2><button onClick={create}>Create your first poll</button></div>}</div></div>
}
function Results({polls,active,selected,select,copy,aiPlan,aiRemaining,onAiUsed,upgrade}:{polls:Poll[];active?:Poll;selected:string;select:(s:string)=>void;copy:(id:string,p?:string)=>void;aiPlan:string;aiRemaining:number;onAiUsed:()=>Promise<void>;upgrade:()=>void}){
  const [summary,setSummary]=useState<{headline:string;summary:string;insights:string[];explanationThemes:string[];facebook:string;instagram:string;tiktok:string}|null>(null);const [aiBusy,setAiBusy]=useState(false);const [aiError,setAiError]=useState("");
  const summarize=async()=>{if(!active)return;setAiBusy(true);setAiError("");const r=await fetch("/api/studio-ai",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"summary",questionId:active.id})});const result=await r.json() as typeof summary&{error?:string};setAiBusy(false);if(!r.ok)return setAiError(result?.error||"Could not summarize.");setSummary(result);await onAiUsed()};
  const pct=active?.responses?Math.round(Number(active.optionACount)/Number(active.responses)*100):0;const b=active?.responses?100-pct:0;
  const platforms=["facebook","instagram","youtube","tiktok","reddit","discord","slack"];
  if(!active)return <div className="creator-empty"><h2>Create a poll to see its results.</h2></div>;
  const aiAvailable=aiPlan==="pro"||aiRemaining!==0;
  return <div><div className="creator-title"><div><p>LIVE REPORT</p><h1>Results</h1></div><select value={selected||active.id} onChange={e=>{select(e.target.value);setSummary(null)}}>{polls.map(p=><option value={p.id} key={p.id}>{p.prompt}</option>)}</select></div><section className="result-report"><header><div><span>{active.topic||"General"} · {active.region}</span><h2>{active.prompt}</h2></div><b>{active.responses.toLocaleString()}<small>responses</small></b></header><div className="answer-result"><div><span>{active.optionA}</span><strong>{pct}%</strong></div><i><span style={{width:`${pct}%`}}/></i><div><span>{active.optionB}</span><strong>{b}%</strong></div></div><div className="report-insights"><article><span>LEADING ANSWER</span><b>{pct>=b?active.optionA:active.optionB}</b><p>{Math.abs(pct-b)} point margin</p></article><article><span>RECORD</span><b>{active.snapshotHash?"Verified":"Building"}</b><p>{active.snapshotHash?`${active.snapshotHash.slice(0,16)}…`:"The first signed snapshot appears after responses arrive."}</p></article><article><span>DATA</span><b>Human only</b><p>No modeled or synthetic votes in this result.</p></article></div><section className="ai-report"><div><span>POLLRR AI REPORT · {aiPlan==="pro"?"PRO":`${aiRemaining} FREE LEFT`}</span><h3>{summary?.headline||"Turn verified results into a clear story."}</h3><p>{summary?.summary||"AI summarizes the aggregate human result, explanation themes and platform-ready share copy without inventing responses."}</p></div>{aiAvailable?<button disabled={aiBusy||active.responses===0} onClick={summarize}>{aiBusy?"Reading results…":summary?"Refresh summary":"Generate AI report"}</button>:<button onClick={upgrade}>View AI access</button>}{aiError&&<small>{aiError}</small>}{summary&&<><div className="ai-insight-list">{summary.insights.map(x=><p key={x}>• {x}</p>)}</div><div className="ai-share-copy"><article><b>Facebook</b><p>{summary.facebook}</p><button onClick={()=>navigator.clipboard.writeText(summary.facebook)}>Copy</button></article><article><b>Instagram</b><p>{summary.instagram}</p><button onClick={()=>navigator.clipboard.writeText(summary.instagram)}>Copy</button></article><article><b>TikTok</b><p>{summary.tiktok}</p><button onClick={()=>navigator.clipboard.writeText(summary.tiktok)}>Copy</button></article></div></>}</section><div className="share-platforms"><div><h3>Share this poll</h3><p>Social apps cannot run a web poll inside a native post. Use a tracked link to send people straight to the one-tap poll.</p></div><button onClick={()=>copy(active.publicToken)}>Copy universal link</button>{platforms.map(p=><button onClick={()=>copy(active.publicToken,p)} key={p}>{p}</button>)}</div><div className="platform-guide"><article><b>Facebook</b><span>Paste the Facebook link into a post. Pollrr supplies the link preview.</span></article><article><b>Instagram</b><span>Use the Instagram link in a Story link sticker or your bio. Feed captions are not a reliable clickable path.</span></article><article><b>YouTube</b><span>Use the YouTube link in a long-form description or channel profile. Shorts descriptions and comments are not clickable.</span></article></div><footer><a href={`/verify/${active.id}`}>Open immutable record</a><a href={`/api/insights/${active.id}`}>Download aggregate data</a></footer></section></div>
}
function Account({nightly,setNightly,aiPlan,aiLimit,aiRemaining,aiWaitlist,joinAiWaitlist}:{nightly:boolean;setNightly:(v:boolean)=>void;aiPlan:string;aiLimit:number;aiRemaining:number;aiWaitlist:boolean;joinAiWaitlist:()=>Promise<void>}){
  return <div><div className="creator-title"><div><p>YOUR ACCOUNT</p><h1>Simple settings</h1></div></div><div className="account-grid"><PasskeyPanel/><article className="nightly-setting"><div><span>Nightly results</span><b>Email me a concise nightly summary</b><p>Only when one of your polls received new responses.</p></div><button className={nightly?"on":""} onClick={()=>setNightly(!nightly)} aria-label="Toggle nightly results"><i/></button></article><article className="ai-upgrade"><span>POLLRR AI · {aiPlan==="pro"?"PRO":"CREATOR BETA"}</span><h2>{aiPlan==="pro"?"Unlimited creator intelligence.":`${aiRemaining} of ${aiLimit} free actions remain.`}</h2><p>Draft neutral polls, improve answer choices, discover follow-ups, summarize verified results, and write platform-ready share copy.</p>{aiPlan!=="pro"&&(aiWaitlist?<button disabled>Launch list joined ✓</button>:<button onClick={joinAiWaitlist}>Join the AI launch list</button>)}</article><article><span>Data promise</span><b>AI interprets. Humans vote.</b><p>AI never creates responses or changes human totals. Every generated report states its verified sample size.</p></article></div></div>
}

function PasskeyPanel(){
  const [status,setStatus]=useState<{claimed:boolean;handle:string|null}>({claimed:false,handle:null});const [handle,setHandle]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  useEffect(()=>{fetch("/api/passkey/status").then(r=>r.json()).then(setStatus).catch(()=>undefined)},[]);
  const claim=async()=>{setBusy(true);setError("");try{const optionResponse=await fetch("/api/passkey/options",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode:"register",handle})});const data=await optionResponse.json() as {challengeId:string;options:Parameters<typeof startRegistration>[0]["optionsJSON"];error?:string};if(!optionResponse.ok)throw new Error(data.error);const response=await startRegistration({optionsJSON:data.options});const verify=await fetch("/api/passkey/verify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode:"register",challengeId:data.challengeId,response})});const result=await verify.json() as {error?:string;handle?:string};if(!verify.ok)throw new Error(result.error);setStatus({claimed:true,handle:result.handle||handle})}catch(reason){setError(reason instanceof Error?reason.message:"Could not create passkey.")}finally{setBusy(false)}};
  return <article className="passkey-panel"><span>{status.claimed?"ACCOUNT SECURED":"SAVE YOUR ACCOUNT"}</span><b>{status.claimed?`@${status.handle}`:"Claim your creator account"}</b><p>{status.claimed?"Your polls follow your synced passkey across supported devices.":"Choose a handle and save a passkey. No password or email code."}</p>{!status.claimed&&<><input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="your-handle" autoCapitalize="none"/><button disabled={busy||handle.length<3} onClick={claim}>{busy?"Creating passkey…":"Claim with passkey"}</button></>}{error&&<small>{error}</small>}</article>;
}
