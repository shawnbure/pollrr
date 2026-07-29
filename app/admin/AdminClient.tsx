"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Campaign = { id:string; name:string; objective?:string; status:string; polls:number; links:number; clicks:number };
type Audience = { id:string; name:string; description?:string; geography?:string };
type Poll = { id:string; prompt:string; status:string; campaign_id:string; campaign_name:string; votes:number };
type LinkRow = { id:string; question_id:string; label:string; channel:string; token:string; clicks:number; prompt:string; audience_name?:string };
type Workspace = { organization:{id:string;name:string;role:string}; campaigns:Campaign[]; audiences:Audience[]; questions:Poll[]; links:LinkRow[] };
type Overview = { totalResponses:number; integrity?:{total:number;trusted:number;flagged:number}; ledger?:{snapshot_hash:string}|null };

const sections = ["Overview","Campaigns","Polls","Audiences","Distribution","Results","Integrity","Reports","Team"];

export default function AdminClient({ displayName }: { displayName:string }) {
  const [active,setActive]=useState("Overview");
  const [workspace,setWorkspace]=useState<Workspace|null>(null);
  const [overview,setOverview]=useState<Overview|null>(null);
  const [modal,setModal]=useState<"campaign"|"poll"|"audience"|"link"|null>(null);
  const [form,setForm]=useState<Record<string,string>>({});
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);

  const load=useCallback(async()=>{
    const [w,o]=await Promise.all([
      fetch("/api/admin/workspace",{cache:"no-store"}),
      fetch("/api/admin/overview",{cache:"no-store"}),
    ]);
    if(w.ok)setWorkspace(await w.json());
    if(o.ok)setOverview(await o.json());
  },[]);
  useEffect(()=>{const timer=setTimeout(load,0);return()=>clearTimeout(timer)},[load]);

  const create=async()=>{
    setBusy(true);
    const endpoint=modal==="poll"?"/api/admin/questions":"/api/admin/workspace";
    const payload=modal==="poll"
      ? {prompt:form.prompt,optionA:form.optionA,optionB:form.optionB,topic:form.topic,region:form.region,campaignId:form.campaignId}
      : {kind:modal,...form};
    const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
    const data=await response.json() as {error?:string;url?:string};
    setBusy(false);
    if(!response.ok)return setNotice(data.error||"Could not save.");
    if(data.url){await navigator.clipboard.writeText(`${location.origin}${data.url}`);setNotice("Tracked link created and copied.");}
    else setNotice(`${modal?.[0].toUpperCase()}${modal?.slice(1)} created.`);
    setModal(null);setForm({});await load();
  };
  const publish=async(id:string,status:string)=>{
    await fetch("/api/admin/questions",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,status})});await load();
  };
  const openModal=(kind:typeof modal)=>{
    setForm({
      campaignId:workspace?.campaigns[0]?.id||"",
      questionId:workspace?.questions[0]?.id||"",
      audienceId:workspace?.audiences[0]?.id||"",
      channel:"link",
    });setModal(kind);
  };
  const trusted=overview?.integrity?.total?Math.round(Number(overview.integrity.trusted)/Number(overview.integrity.total)*100):100;

  return <main className="admin-shell modern-admin">
    <aside className="sidebar">
      <Link className="brand admin-brand" href="/"><span className="brand-mark">p</span><span>pollrr</span></Link>
      <div className="org-switch"><small>ORGANIZATION</small><b>{workspace?.organization.name||"Loading…"}</b><span>{workspace?.organization.role||"member"}</span></div>
      <nav>{sections.map((item,i)=><button className={active===item?"active":""} onClick={()=>setActive(item)} key={item}><span className="nav-icon">{["⌂","◫","●","◎","↗","▥","◇","⇩","♙"][i]}</span>{item}{item==="Campaigns"&&<em>{workspace?.campaigns.length||0}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="admin-user"><span>{displayName.slice(0,2).toUpperCase()}</span><div><b>{displayName}</b><small>Workspace owner</small></div></div></div>
    </aside>
    <section className="admin-main">
      <header className="admin-header"><div><p>{workspace?.organization.name?.toUpperCase()||"POLLRR"}</p><h1>{active}</h1></div><div className="header-actions"><button onClick={()=>window.open("/","_blank")}>Open voter view</button><button className="new-btn" onClick={()=>openModal("campaign")}>＋ New campaign</button></div></header>
      {notice&&<div className="admin-notice">{notice}<button onClick={()=>setNotice("")}>×</button></div>}

      {active==="Overview"&&<><div className="metric-grid admin-metrics">
        <article><div className="metric-top"><span>Active campaigns</span><i>Workspace</i></div><b>{workspace?.campaigns.filter(c=>c.status==="active").length||0}</b><small>{workspace?.campaigns.length||0} total campaigns</small></article>
        <article><div className="metric-top"><span>Human responses</span><i className="green">Live</i></div><b>{Number(overview?.totalResponses||0).toLocaleString()}</b><small>Never blended with model estimates</small></article>
        <article><div className="metric-top"><span>Distribution</span><i>Tracked</i></div><b>{workspace?.links.length||0}</b><small>{workspace?.links.reduce((n,l)=>n+Number(l.clicks),0)||0} link opens</small></article>
        <article><div className="metric-top"><span>Signal integrity</span><i>Auditable</i></div><b>{trusted}<span>% trusted</span></b><small>{overview?.integrity?.flagged||0} flagged for review</small></article>
      </div><div className="admin-grid">
        <article className="panel"><div className="panel-head"><div><h2>Campaign portfolio</h2><p>Organization-separated work</p></div><button onClick={()=>setActive("Campaigns")}>View all →</button></div><div className="workspace-list">{workspace?.campaigns.slice(0,4).map(c=><div key={c.id}><span className={`status ${c.status}`}>{c.status}</span><b>{c.name}</b><small>{c.polls} polls · {c.links} links · {c.clicks} opens</small></div>)}</div></article>
        <article className="panel launch-panel"><span>LAUNCH WORKFLOW</span><h2>Campaign → poll → audience → tracked link</h2><div><button onClick={()=>openModal("poll")}>Create poll</button><button onClick={()=>openModal("audience")}>Add audience</button><button onClick={()=>openModal("link")}>Distribute</button></div></article>
      </div></>}

      {active==="Campaigns"&&<WorkspaceTable title="Campaigns" action="New campaign" onAction={()=>openModal("campaign")}>{workspace?.campaigns.map(c=><div className="data-row campaign-row" key={c.id}><span className={`status ${c.status}`}>{c.status}</span><div><b>{c.name}</b><small>{c.objective||"No objective added"}</small></div><span>{c.polls} polls</span><span>{c.links} links</span><span>{c.clicks} opens</span></div>)}</WorkspaceTable>}
      {active==="Polls"&&<WorkspaceTable title="Poll library" action="New poll" onAction={()=>openModal("poll")}>{workspace?.questions.map(q=><div className="data-row poll-row" key={q.id}><span className={`status ${q.status}`}>{q.status}</span><div><b>{q.prompt}</b><small>{q.campaign_name}</small></div><span>{q.votes} votes</span><div className="row-actions">{q.status!=="live"&&<button onClick={()=>publish(q.id,"live")}>Publish</button>}{q.status==="live"&&<button onClick={()=>publish(q.id,"paused")}>Pause</button>}<button onClick={()=>window.open(`/?p=${q.id}`,"_blank")}>Preview</button></div></div>)}</WorkspaceTable>}
      {active==="Audiences"&&<WorkspaceTable title="Audience definitions" action="New audience" onAction={()=>openModal("audience")}>{workspace?.audiences.map(a=><div className="data-row audience-row" key={a.id}><div><b>{a.name}</b><small>{a.description||"No description"}</small></div><span>{a.geography||"Any geography"}</span><em>Privacy-safe definition</em></div>)}</WorkspaceTable>}
      {active==="Distribution"&&<WorkspaceTable title="Tracked distribution" action="Create link" onAction={()=>openModal("link")}>{workspace?.links.map(l=><div className="data-row distribution-row" key={l.id}><span className="channel-pill">{l.channel}</span><div><b>{l.label}</b><small>{l.prompt}</small></div><span>{l.audience_name||"Open audience"}</span><b>{l.clicks} opens</b><button onClick={()=>navigator.clipboard.writeText(`${location.origin}/?p=${l.question_id}&src=${l.token}`)}>Copy link</button></div>)}</WorkspaceTable>}
      {["Results","Integrity","Reports","Team"].includes(active)&&<FeaturePanel active={active} workspace={workspace} overview={overview}/>}
    </section>
    {modal&&<EditorModal kind={modal} form={form} setForm={setForm} workspace={workspace} busy={busy} close={()=>setModal(null)} save={create}/>}
  </main>;
}

function WorkspaceTable({title,action,onAction,children}:{title:string;action:string;onAction:()=>void;children:React.ReactNode}){return <article className="panel workspace-panel"><div className="panel-head"><div><h2>{title}</h2><p>Cloudflare-backed workspace data</p></div><button onClick={onAction}>{action} ＋</button></div><div className="workspace-list">{children}</div></article>}

function FeaturePanel({active,workspace,overview}:{active:string;workspace:Workspace|null;overview:Overview|null}){
  const copy:{[key:string]:[string,string]}={Results:["Human results","Compare campaigns, sources, audiences, explanations, and longitudinal shifts without mixing in modeled estimates."],Integrity:["Signal integrity","Review trusted and flagged human responses; flags remain auditable and never silently erase votes."],Reports:["Research reports","Create methodology-aware briefs with sampling limits, verified aggregates, common ground, and downloadable audit manifests."],Team:["Organization access","Invite analysts, editors, and viewers with organization-scoped roles."]};
  return <article className="panel feature-workspace"><span>{active.toUpperCase()}</span><h2>{copy[active][0]}</h2><p>{copy[active][1]}</p><div className="feature-kpis"><div><b>{active==="Integrity"?overview?.integrity?.flagged||0:workspace?.campaigns.length||0}</b><small>{active==="Integrity"?"flagged responses":"campaigns in workspace"}</small></div><div><b>{overview?.totalResponses||0}</b><small>raw human responses</small></div><div><b>0</b><small>synthetic votes</small></div></div>{active==="Results"&&workspace?.questions.map(q=><div className="result-line" key={q.id}><b>{q.prompt}</b><span>{q.votes} responses</span><a href={`/api/insights/${q.id}`}>Open aggregate data →</a></div>)}</article>
}

function EditorModal({kind,form,setForm,workspace,busy,close,save}:{kind:"campaign"|"poll"|"audience"|"link";form:Record<string,string>;setForm:(v:Record<string,string>)=>void;workspace:Workspace|null;busy:boolean;close:()=>void;save:()=>void}){
  const field=(key:string,value:string)=>setForm({...form,[key]:value});
  return <div className="modal-backdrop" onMouseDown={close}><div className="question-modal admin-editor" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={close}>×</button><span className="modal-step">NEW {kind.toUpperCase()}</span><h2>{kind==="link"?"Create a tracked distribution link":`Create ${kind}`}</h2>
    {kind==="campaign"&&<><input placeholder="Campaign name" value={form.name||""} onChange={e=>field("name",e.target.value)}/><textarea placeholder="Objective and decisions this campaign should inform" value={form.objective||""} onChange={e=>field("objective",e.target.value)}/></>}
    {kind==="poll"&&<><select value={form.campaignId} onChange={e=>field("campaignId",e.target.value)}>{workspace?.campaigns.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select><textarea placeholder="Ask one neutral question" value={form.prompt||""} onChange={e=>field("prompt",e.target.value)}/><div className="two-fields"><input placeholder="Option A" value={form.optionA||""} onChange={e=>field("optionA",e.target.value)}/><input placeholder="Option B" value={form.optionB||""} onChange={e=>field("optionB",e.target.value)}/></div><div className="two-fields"><input placeholder="Topic" value={form.topic||""} onChange={e=>field("topic",e.target.value)}/><input placeholder="Region" value={form.region||""} onChange={e=>field("region",e.target.value)}/></div></>}
    {kind==="audience"&&<><input placeholder="Audience name" value={form.name||""} onChange={e=>field("name",e.target.value)}/><textarea placeholder="Who should this represent?" value={form.description||""} onChange={e=>field("description",e.target.value)}/><input placeholder="Geography" value={form.geography||""} onChange={e=>field("geography",e.target.value)}/></>}
    {kind==="link"&&<><select value={form.questionId} onChange={e=>field("questionId",e.target.value)}>{workspace?.questions.map(q=><option value={q.id} key={q.id}>{q.prompt}</option>)}</select><select value={form.audienceId} onChange={e=>field("audienceId",e.target.value)}><option value="">Open audience</option>{workspace?.audiences.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select><div className="two-fields"><select value={form.channel} onChange={e=>field("channel",e.target.value)}>{["link","email","sms","social","partner","qr","embed","paid"].map(c=><option key={c}>{c}</option>)}</select><input placeholder="Link label" value={form.label||""} onChange={e=>field("label",e.target.value)}/></div></>}
    <div className="modal-actions"><button onClick={close}>Cancel</button><button className="continue" disabled={busy} onClick={save}>{busy?"Saving…":"Create →"}</button></div></div></div>
}
