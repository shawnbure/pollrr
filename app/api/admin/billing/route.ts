import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { encryptBillingSecret, stripeConfig, type BillingMode } from "../../../lib/billing-config";
export const dynamic="force-dynamic";
async function admin(){const user=await getChatGPTUser();if(!user)return null;const row=await env.DB.prepare("SELECT role FROM platform_admins WHERE email=?").bind(user.email).first();return row?user:null}
function readiness(config:Awaited<ReturnType<typeof stripeConfig>>){return {publishableKey:Boolean(config.publishable),apiKey:Boolean(config.key),proPrice:Boolean(config.pro),studioPrice:Boolean(config.studio),webhook:Boolean(config.webhook),restrictedKey:Boolean(config.key?.startsWith("rk_"))}}
function valid(mode:BillingMode,field:string,value:string){if(field==="publishable")return value.startsWith(mode==="test"?"pk_test_":"pk_live_");if(field==="apiKey")return value.startsWith(mode==="test"?"rk_test_":"rk_live_")||value.startsWith(mode==="test"?"sk_test_":"sk_live_");if(field==="webhook")return value.startsWith("whsec_");return value.startsWith("price_")}
export async function GET(){if(!await admin())return Response.json({error:"Unauthorized"},{status:401});const [runtime,test,live]=await Promise.all([env.DB.prepare("SELECT mode,updated_by,updated_at FROM billing_runtime_config WHERE id=1").first<{mode:BillingMode;updated_by:string;updated_at:number}>(),stripeConfig("test"),stripeConfig("live")]);return Response.json({mode:runtime?.mode||"test",updatedBy:runtime?.updated_by,updatedAt:runtime?.updated_at,test:readiness(test),live:readiness(live)})}
export async function POST(request:Request){
 const user=await admin();
 if(!user)return Response.json({error:"Unauthorized"},{status:401});
 const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
 if(!body||typeof body!=="object"||Array.isArray(body))return Response.json({error:"Invalid settings."},{status:400});
 const fields=[['PublishableKey','publishable','publishable_key_ciphertext'],['ApiKey','apiKey','api_key_ciphertext'],['ProPrice','pro','pro_price_ciphertext'],['StudioPrice','studio','studio_price_ciphertext'],['WebhookSecret','webhook','webhook_secret_ciphertext']] as const;
 const changes: {mode:BillingMode;column:string;value:string}[]=[];
 for(const mode of ["test","live"] as const){
  for(const [suffix,field,column] of fields){
   const input=body[`${mode}${suffix}`];
   if(input===undefined)continue;
   if(typeof input!=="string")return Response.json({error:"Invalid settings."},{status:400});
   const value=input.trim();
   if(!value)continue;
   if(!valid(mode,field,value))return Response.json({error:`The ${mode} ${field} value has an unexpected Stripe format.`},{status:400});
   changes.push({mode,column,value});
  }
 }
 if(!changes.length)return Response.json({saved:true,changed:false});
 const statements=[];
 for(const {mode,column,value} of changes){
  // Columns come only from the fixed allowlist above. Never decrypt or rewrite untouched fields.
  statements.push(env.DB.prepare(`INSERT INTO billing_credentials (mode,${column},updated_by,updated_at) VALUES (?,?,?,?) ON CONFLICT(mode) DO UPDATE SET ${column}=excluded.${column},updated_by=excluded.updated_by,updated_at=excluded.updated_at`).bind(mode,await encryptBillingSecret(value),user.email,Date.now()));
 }
 await env.DB.batch(statements);
 return Response.json({saved:true,changed:true});
}
export async function PATCH(request:Request){const user=await admin();if(!user)return Response.json({error:"Unauthorized"},{status:401});const body=await request.json().catch(()=>null) as {mode?:BillingMode}|null;if(!body||!["test","live"].includes(body.mode||""))return Response.json({error:"Choose test or live mode."},{status:400});const ready=readiness(await stripeConfig(body.mode!));if(!ready.apiKey||!ready.proPrice||!ready.studioPrice||!ready.webhook)return Response.json({error:`${body.mode} billing is not fully configured.`},{status:409});await env.DB.prepare("INSERT INTO billing_runtime_config (id,mode,updated_by,updated_at) VALUES (1,?,?,?) ON CONFLICT(id) DO UPDATE SET mode=excluded.mode,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(body.mode,user.email,Date.now()).run();return Response.json({mode:body.mode})}
