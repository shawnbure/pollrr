"use client";

import Link from "next/link";
import { useCallback,useEffect,useState } from "react";

type Poll={id:string;prompt:string;optionA:string;optionB:string;topic:string;region:string;status:string;theme:string;isPublic:number;createdAt:number;responses:number;optionACount:number;optionBCount:number;snapshotHash?:string};
type CreatorData={polls:Poll[];preferences:{nightlyResults:boolean;aiPlan:string};platform:boolean};
type View="home"|"create"|"polls"|"results"|"account";

export default function CreatorClient({displayName}:{displayName:string}) {
  const [data,setData]=useState<CreatorData>({polls:[],preferences:{nightlyResults:false,aiPlan:"free"},platform:false});
  const [view,setView]=useState<View>("home");
  const [selected,setSelected]=useState("");
  const [form,setForm]=useState({prompt:"",optionA:"Yes",optionB:"No",topic:"",theme:"paper",isPublic:true});
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const load=useCallback(async()=>{const r=await fetch("/api/creator",{cache:"no-store"});if(r.ok){const next=await r.json() as CreatorData;setData(next);setSelected(current=>current||next.polls[0]?.id||"")}},[]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);
  const active=data.polls.find(p=>p.id===selected)||data.polls[0];
  const total=data.polls.reduce((sum,p)=>sum+Number(p.responses),0);
  const create=async()=>{
    setBusy(true);setNotice("");
    const r=await fetch("/api/creator",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
    const result=await r.json() as {id?:string;url?:string;error?:string};
    setBusy(false);
    if(!r.ok)return setNotice(result.error||"Could not create that poll.");
    setForm({prompt:"",optionA:"Yes",optionB:"No",topic:"",theme:"paper",isPublic:true});setSelected(result.id||"");await load();setView("polls");setNotice("Your poll is live and ready to share.");
  };
  const copy=async(id:string,platform="universal")=>{
    const url=new URL("/",location.origin);url.searchParams.set("p",id);url.searchParams.set("src",platform);
    await navigator.clipboard.writeText(url.toString());setNotice(`${platform==="universal"?"Poll":"Tracked"} link copied.`);
  };
  const update=async(id:string,status:string)=>{await fetch("/api/creator",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,status})});await load()};
  const nightly=async(value:boolean)=>{setData({...data,preferences:{...data.preferences,nightlyResults:value}});await fetch("/api/creator",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({kind:"preferences",nightlyResults:value})})};
  const initials=displayName.split(/\s|@/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  return <main className="creator-shell">
    <header className="creator-top"><Link className="creator-logo" href="/admin"><span>p</span>pollrr</Link><nav>{(["home","create","polls","results","account"] as View[]).map(item=><button key={item} className={view===item?"active":""} onClick={()=>setView(item)}>{item==="polls"?"My polls":item}</button>)}{data.platform&&<Link href="/admin?mode=platform">Admin</Link>}</nav><button className="creator-avatar" onClick={()=>setView("account")}>{initials}</button></header>
    {notice&&<div className="creator-toast">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
    <section className="creator-content">
      {view==="home"&&<Home name={displayName} polls={data.polls} total={total} create={()=>setView("create")} results={(id)=>{setSelected(id);setView("results")}}/>}
      {view==="create"&&<Create form={form} setForm={setForm} create={create} busy={busy}/>}
      {view==="polls"&&<Polls polls={data.polls} copy={copy} update={update} results={(id)=>{setSelected(id);setView("results")}} create={()=>setView("create")}/>}
      {view==="results"&&<Results polls={data.polls} active={active} selected={selected} select={setSelected} copy={copy}/>}
      {view==="account"&&<Account email={displayName} nightly={data.preferences.nightlyResults} setNightly={nightly} aiPlan={data.preferences.aiPlan}/>}
    </section>
  </main>
}

function Home({name,polls,total,create,results}:{name:string;polls:Poll[];total:number;create:()=>void;results:(id:string)=>void}){
  const recent=polls[0];return <div className="creator-home"><section className="welcome-block"><p>WELCOME BACK</p><h1>What do you want to ask?</h1><button onClick={create}>Create a poll <span>→</span></button><small>Free forever. No response limits.</small></section><div className="creator-stats"><article><span>Polls</span><b>{polls.length}</b></article><article><span>Responses</span><b>{total.toLocaleString()}</b></article><article><span>Immutable records</span><b>{total.toLocaleString()}</b></article></div>{recent?<article className="recent-poll"><div><small>LATEST POLL</small><h2>{recent.prompt}</h2><p>{recent.responses} responses · {recent.status}</p></div><button onClick={()=>results(recent.id)}>Read results</button></article>:<p className="creator-empty">Hi {name.split("@")[0]}. Your first poll takes about fifteen seconds.</p>}</div>
}
function Create({form,setForm,create,busy}:{form:{prompt:string;optionA:string;optionB:string;topic:string;theme:string;isPublic:boolean};setForm:(v:typeof form)=>void;create:()=>void;busy:boolean}){
  return <div className="creator-create"><div className="create-copy"><p>NEW POLL</p><h1>One question.<br/>That&apos;s it.</h1><span>Backgrounds are optional themes for the poll and its share card. The clean theme is always the default.</span></div><section className={`create-card theme-${form.theme}`}><label>Your question<textarea autoFocus maxLength={180} placeholder="Should our city make downtown parking free on weekends?" value={form.prompt} onChange={e=>setForm({...form,prompt:e.target.value})}/></label><div className="creator-options"><label>Answer one<input maxLength={60} value={form.optionA} onChange={e=>setForm({...form,optionA:e.target.value})}/></label><label>Answer two<input maxLength={60} value={form.optionB} onChange={e=>setForm({...form,optionB:e.target.value})}/></label></div><label>Topic <span>optional</span><input placeholder="Housing, sports, work…" value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}/></label><div className="theme-row"><span>Look</span>{["paper","sunset","ocean","night"].map(theme=><button aria-label={`${theme} theme`} className={`theme-dot ${theme} ${form.theme===theme?"selected":""}`} onClick={()=>setForm({...form,theme})} key={theme}/>)}</div><label className="public-toggle"><input type="checkbox" checked={form.isPublic} onChange={e=>setForm({...form,isPublic:e.target.checked})}/><span><b>Public poll</b><small>Eligible for de-identified aggregate trends</small></span></label><button className="creator-primary" disabled={busy||form.prompt.length<6} onClick={create}>{busy?"Creating…":"Create & copy link"} <span>→</span></button></section></div>
}
function Polls({polls,copy,update,results,create}:{polls:Poll[];copy:(id:string,p?:string)=>void;update:(id:string,s:string)=>void;results:(id:string)=>void;create:()=>void}){
  return <div><div className="creator-title"><div><p>YOUR LIBRARY</p><h1>My polls</h1></div><button onClick={create}>＋ New poll</button></div><div className="poll-library">{polls.length?polls.map(p=><article key={p.id}><span className={`poll-theme theme-${p.theme}`}/><div><small>{p.topic||"General"} · {new Date(p.createdAt).toLocaleDateString()}</small><h2>{p.prompt}</h2><p>{p.responses} responses · <b>{p.status}</b></p></div><div className="poll-actions"><button onClick={()=>copy(p.id)}>Copy link</button><button onClick={()=>results(p.id)}>Results</button><button onClick={()=>update(p.id,p.status==="live"?"paused":"live")}>{p.status==="live"?"Pause":"Open"}</button></div></article>):<div className="creator-empty"><h2>No polls yet.</h2><button onClick={create}>Create your first poll</button></div>}</div></div>
}
function Results({polls,active,selected,select,copy}:{polls:Poll[];active?:Poll;selected:string;select:(s:string)=>void;copy:(id:string,p?:string)=>void}){
  const pct=active?.responses?Math.round(Number(active.optionACount)/Number(active.responses)*100):0;const b=active?.responses?100-pct:0;
  const platforms=["facebook","instagram","tiktok","reddit","discord","slack"];
  if(!active)return <div className="creator-empty"><h2>Create a poll to see its results.</h2></div>;
  return <div><div className="creator-title"><div><p>LIVE REPORT</p><h1>Results</h1></div><select value={selected||active.id} onChange={e=>select(e.target.value)}>{polls.map(p=><option value={p.id} key={p.id}>{p.prompt}</option>)}</select></div><section className="result-report"><header><div><span>{active.topic||"General"} · {active.region}</span><h2>{active.prompt}</h2></div><b>{active.responses.toLocaleString()}<small>responses</small></b></header><div className="answer-result"><div><span>{active.optionA}</span><strong>{pct}%</strong></div><i><span style={{width:`${pct}%`}}/></i><div><span>{active.optionB}</span><strong>{b}%</strong></div></div><div className="report-insights"><article><span>LEADING ANSWER</span><b>{pct>=b?active.optionA:active.optionB}</b><p>{Math.abs(pct-b)} point margin</p></article><article><span>RECORD</span><b>{active.snapshotHash?"Verified":"Building"}</b><p>{active.snapshotHash?`${active.snapshotHash.slice(0,16)}…`:"The first signed snapshot appears after responses arrive."}</p></article><article><span>DATA</span><b>Human only</b><p>No modeled or synthetic votes in this result.</p></article></div><div className="share-platforms"><div><h3>Share this poll</h3><p>Each platform link is tagged so you can compare where responses came from.</p></div><button onClick={()=>copy(active.id)}>Copy universal link</button>{platforms.map(p=><button onClick={()=>copy(active.id,p)} key={p}>{p}</button>)}</div><footer><a href={`/verify/${active.id}`}>Open immutable record</a><a href={`/api/insights/${active.id}`}>Download aggregate data</a></footer></section></div>
}
function Account({email,nightly,setNightly,aiPlan}:{email:string;nightly:boolean;setNightly:(v:boolean)=>void;aiPlan:string}){
  return <div><div className="creator-title"><div><p>YOUR ACCOUNT</p><h1>Simple settings</h1></div></div><div className="account-grid"><article><span>Signed in as</span><b>{email}</b><p>Your creator history follows this account.</p></article><article className="nightly-setting"><div><span>Nightly results</span><b>Email me a concise nightly summary</b><p>Only when one of your polls received new responses.</p></div><button className={nightly?"on":""} onClick={()=>setNightly(!nightly)} aria-label="Toggle nightly results"><i/></button></article><article className="ai-upgrade"><span>POLLRR AI · {aiPlan}</span><h2>Write better polls in seconds.</h2><p>AI creation, neutral wording, smart categories, follow-up ideas and beautiful summaries.</p><button>Join the AI waitlist</button></article><article><span>Data promise</span><b>Public polls can improve aggregate trends.</b><p>Private polls are excluded. Contact identity is never attached to an individual answer.</p></article></div></div>
}
