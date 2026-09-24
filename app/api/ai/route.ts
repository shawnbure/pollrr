import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic="force-dynamic";

type AiBinding={run:(model:string,input:object)=>Promise<unknown>};
type AiResponse={response?:unknown};
const MODEL="@cf/meta/llama-3.1-8b-instruct-fast";
const FREE_ACTIONS_PER_MONTH=10;

function usagePeriod(){
  return new Date().toISOString().slice(0,7);
}

async function access(){
  const user=await getChatGPTUser();
  if(!user)return null;
  const period=usagePeriod();
  const [platform,preference,membership,usage]=await Promise.all([
    env.DB.prepare("SELECT role FROM platform_admins WHERE email=?").bind(user.email).first(),
    env.DB.prepare("SELECT ai_plan FROM creator_preferences WHERE email=?").bind(user.email).first<{ai_plan:string}>(),
    env.DB.prepare("SELECT organization_id FROM organization_members WHERE email=? AND status='active' ORDER BY created_at LIMIT 1").bind(user.email).first<{organization_id:string}>(),
    env.DB.prepare("SELECT actions FROM creator_ai_usage WHERE email=? AND period=?").bind(user.email,period).first<{actions:number}>(),
  ]);
  const plan=preference?.ai_plan||"free";
  return {
    email:user.email,
    organizationId:membership?.organization_id||"",
    period,
    plan,
    unlimited:Boolean(platform)||plan==="pro",
    used:Number(usage?.actions||0),
  };
}

async function consumeCredit(account:NonNullable<Awaited<ReturnType<typeof access>>>){
  if(account.unlimited)return true;
  const result=await env.DB.prepare(
    `INSERT INTO creator_ai_usage (email,period,actions,updated_at)
     VALUES (?,?,1,?)
     ON CONFLICT(email,period) DO UPDATE SET
       actions=creator_ai_usage.actions+1,
       updated_at=excluded.updated_at
     WHERE creator_ai_usage.actions<?
     RETURNING actions`,
  ).bind(account.email,account.period,Date.now(),FREE_ACTIONS_PER_MONTH).first<{actions:number}>();
  return Boolean(result);
}

async function refundCredit(account:NonNullable<Awaited<ReturnType<typeof access>>>){
  if(account.unlimited)return;
  await env.DB.prepare(
    "UPDATE creator_ai_usage SET actions=MAX(0,actions-1),updated_at=? WHERE email=? AND period=?",
  ).bind(Date.now(),account.email,account.period).run();
}

function schema(properties:Record<string,object>,required:string[]){
  return {type:"json_schema",json_schema:{type:"object",properties,required,additionalProperties:false}};
}

async function generate(system:string,user:string,responseFormat:object){
  const ai=(env as typeof env&{AI:AiBinding}).AI;
  if(!ai)throw new Error("AI binding unavailable");
  const raw=await ai.run(MODEL,{messages:[{role:"system",content:system},{role:"user",content:user}],response_format:responseFormat,max_tokens:900,temperature:.35}) as AiResponse;
  if(typeof raw.response==="string")return JSON.parse(raw.response);
  return raw.response;
}

export async function POST(request:Request){
  const account=await access();
  if(!account)return Response.json({error:"Unauthorized"},{status:401});
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  const action=String(body?.action||"");
  const guard="You are Pollrr AI, a careful polling editor. Never invent responses. Avoid persuasion, partisan targeting, loaded framing, and false claims. Return only the requested JSON.";
  if(!["create","review","ideas","summary"].includes(action)){
    return Response.json({error:"Unsupported AI action."},{status:400});
  }
  if(!await consumeCredit(account)){
    return Response.json({
      error:`You used all ${FREE_ACTIONS_PER_MONTH} free AI actions for ${account.period}. Join the AI launch list for paid access.`,
      upgradeRequired:true,
      remaining:0,
    },{status:402});
  }
  try{
    if(action==="create"){
      const idea=String(body?.idea||"").trim().slice(0,800);
      if(idea.length<3){
        await refundCredit(account);
        return Response.json({error:"Describe what you want to ask."},{status:400});
      }
      const result=await generate(guard,`Turn this idea into one clear, neutral, fast poll with two distinct choices: ${idea}`,schema({
        question:{type:"string"},optionA:{type:"string"},optionB:{type:"string"},topic:{type:"string"},
        tags:{type:"array",items:{type:"string"},maxItems:6},note:{type:"string"},
      },["question","optionA","optionB","topic","tags","note"]));
      return Response.json(result);
    }
    if(action==="review"){
      const result=await generate(guard,`Score this proposed poll from 0 to 100 for neutral, clear measurement. Use this rubric: 90-100 is neutral and publication-ready; 75-89 has only minor issues; 50-74 needs revision; 1-49 is substantially biased or unclear; 0 is reserved only for an unusable or overtly manipulative poll. Review leading wording, ambiguity, false binaries, emotional loading, and answer balance. Return short, specific issue labels only, and make the verdict consistent with the numeric score. Question: ${body?.prompt}. Choice A: ${body?.optionA}. Choice B: ${body?.optionB}.`,schema({
        score:{type:"integer",minimum:0,maximum:100},issues:{type:"array",items:{type:"string"},maxItems:5},
        neutralRewrite:{type:"string"},optionA:{type:"string"},optionB:{type:"string"},verdict:{type:"string"},
      },["score","issues","neutralRewrite","optionA","optionB","verdict"]));
      return Response.json(result);
    }
    if(action==="ideas"){
      const history=account.organizationId?await env.DB.prepare(
        "SELECT prompt,topic,tags FROM questions WHERE organization_id=? ORDER BY created_at DESC LIMIT 20",
      ).bind(account.organizationId).all():{results:[]};
      const result=await generate(guard,`Based on this creator's poll history, suggest useful, non-duplicative follow-up polls and high-level themes. History: ${JSON.stringify(history.results)}`,schema({
        followUps:{type:"array",items:{type:"string"},minItems:3,maxItems:6},
        themes:{type:"array",items:{type:"string"},minItems:2,maxItems:6},
      },["followUps","themes"]));
      return Response.json(result);
    }
    if(action==="summary"){
      const questionId=String(body?.questionId||"");
      const poll=await env.DB.prepare(
        `SELECT q.id,q.prompt,q.option_a,q.option_b,q.topic,COUNT(v.id) total,
          SUM(CASE WHEN v.choice='a' THEN 1 ELSE 0 END) count_a,
          SUM(CASE WHEN v.choice='b' THEN 1 ELSE 0 END) count_b
         FROM questions q LEFT JOIN votes v ON v.question_id=q.id
         WHERE q.id=? AND q.organization_id=? GROUP BY q.id`,
      ).bind(questionId,account.organizationId).first();
      if(!poll){
        await refundCredit(account);
        return Response.json({error:"Poll not found."},{status:404});
      }
      const reasons=await env.DB.prepare(
        `SELECT qr.label,COUNT(e.id) mentions FROM question_reasons qr
         LEFT JOIN explanations e ON e.reason_id=qr.id WHERE qr.question_id=?
         GROUP BY qr.id ORDER BY mentions DESC LIMIT 8`,
      ).bind(questionId).all();
      const result=await generate(guard,`Summarize only these verified aggregate human results. Explicitly state the sample size and avoid claiming representativeness. Poll: ${JSON.stringify(poll)}. Optional explanation themes: ${JSON.stringify(reasons.results)}`,schema({
        headline:{type:"string"},summary:{type:"string"},insights:{type:"array",items:{type:"string"},maxItems:4},
        explanationThemes:{type:"array",items:{type:"string"},maxItems:5},
        facebook:{type:"string"},instagram:{type:"string"},tiktok:{type:"string"},
      },["headline","summary","insights","explanationThemes","facebook","instagram","tiktok"]));
      return Response.json(result);
    }
  }catch(error){
    await refundCredit(account);
    return Response.json({error:error instanceof Error?error.message:"AI request failed."},{status:502});
  }
}
