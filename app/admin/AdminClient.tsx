"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Campaign = { id:string;name:string;objective?:string;status:string;polls:number;links:number;clicks:number };
type Audience = { id:string;name:string;description?:string;geography?:string;type:string;status:string;target_size?:number;consent_basis?:string;contacts:number;consented:number };
type Poll = { id:string;public_token:string;prompt:string;status:string;campaign_id:string;campaign_name:string;votes:number };
type LinkRow = { id:string;question_id:string;public_token:string;label:string;channel:string;token:string;clicks:number;responses:number;status:string;prompt:string;audience_name?:string };
type Workspace = { organization:{id:string;name:string;role:string};campaigns:Campaign[];audiences:Audience[];questions:Poll[];links:LinkRow[] };
type Member = { email:string;role:string;status:string;title?:string };
type Report = { id:string;name:string;description?:string;visibility:string;updated_at:number };
type Organization = { id:string;name:string;status:string;plan:string;contact_email?:string;members:number;campaigns:number;responses:number };
type PlatformPoll = { id:string;publicToken:string;prompt:string;optionA:string;optionB:string;status:string;topic:string;tags?:string;region:string;created_by?:string;organization_name:string;responses:number;created_at:number };
type Manage = {
  platform:boolean;organizations:Organization[];team:Member[];reports:Report[];
  platformPolls:PlatformPoll[];
  imports:{id:string;filename:string;accepted_count:number;duplicate_count:number;audience_name:string;created_at:number}[];
  audienceMetrics:Audience[];analytics:{channels:{channel:string;responses:number;links:number;opens:number}[];daily:{day:string;responses:number;trusted:number}[]};
  audits:{actor_email:string;action:string;resource_type:string;created_at:number}[];
};
type Overview = { totalResponses:number;integrity?:{total:number;trusted:number;flagged:number};ledger?:{snapshot_hash:string}|null };
type Modal = "campaign"|"poll"|"audience"|"link"|"member"|"organization"|"report"|"import"|null;

const baseSections = ["Overview","Polls","Intelligence","Integrity","Team"];
const publicPollOrigin=()=>location.hostname==="app.pollrr.com"?"https://pollrr.com":location.origin;

export default function AdminClient({ displayName }: { displayName:string }) {
  const [active,setActive]=useState("Overview");
  const [workspace,setWorkspace]=useState<Workspace|null>(null);
  const [manage,setManage]=useState<Manage|null>(null);
  const [overview,setOverview]=useState<Overview|null>(null);
  const [modal,setModal]=useState<Modal>(null);
  const [form,setForm]=useState<Record<string,string>>({});
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const [selectedOrganization,setSelectedOrganization]=useState("");

  const load=useCallback(async()=>{
    const query=selectedOrganization?`?organizationId=${encodeURIComponent(selectedOrganization)}`:"";
    const [w,m,o]=await Promise.all([
      fetch(`/api/admin/workspace${query}`,{cache:"no-store"}),
      fetch(`/api/admin/manage${query}`,{cache:"no-store"}),
      fetch(`/api/admin/overview${query}`,{cache:"no-store"}),
    ]);
    if(w.ok)setWorkspace(await w.json());
    if(m.ok){const next=await m.json() as Manage;setManage(next);if(next.platform)setActive(current=>current==="Overview"?"Platform":current)}
    if(o.ok)setOverview(await o.json());
  },[selectedOrganization]);
  useEffect(()=>{const timer=setTimeout(load,0);return()=>clearTimeout(timer)},[load]);

  const sections=manage===null?[]:manage.platform?["Platform","Polls","Intelligence","Integrity"]:baseSections;
  const navGroups=manage?.platform?[{label:"Control room",items:sections}]:[
    {label:"Workspace",items:sections.filter(item=>["Platform","Overview","Campaigns","Polls"].includes(item))},
    {label:"Evidence & analysis",items:sections.filter(item=>["Intelligence","Integrity"].includes(item))},
    {label:"Organization",items:sections.filter(item=>item==="Team")},
  ];
  const openModal=(kind:Modal,values:Record<string,string>={})=>{
    setForm({
      campaignId:workspace?.campaigns[0]?.id||"",questionId:workspace?.questions[0]?.id||"",
      audienceId:workspace?.audiences[0]?.id||"",channel:"email",type:"organic",status:"draft",
      role:"viewer",visibility:"workspace",plan:"pilot",...values,
    });setModal(kind);
  };
  const request=async(url:string,method:string,payload?:object)=>{
    setBusy(true);setNotice("");
    const scopedPayload=payload&&selectedOrganization?{...payload,organizationId:selectedOrganization}:payload;
    const response=await fetch(url,{method,headers:scopedPayload?{"content-type":"application/json"}:undefined,body:scopedPayload?JSON.stringify(scopedPayload):undefined});
    const data=await response.json().catch(()=>({})) as {error?:string;url?:string};
    setBusy(false);
    if(!response.ok){setNotice(data.error||"That action could not be completed.");return false}
    setModal(null);setForm({});setNotice("Saved.");await load();return true;
  };
  const create=async()=>{
    if(form.id&&modal==="organization")return request("/api/admin/manage","PATCH",{resource:"organization",...form,organizationId:form.id});
    if(form.id&&["campaign","audience"].includes(modal||""))return request("/api/admin/workspace","PATCH",{kind:modal,...form,organizationId:selectedOrganization});
    if(form.id&&modal==="poll")return request("/api/admin/questions","PATCH",{...form,id:form.id});
    if(modal==="poll")return request("/api/admin/questions","POST",{...form,campaignId:form.campaignId});
    if(["campaign","audience","link"].includes(modal||""))return request("/api/admin/workspace","POST",{kind:modal,...form,organizationId:selectedOrganization});
    return request("/api/admin/manage","POST",{kind:modal,...form,organizationId:selectedOrganization,confirmedConsent:form.confirmedConsent==="yes"});
  };
  const remove=(resource:string,id:string,endpoint="/api/admin/manage")=>{
    if(!confirm("Remove this record? Records with immutable history will be archived instead."))return;
    const org=selectedOrganization?`&organizationId=${encodeURIComponent(selectedOrganization)}`:"";
    request(`${endpoint}?${endpoint.includes("workspace")?"kind":"resource"}=${resource}&id=${encodeURIComponent(id)}${org}`,"DELETE");
  };
  const publish=(id:string,status:string)=>request("/api/admin/questions","PATCH",{id,status});
  const linkFor=(link:LinkRow)=>`${publicPollOrigin()}/p/${link.public_token}?src=${link.token}`;
  const shareLink=async(link:LinkRow)=>{
    const url=linkFor(link);const text=`Vote before you see the split: ${link.prompt}`;
    if(navigator.share)await navigator.share({title:"Pollrr",text,url}).catch(()=>{});
    else {await navigator.clipboard.writeText(`${text} ${url}`);setNotice("Share message copied.")}
  };
  const trusted=overview?.integrity?.total?Math.round(Number(overview.integrity.trusted)/Number(overview.integrity.total)*100):100;
  const responseRate=(link:LinkRow)=>link.clicks?Math.round(link.responses/link.clicks*100):0;

  return <main className="admin-shell modern-admin">
    <aside className="sidebar">
      <Link className="brand admin-brand" href="/"><span className="brand-mark">p</span><span>pollrr</span></Link>
      <div className="org-switch"><span className="org-swatch">{workspace?.organization.name?.slice(0,1)||"P"}</span><div><small>ACTIVE WORKSPACE</small><b>{workspace?.organization.name||"Loading…"}</b><span>{workspace?.organization.role||"member"}</span></div></div>
      <nav className="studio-nav">{navGroups.map(group=><div className="nav-group" key={group.label}><p>{group.label}</p>{group.items.map((item)=><button className={active===item?"active":""} onClick={()=>setActive(item)} key={item}><span className={`nav-marker marker-${item.toLowerCase()}`}/><span>{item}</span>{item==="Campaigns"&&<em>{workspace?.campaigns.length||0}</em>}</button>)}</div>)}</nav>
      {!manage?.platform&&<button className="sidebar-create" onClick={()=>openModal("poll")}><span>＋</span><div><b>Quick poll</b><small>Start a new question</small></div></button>}
      <div className="sidebar-bottom"><div className="admin-user"><span>{displayName.slice(0,2).toUpperCase()}</span><div><b>{displayName}</b><small>{manage?.platform?"Platform administrator":workspace?.organization.role||"Member"}</small></div></div></div>
    </aside>
    <section className="admin-main">
      <header className="admin-header"><div><p>{manage?.platform?"POLLRR CONTROL ROOM":workspace?.organization.name?.toUpperCase()||"POLLRR"}</p><h1>{active}</h1></div><div className="header-actions">{manage?.platform&&<Link className="creator-view-link" href="/studio">Creator view</Link>}<button onClick={()=>window.open("/","_blank")}>Voter view</button><button className="new-btn" onClick={()=>openModal(primaryAction(active))}>＋ {primaryLabel(active)}</button></div></header>
      {notice&&<div className="admin-notice">{notice}<button onClick={()=>setNotice("")}>×</button></div>}

      {active==="Overview"&&<>
        <div className="metric-grid admin-metrics">
          <Metric label="Active campaigns" value={workspace?.campaigns.filter(c=>c.status==="active").length||0} note={`${workspace?.campaigns.length||0} total`}/>
          <Metric label="Human responses" value={Number(overview?.totalResponses||0).toLocaleString()} note="Never blended with estimates"/>
          <Metric label="Reach" value={workspace?.links.reduce((n,l)=>n+Number(l.clicks),0)||0} note={`${workspace?.links.length||0} tracked paths`}/>
          <Metric label="Signal integrity" value={`${trusted}%`} note={`${overview?.integrity?.flagged||0} flagged for review`}/>
        </div>
        <div className="admin-grid">
          <article className="panel"><PanelHead title="Intelligence pipeline" sub="Design → sample → collect → verify → analyze"/><div className="workflow-strip">{["Campaign","Poll","Sample","Fieldwork","Evidence"].map((x,i)=><button key={x} onClick={()=>setActive(["Campaigns","Polls","Samples","Fieldwork","Integrity"][i])}><span>{i+1}</span><b>{x}</b></button>)}</div></article>
          <article className="panel launch-panel"><span>THE POLLRR MOAT</span><h2>Political opinion data with defensible provenance, continuous history, and auditable methodology.</h2><div><button onClick={()=>openModal("link")}>Start fieldwork</button><button onClick={()=>setActive("Intelligence")}>Open intelligence</button></div></article>
        </div>
        <ReportDashboard workspace={workspace} manage={manage} overview={overview}/>
      </>}

      {active==="Platform"&&<Platform organizations={manage?.organizations||[]} onCreate={()=>openModal("organization")} onOpen={(id)=>{setSelectedOrganization(id);setActive("Overview")}} onEdit={(o)=>openModal("organization",{...stringify(o),contactEmail:o.contact_email||""})} onRemove={(o)=>remove("organization",o.id)}/>}
      {active==="Polls"&&manage?.platform?<AllPolls polls={manage.platformPolls||[]} onEdit={(p)=>openModal("poll",stringify(p))} onStatus={publish} onRemove={(id)=>remove("question",id,"/api/admin/questions")}/>:active==="Polls"&&<Crud title="Poll library" subtitle="Questions, publishing state, response totals, and evidence" onCreate={()=>openModal("poll")}>
        {workspace?.questions.map(q=><div className="crud-row" key={q.id}><Status value={q.status}/><div><b>{q.prompt}</b><small>{q.campaign_name}</small></div><span>{q.votes} responses</span><a href={`/verify/${q.id}`}>Evidence</a><div className="row-actions">{q.status!=="live"&&<button onClick={()=>publish(q.id,"live")}>Publish</button>}{q.status==="live"&&<button onClick={()=>publish(q.id,"paused")}>Pause</button>}<button onClick={()=>window.open(`/p/${q.public_token}`,"_blank")}>Preview</button><button onClick={()=>remove("question",q.id,"/api/admin/questions")}>Delete</button></div></div>)}
      </Crud>}
      {active==="Samples"&&<Audiences audiences={workspace?.audiences||[]} imports={manage?.imports||[]} openModal={openModal} request={request} remove={remove}/>}
      {active==="Fieldwork"&&<Distribution links={workspace?.links||[]} linkFor={linkFor} shareLink={shareLink} responseRate={responseRate} openModal={openModal} request={request} remove={remove}/>}
      {active==="Intelligence"&&<Reports workspace={workspace} manage={manage} overview={overview} openModal={openModal} remove={remove}/>}
      {active==="Integrity"&&<Integrity workspace={workspace} overview={overview}/>}
      {active==="Team"&&<Team members={manage?.team||[]} openModal={openModal} request={request} remove={remove}/>}
    </section>
    {modal&&<EditorModal kind={modal} form={form} setForm={setForm} workspace={workspace} busy={busy} close={()=>setModal(null)} save={create}/>}
  </main>;
}

function primaryAction(active:string):Modal{return ({Platform:"organization",Campaigns:"campaign",Polls:"poll",Samples:"audience",Fieldwork:"link",Intelligence:"report",Team:"member"} as Record<string,Modal>)[active]||"campaign"}
function primaryLabel(active:string){return ({Platform:"New client",Campaigns:"New campaign",Polls:"New poll",Samples:"New sample",Fieldwork:"New collection",Intelligence:"New analysis",Team:"Invite member"} as Record<string,string>)[active]||"New campaign"}
function stringify(value:object){return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,String(v??"")]))}
function Metric({label,value,note}:{label:string;value:string|number;note:string}){return <article><div className="metric-top"><span>{label}</span><i>Live</i></div><b>{value}</b><small>{note}</small></article>}
function PanelHead({title,sub,action,onAction}:{title:string;sub:string;action?:string;onAction?:()=>void}){return <div className="panel-head"><div><h2>{title}</h2><p>{sub}</p></div>{action&&<button onClick={onAction}>{action} ＋</button>}</div>}
function Status({value}:{value:string}){return <span className={`status ${value}`}>{value}</span>}
function Crud({title,subtitle,onCreate,children}:{title:string;subtitle:string;onCreate:()=>void;children:React.ReactNode}){return <article className="panel workspace-panel"><PanelHead title={title} sub={subtitle} action="Create" onAction={onCreate}/><div className="workspace-list crud-list">{children}</div></article>}

function Platform({organizations,onCreate,onOpen,onEdit,onRemove}:{organizations:Organization[];onCreate:()=>void;onOpen:(id:string)=>void;onEdit:(o:Organization)=>void;onRemove:(o:Organization)=>void}){return <Crud title="Creator accounts" subtitle="Accounts, owners, plans, poll usage, and service status" onCreate={onCreate}>{organizations.map(o=><div className="crud-row client-row" key={o.id}><Status value={o.status}/><div><b>{o.name}</b><small>{o.contact_email||"No account email"} · {o.plan}</small></div><span>{o.members} users</span><span>{o.responses} responses</span><div className="row-actions"><button className="action-primary" onClick={()=>onOpen(o.id)}>Open</button><button onClick={()=>onEdit(o)}>Edit</button><button className="action-danger" onClick={()=>onRemove(o)}>Delete</button></div></div>)}</Crud>}

function AllPolls({polls,onEdit,onStatus,onRemove}:{polls:PlatformPoll[];onEdit:(p:PlatformPoll)=>void;onStatus:(id:string,status:string)=>void;onRemove:(id:string)=>void}){
  const [query,setQuery]=useState("");const [creator,setCreator]=useState("");const [topic,setTopic]=useState("");const [tag,setTag]=useState("");const [sort,setSort]=useState("newest");
  const creators=[...new Set(polls.map(p=>p.created_by||"Legacy creator"))].sort();
  const topics=[...new Set(polls.map(p=>p.topic||"General"))].sort();
  const tags=[...new Set(polls.flatMap(p=>(p.tags||"").split(",").filter(Boolean)))].sort();
  const filtered=polls.filter(p=>(!query||`${p.prompt} ${p.created_by} ${p.topic} ${p.tags}`.toLowerCase().includes(query.toLowerCase()))&&(!creator||(p.created_by||"Legacy creator")===creator)&&(!topic||(p.topic||"General")===topic)&&(!tag||(p.tags||"").split(",").includes(tag))).sort((a,b)=>sort==="responses"?Number(b.responses)-Number(a.responses):sort==="creator"?(a.created_by||"").localeCompare(b.created_by||""):sort==="topic"?(a.topic||"").localeCompare(b.topic||""):Number(b.created_at)-Number(a.created_at));
  const copy=async(publicToken:string)=>{const url=new URL(`/p/${publicToken}`,publicPollOrigin());await navigator.clipboard.writeText(url.toString())};
  return <article className="panel workspace-panel"><PanelHead title="All creator polls" sub="Every poll across every free creator account"/><div className="poll-filters"><input aria-label="Search polls" placeholder="Search polls, creators, topics or tags…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filter creator" value={creator} onChange={e=>setCreator(e.target.value)}><option value="">All creators</option>{creators.map(x=><option key={x}>{x}</option>)}</select><select aria-label="Filter topic" value={topic} onChange={e=>setTopic(e.target.value)}><option value="">All topics</option>{topics.map(x=><option key={x}>{x}</option>)}</select><select aria-label="Filter tag" value={tag} onChange={e=>setTag(e.target.value)}><option value="">All tags</option>{tags.map(x=><option key={x}>{x}</option>)}</select><select aria-label="Sort polls" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest</option><option value="responses">Most responses</option><option value="creator">Creator</option><option value="topic">Topic</option></select></div><p className="filter-count">{filtered.length} of {polls.length} polls</p><div className="global-polls">{filtered.map(p=><article key={p.id}><Status value={p.status}/><div><small>{p.organization_name} · {p.created_by||"Legacy creator"}</small><h2>{p.prompt}</h2><p>{p.topic||"General"}{p.tags?` · ${p.tags.split(",").map(x=>`#${x}`).join(" ")}`:""} · {new Date(p.created_at).toLocaleDateString()}</p></div><strong>{p.responses}<span>responses</span></strong><div className="row-actions"><button className="action-primary" onClick={()=>window.open(`/p/${p.publicToken}`,"_blank")}>Open</button><button onClick={()=>copy(p.publicToken)}>Copy</button><button onClick={()=>onEdit(p)}>Edit</button><button onClick={()=>onStatus(p.id,p.status==="live"?"paused":"live")}>{p.status==="live"?"Pause":"Publish"}</button><button onClick={()=>window.open(`/verify/${p.id}`,"_blank")}>Evidence</button><button className="action-danger" onClick={()=>onRemove(p.id)}>Delete</button></div></article>)}</div></article>
}

function Audiences({audiences,imports,openModal,request,remove}:{audiences:Audience[];imports:Manage["imports"];openModal:(m:Modal,v?:Record<string,string>)=>void;request:(u:string,m:string,p?:object)=>Promise<boolean>;remove:(r:string,id:string,e?:string)=>void}){
  return <div className="stack"><article className="panel audience-principle"><span>SAMPLE OPERATIONS</span><h2>Define the electorate you intend to measure—and prove how the sample was built.</h2><p>Sample frames combine geography, demographics, voter-file or panel sources, quotas, recruitment method, and response targets. Contact records remain encrypted and structurally separated from individual opinion records.</p></article><article className="panel workspace-panel"><PanelHead title="Sample frames" sub="Voter-file, panel, geographic, partner, organic, and owned-list cohorts" action="New sample" onAction={()=>openModal("audience")}/><div className="workspace-list">{audiences.map(a=><div className="crud-row audience-full" key={a.id}><Status value={a.status}/><div><b>{a.name}</b><small>{a.type} · {a.geography||"Any geography"} · {a.description||"Population not documented"}</small></div><span>{a.contacts||0} records</span><span>n={a.target_size||"—"}</span><div className="row-actions"><button onClick={()=>openModal("import",{audienceId:a.id})}>Add records</button><button onClick={()=>openModal("audience",stringify(a))}>Edit</button><button onClick={()=>request("/api/admin/workspace","PATCH",{kind:"audience",...a,status:"archived"})}>Archive</button><button onClick={()=>remove("audience",a.id,"/api/admin/workspace")}>Delete</button></div></div>)}</div></article><article className="panel"><PanelHead title="Sample imports" sub="Encrypted, deduplicated, and separated from individual opinion records"/><div className="workspace-list">{imports.length?imports.map(i=><div className="simple-row" key={i.id}><div><b>{i.filename}</b><small>{i.audience_name}</small></div><span>{i.accepted_count} accepted</span><span>{i.duplicate_count} duplicates</span><time>{new Date(i.created_at).toLocaleDateString()}</time></div>):<p className="empty-note">No sample records imported.</p>}</div></article></div>
}

function Distribution({links,linkFor,shareLink,responseRate,openModal,request,remove}:{links:LinkRow[];linkFor:(l:LinkRow)=>string;shareLink:(l:LinkRow)=>void;responseRate:(l:LinkRow)=>number;openModal:(m:Modal)=>void;request:(u:string,m:string,p?:object)=>Promise<boolean>;remove:(r:string,id:string,e?:string)=>void}){
  return <div className="stack"><article className="panel distribution-hero"><span>FIELDWORK CONTROL</span><h2>Collect political opinion across every recruitment source with one defensible chain of custody.</h2><p>Email, SMS, panels, voter-file outreach, field organizers, partners, publishers, paid media, and social recruitment all produce source-specific collection paths and comparable quality metrics.</p><div className="distribution-actions"><button onClick={()=>openModal("link")}>Create collection path</button><button onClick={()=>window.print()}>Export field kit</button></div></article><div className="channel-focus"><article><span>01</span><div><b>Direct recruitment</b><small>Email, SMS, voter-file and opted-in panel outreach</small></div><strong>Known denominator</strong></article><article><span>02</span><div><b>Managed fieldwork</b><small>Panels, organizers, events, partners, and geographic quotas</small></div><strong>Quota controlled</strong></article><article><span>03</span><div><b>Open recruitment</b><small>Publishers, social, creators, QR, embeds, and paid media</small></div><strong>Source labeled</strong></article></div>
  <Crud title="Collection paths" subtitle="One poll, sample, recruitment method, placement, denominator, and source token" onCreate={()=>openModal("link")}>{links.map(l=><div className="crud-row distribution-full" key={l.id}><span className="channel-pill">{l.channel}</span><div><b>{l.label}</b><small>{l.prompt} · {l.audience_name||"Open sample"}</small></div><span>{l.clicks} reached</span><span>{l.responses} completes</span><b>{responseRate(l)}%</b><div className="row-actions"><button onClick={()=>navigator.clipboard.writeText(linkFor(l))}>Copy link</button><button onClick={()=>shareLink(l)}>Copy invite</button><button onClick={()=>request("/api/admin/workspace","PATCH",{kind:"link",...l,status:l.status==="active"?"paused":"active"})}>{l.status==="active"?"Pause":"Activate"}</button><button onClick={()=>remove("link",l.id,"/api/admin/workspace")}>Delete</button></div></div>)}</Crud></div>
}

function ReportDashboard({workspace,manage,overview}:{workspace:Workspace|null;manage:Manage|null;overview:Overview|null}){
  const daily=[...(manage?.analytics.daily||[])].reverse();const max=Math.max(1,...daily.map(d=>Number(d.responses)));
  return <div className="report-grid"><article className="panel"><PanelHead title="Response trend" sub="Verified human responses by day"/><div className="bar-chart">{daily.length?daily.map(d=><div key={d.day} title={`${d.day}: ${d.responses}`}><i style={{height:`${Math.max(8,Number(d.responses)/max*100)}%`}}/><small>{d.day.slice(5)}</small></div>):<p>No responses in this period.</p>}</div></article><article className="panel"><PanelHead title="Channel performance" sub="Reach and response contribution"/><div className="channel-table">{manage?.analytics.channels.map(c=><div key={c.channel}><b>{c.channel}</b><span>{c.opens||0} opens</span><span>{c.responses} responses</span></div>)}</div></article><article className="panel evidence-card"><span>PUBLIC EVIDENCE</span><b>{overview?.ledger?.snapshot_hash?.slice(0,18)||"Awaiting first snapshot"}…</b><small>Latest signed aggregate commitment</small><a href={workspace?.questions[0]?`/verify/${workspace.questions[0].id}`:"/methodology"}>Open verification center →</a></article></div>
}

function Reports({workspace,manage,overview,openModal,remove}:{workspace:Workspace|null;manage:Manage|null;overview:Overview|null;openModal:(m:Modal)=>void;remove:(r:string,id:string)=>void}){return <div className="stack"><ReportDashboard workspace={workspace} manage={manage} overview={overview}/><article className="panel"><PanelHead title="Saved reports" sub="Reusable client views with documented filters and methodology" action="Save report" onAction={()=>openModal("report")}/><div className="workspace-list">{manage?.reports.map(r=><div className="simple-row" key={r.id}><div><b>{r.name}</b><small>{r.description||"No description"} · {r.visibility}</small></div><time>{new Date(r.updated_at).toLocaleDateString()}</time><button onClick={()=>remove("report",r.id)}>Delete</button></div>)}</div></article><article className="panel"><PanelHead title="Poll drill-down" sub="Results, qualitative reasons, common ground, longitudinal snapshots, and proofs"/><div className="workspace-list">{workspace?.questions.map(q=><div className="simple-row" key={q.id}><div><b>{q.prompt}</b><small>{q.campaign_name} · {q.votes} responses</small></div><a href={`/api/insights/${q.id}`}>Aggregate data</a><a href={`/verify/${q.id}`}>Evidence page</a></div>)}</div></article></div>}

function Integrity({workspace,overview}:{workspace:Workspace|null;overview:Overview|null}){return <div className="stack"><article className="panel feature-workspace"><span>TRUST CENTER</span><h2>Auditable by design.</h2><p>Votes remain append-only. Public snapshots prove aggregate integrity without exposing respondent identities or monetizable row-level data.</p><div className="feature-kpis"><div><b>{overview?.integrity?.trusted||0}</b><small>trusted events</small></div><div><b>{overview?.integrity?.flagged||0}</b><small>flagged, never silently erased</small></div><div><b>0</b><small>synthetic votes</small></div></div></article><article className="panel"><PanelHead title="Published evidence" sub="Methodology, signed snapshots, and reproducible aggregates"/><div className="workspace-list">{workspace?.questions.map(q=><div className="simple-row" key={q.id}><div><b>{q.prompt}</b><small>{q.votes} immutable human responses</small></div><a href={`/verify/${q.id}`}>Verify</a><a href={`/api/ledger/${q.id}`}>Manifest</a></div>)}</div><div className="trust-links"><a href="/methodology">Published methodology</a><a href="/privacy">Privacy and contact separation</a></div></article></div>}

function Team({members,openModal,request,remove}:{members:Member[];openModal:(m:Modal)=>void;request:(u:string,m:string,p?:object)=>Promise<boolean>;remove:(r:string,id:string)=>void}){return <Crud title="Team and access" subtitle="Organization-scoped roles and invitation status" onCreate={()=>openModal("member")}>{members.map(m=><div className="crud-row team-row" key={m.email}><span className="avatar">{m.email.slice(0,2).toUpperCase()}</span><div><b>{m.email}</b><small>{m.title||"Team member"}</small></div><Status value={m.status}/><select value={m.role} onChange={e=>request("/api/admin/manage","PATCH",{resource:"member",id:m.email,role:e.target.value,status:m.status})}>{["owner","admin","analyst","editor","viewer"].map(r=><option key={r}>{r}</option>)}</select><button onClick={()=>remove("member",m.email)}>Remove</button></div>)}</Crud>}

function EditorModal({kind,form,setForm,workspace,busy,close,save}:{kind:Exclude<Modal,null>;form:Record<string,string>;setForm:(v:Record<string,string>)=>void;workspace:Workspace|null;busy:boolean;close:()=>void;save:()=>void}){
  const field=(key:string,value:string)=>setForm({...form,[key]:value});
  const file=async(e:React.ChangeEvent<HTMLInputElement>)=>{const selected=e.target.files?.[0];if(selected)setForm({...form,filename:selected.name,csv:await selected.text()})};
  return <div className="modal-backdrop" onMouseDown={close}><div className="question-modal admin-editor" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={close}>×</button><span className="modal-step">{form.id?"EDIT":"NEW"} {kind.toUpperCase()}</span><h2>{modalTitle(kind)}</h2>
    {kind==="organization"&&<><input placeholder="Creator account" value={form.name||""} onChange={e=>field("name",e.target.value)}/><input type="email" placeholder="Owner email" value={form.contactEmail||""} onChange={e=>field("contactEmail",e.target.value)}/><div className="choice-cards">{["free","pilot","professional","enterprise"].map(x=><button type="button" className={form.plan===x?"selected":""} onClick={()=>field("plan",x)} key={x}>{x}</button>)}</div>{form.id&&<select value={form.status||"active"} onChange={e=>field("status",e.target.value)}><option value="active">Active</option><option value="archived">Archived</option></select>}</>}
    {kind==="campaign"&&<><input placeholder="Campaign name" value={form.name||""} onChange={e=>field("name",e.target.value)}/><textarea placeholder="Decision this campaign should inform" value={form.objective||""} onChange={e=>field("objective",e.target.value)}/>{form.id&&<select value={form.status} onChange={e=>field("status",e.target.value)}>{["draft","active","paused","archived"].map(x=><option key={x}>{x}</option>)}</select>}</>}
    {kind==="poll"&&<>{!form.id&&<select value={form.campaignId} onChange={e=>field("campaignId",e.target.value)}>{workspace?.campaigns.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select>}<textarea placeholder="Ask one neutral question" value={form.prompt||""} onChange={e=>field("prompt",e.target.value)}/><div className="two-fields"><input placeholder="Option A" value={form.optionA||""} onChange={e=>field("optionA",e.target.value)}/><input placeholder="Option B" value={form.optionB||""} onChange={e=>field("optionB",e.target.value)}/></div><div className="two-fields"><input placeholder="Topic" value={form.topic||""} onChange={e=>field("topic",e.target.value)}/><input placeholder="Region" value={form.region||""} onChange={e=>field("region",e.target.value)}/></div></>}
    {kind==="audience"&&<><input placeholder="Sample name" value={form.name||""} onChange={e=>field("name",e.target.value)}/><div className="two-fields"><select value={form.type} onChange={e=>field("type",e.target.value)}>{["voter_file","panel","geographic","partner","owned_list","organic"].map(x=><option key={x}>{x}</option>)}</select><input type="number" placeholder="Target completes" value={form.target_size||form.targetSize||""} onChange={e=>field("targetSize",e.target.value)}/></div><textarea placeholder="Target population, quotas, and inclusion criteria" value={form.description||""} onChange={e=>field("description",e.target.value)}/><input placeholder="Geography" value={form.geography||""} onChange={e=>field("geography",e.target.value)}/><textarea placeholder="Recruitment source and permission basis" value={form.consent_basis||form.consentBasis||""} onChange={e=>field("consentBasis",e.target.value)}/></>}
    {kind==="link"&&<><label>Poll<select value={form.questionId} onChange={e=>field("questionId",e.target.value)}>{workspace?.questions.map(q=><option value={q.id} key={q.id}>{q.prompt}</option>)}</select></label><label>Sample<select value={form.audienceId} onChange={e=>field("audienceId",e.target.value)}><option value="">Open sample</option>{workspace?.audiences.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label><label>Recruitment channel</label><div className="choice-cards channel-choices">{["email","sms","panel","voter_file","organizer","partner","publisher","social","paid","qr","embed","event"].map(c=><button type="button" className={form.channel===c?"selected":""} onClick={()=>field("channel",c)} key={c}>{c}</button>)}</div><input placeholder="Vendor, placement, list, or source label" value={form.label||""} onChange={e=>field("label",e.target.value)}/></>}
    {kind==="member"&&<><input type="email" placeholder="Team member email" value={form.email||""} onChange={e=>field("email",e.target.value)}/><input placeholder="Title (optional)" value={form.title||""} onChange={e=>field("title",e.target.value)}/><select value={form.role} onChange={e=>field("role",e.target.value)}>{["admin","analyst","editor","viewer"].map(r=><option key={r}>{r}</option>)}</select></>}
    {kind==="report"&&<><input placeholder="Report name" value={form.name||""} onChange={e=>field("name",e.target.value)}/><textarea placeholder="What decision should this report support?" value={form.description||""} onChange={e=>field("description",e.target.value)}/><select value={form.campaignId} onChange={e=>field("campaignId",e.target.value)}><option value="">All campaigns</option>{workspace?.campaigns.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select><select value={form.visibility} onChange={e=>field("visibility",e.target.value)}>{["workspace","private","public_evidence"].map(x=><option key={x}>{x}</option>)}</select></>}
    {kind==="import"&&<><label>Audience<select value={form.audienceId} onChange={e=>field("audienceId",e.target.value)}>{workspace?.audiences.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label><label className="file-drop">Choose a CSV<input type="file" accept=".csv,text/csv" onChange={file}/><small>Use an email, phone, or contact column. first_name is optional.</small></label><textarea placeholder="Or paste CSV rows here" value={form.csv||""} onChange={e=>field("csv",e.target.value)}/><textarea placeholder="How did this audience give permission to receive outreach?" value={form.consentText||""} onChange={e=>field("consentText",e.target.value)}/><label className="consent-check"><input type="checkbox" checked={form.confirmedConsent==="yes"} onChange={e=>field("confirmedConsent",e.target.checked?"yes":"no")}/> Mark these contacts ready for outreach. Leave unchecked to import them as pending.</label></>}
    <div className="modal-actions"><button onClick={close}>Cancel</button><button className="continue" disabled={busy} onClick={save}>{busy?"Saving…":"Save →"}</button></div>
  </div></div>
}
function modalTitle(kind:string){return ({organization:"Client details",campaign:"Create a campaign",poll:"Create a poll",audience:"Define a sample",link:"Create a collection path",member:"Invite a team member",report:"Save an analysis",import:"Add sample records"} as Record<string,string>)[kind]}
