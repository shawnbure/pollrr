import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic="force-dynamic";

type AiBinding={run:(model:string,input:object)=>Promise<unknown>};
type AiResponse={response?:unknown};
const MODEL="@cf/meta/llama-3.1-8b-instruct-fast";

async function access(){
  const user=await getChatGPTUser();
  if(!user)return null;
  const [platform,preference,membership]=await Promise.all([
    env.DB.prepare("SELECT role FROM platform_admins WHERE email=?").bind(user.email).first(),
    env.DB.prepare("SELECT ai_plan FROM creator_preferences WHERE email=?").bind(user.email).first<{ai_plan:string}>(),
    env.DB.prepare("SELECT organization_id FROM organization_members WHERE email=? AND status='active' ORDER BY created_at LIMIT 1").bind(user.email).first<{organization_id:string}>(),
  ]);
  return {email:user.email,organizationId:membership?.organization_id||"",allowed:Boolean(platform)||preference?.ai_plan==="pro"};
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
  if(!account.allowed)return Response.json({error:"Pollrr AI upgrade required.",upgradeRequired:true},{status:402});
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  const action=String(body?.action||"");
  const guard="You are Pollrr AI, a careful polling editor. Never invent responses. Avoid persuasion, partisan targeting, loaded framing, and false claims. Return only the requested JSON.";
  try{
    if(action==="create"){
      const idea=String(body?.idea||"").trim().slice(0,800);
      if(idea.length<3)return Response.json({error:"Describe what you want to ask."},{status:400});
      const result=await generate(guard,`Turn this idea into one clear, neutral, fast poll with two distinct choices: ${idea}`,schema({
        question:{type:"string"},optionA:{type:"string"},optionB:{type:"string"},topic:{type:"string"},
        tags:{type:"array",items:{type:"string"},maxItems:6},note:{type:"string"},
      },["question","optionA","optionB","topic","tags","note"]));
      return Response.json(result);
    }
    if(action==="review"){
      const result=await generate(guard,`Review this proposed poll for leading wording, ambiguity, false binaries, emotional loading, and answer balance. Question: ${body?.prompt}. Choice A: ${body?.optionA}. Choice B: ${body?.optionB}.`,schema({
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
      if(!poll)return Response.json({error:"Poll not found."},{status:404});
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
    return Response.json({error:"Unsupported AI action."},{status:400});
  }catch(error){
    return Response.json({error:error instanceof Error?error.message:"AI request failed."},{status:502});
  }
}
