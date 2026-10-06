import { creatorCookie } from "../../../lib/creator-cookie";
import { env } from "cloudflare:workers";
import { verifyAuthenticationResponse, verifyRegistrationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";

export const dynamic = "force-dynamic";

type ChallengeRow={challenge:string;ceremony:string;account_id:string|null;handle:string|null;rp_id:string;origin:string;expires_at:number};
const encode=(value:Uint8Array)=>btoa(String.fromCharCode(...value));
const decode=(value:string)=>Uint8Array.from(atob(value),character=>character.charCodeAt(0));


export async function POST(request:Request){
  const body=await request.json().catch(()=>null) as {mode?:string;challengeId?:string;response?:RegistrationResponseJSON|AuthenticationResponseJSON}|null;
  if(!body?.challengeId||!body.response)return Response.json({error:"Passkey response is incomplete."},{status:400});
  const challenge=await env.DB.prepare("SELECT * FROM creator_auth_challenges WHERE id=?").bind(body.challengeId).first<ChallengeRow>();
  if(!challenge||challenge.expires_at<Date.now()||challenge.ceremony!==body.mode)return Response.json({error:"That passkey request expired. Try again."},{status:400});
  try{
    if(body.mode==="register"&&challenge.account_id&&challenge.handle){
      const verification=await verifyRegistrationResponse({response:body.response as RegistrationResponseJSON,expectedChallenge:challenge.challenge,expectedOrigin:challenge.origin,expectedRPID:challenge.rp_id,requireUserVerification:true,supportedAlgorithmIDs:[-7,-257]});
      if(!verification.verified)return Response.json({error:"Passkey could not be verified."},{status:400});
      const credential=verification.registrationInfo.credential;const now=Date.now();
      await env.DB.batch([
        env.DB.prepare("INSERT INTO creator_accounts (id,handle,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET handle=excluded.handle,updated_at=excluded.updated_at").bind(challenge.account_id,challenge.handle,now,now),
        env.DB.prepare("INSERT INTO creator_passkeys (credential_id,account_id,public_key,counter,transports,device_type,backed_up,created_at) VALUES (?,?,?,?,?,?,?,?)")
          .bind(credential.id,challenge.account_id,encode(credential.publicKey),credential.counter,JSON.stringify(credential.transports||[]),verification.registrationInfo.credentialDeviceType,verification.registrationInfo.credentialBackedUp?1:0,now),
        env.DB.prepare("DELETE FROM creator_auth_challenges WHERE id=?").bind(body.challengeId),
      ]);
      return Response.json({verified:true,handle:challenge.handle},{headers:{"set-cookie":await creatorCookie(challenge.account_id)}});
    }
    if(body.mode==="authenticate"){
      const passkey=await env.DB.prepare("SELECT credential_id,account_id,public_key,counter,transports FROM creator_passkeys WHERE credential_id=?").bind(body.response.id).first<{credential_id:string;account_id:string;public_key:string;counter:number;transports:string}>();
      if(!passkey)return Response.json({error:"This passkey is not registered with Pollrr."},{status:404});
      const verification=await verifyAuthenticationResponse({response:body.response as AuthenticationResponseJSON,expectedChallenge:challenge.challenge,expectedOrigin:challenge.origin,expectedRPID:challenge.rp_id,credential:{id:passkey.credential_id,publicKey:decode(passkey.public_key),counter:passkey.counter,transports:JSON.parse(passkey.transports)},requireUserVerification:true});
      if(!verification.verified)return Response.json({error:"Passkey could not be verified."},{status:400});
      await env.DB.batch([
        env.DB.prepare("UPDATE creator_passkeys SET counter=? WHERE credential_id=?").bind(verification.authenticationInfo.newCounter,passkey.credential_id),
        env.DB.prepare("DELETE FROM creator_auth_challenges WHERE id=?").bind(body.challengeId),
      ]);
      return Response.json({verified:true},{headers:{"set-cookie":await creatorCookie(passkey.account_id)}});
    }
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Passkey failed."},{status:400})}
  return Response.json({error:"Invalid passkey request."},{status:400});
}
