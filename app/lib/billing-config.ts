import { env } from "cloudflare:workers";

export type BillingMode="test"|"live";
export type StripeConfig={mode:BillingMode;publishable?:string;key?:string;pro?:string;studio?:string;webhook?:string};
type BillingEnv={BILLING_VAULT_KEY?:string;STRIPE_TEST_RESTRICTED_KEY?:string;STRIPE_TEST_PRICE_PRO?:string;STRIPE_TEST_PRICE_STUDIO?:string;STRIPE_TEST_WEBHOOK_SECRET?:string;STRIPE_LIVE_RESTRICTED_KEY?:string;STRIPE_LIVE_PRICE_PRO?:string;STRIPE_LIVE_PRICE_STUDIO?:string;STRIPE_LIVE_WEBHOOK_SECRET?:string};
type VaultRow={publishable_key_ciphertext:string|null;api_key_ciphertext:string|null;pro_price_ciphertext:string|null;studio_price_ciphertext:string|null;webhook_secret_ciphertext:string|null};

function bytes(value:string){return Uint8Array.from(atob(value),c=>c.charCodeAt(0))}
function base64(value:Uint8Array){let out="";for(const byte of value)out+=String.fromCharCode(byte);return btoa(out)}
async function vaultKey(){const secret=(env as typeof env&BillingEnv).BILLING_VAULT_KEY;if(!secret)throw new Error("Billing vault is not configured.");return crypto.subtle.importKey("raw",bytes(secret),"AES-GCM",false,["encrypt","decrypt"])}
export async function encryptBillingSecret(value:string){const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},await vaultKey(),new TextEncoder().encode(value));return `${base64(iv)}.${base64(new Uint8Array(cipher))}`}
export async function decryptBillingSecret(value?:string|null){if(!value)return undefined;const [iv,cipher]=value.split(".");if(!iv||!cipher)return undefined;try{const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes(iv)},await vaultKey(),bytes(cipher));return new TextDecoder().decode(plain)}catch{return undefined}}
export async function stripeConfig(mode:BillingMode):Promise<StripeConfig>{
 const e=env as typeof env&BillingEnv;const row=await env.DB.prepare("SELECT publishable_key_ciphertext,api_key_ciphertext,pro_price_ciphertext,studio_price_ciphertext,webhook_secret_ciphertext FROM billing_credentials WHERE mode=?").bind(mode).first<VaultRow>();
 const fallback=mode==="live"?{key:e.STRIPE_LIVE_RESTRICTED_KEY,pro:e.STRIPE_LIVE_PRICE_PRO,studio:e.STRIPE_LIVE_PRICE_STUDIO,webhook:e.STRIPE_LIVE_WEBHOOK_SECRET}:{key:e.STRIPE_TEST_RESTRICTED_KEY,pro:e.STRIPE_TEST_PRICE_PRO,studio:e.STRIPE_TEST_PRICE_STUDIO,webhook:e.STRIPE_TEST_WEBHOOK_SECRET};
 if(!row)return {mode,...fallback};return {mode,publishable:await decryptBillingSecret(row.publishable_key_ciphertext),key:await decryptBillingSecret(row.api_key_ciphertext)||fallback.key,pro:await decryptBillingSecret(row.pro_price_ciphertext)||fallback.pro,studio:await decryptBillingSecret(row.studio_price_ciphertext)||fallback.studio,webhook:await decryptBillingSecret(row.webhook_secret_ciphertext)||fallback.webhook};
}
export async function activeStripeConfig(){const row=await env.DB.prepare("SELECT mode FROM billing_runtime_config WHERE id=1").first<{mode:BillingMode}>();return stripeConfig(row?.mode||"test")}
