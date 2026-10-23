import { env } from "cloudflare:workers";
import { z } from "zod";
import { allRecords, ApiError, body, db, errorResponse, identity, insertServer, json, record, writeServer } from "@/lib/server";
import { bogotaDay, completedDays, emptySettings, now, proposalSlots } from "@/lib/domain";
import { CATALOG } from "@/lib/catalog";
import type { Cycle, Proposal, Routine, Session, Settings } from "@/lib/types";
import { validateRecommendations } from "@/lib/recommendations";
import { generateChoices, GeminiError } from "@/lib/gemini";
export async function POST(request:Request){
 let owner:string|undefined,reserved:{proposal:Proposal;revision:number}|undefined;
 try{
  owner=await identity(request);
  const input=z.object({cycleId:z.string(),regenerate:z.boolean().optional()}).strict().parse(await body(request));
  const records=await allRecords(owner),cycle=records.find(r=>r.kind==="cycle"&&r.id===input.cycleId)?.value as Cycle|undefined;
  const latest=records.filter(r=>r.kind==="cycle").map(r=>r.value as Cycle).sort((a,b)=>b.number-a.number)[0];
  const routineEntity=records.find(r=>r.kind==="routine"),settingsEntity=records.find(r=>r.kind==="settings");
  if(!cycle||latest?.id!==cycle.id||!routineEntity)throw new ApiError(409,"Este ciclo ya cambió. Sincroniza para continuar.");
  const routine=routineEntity.value as Routine,settings=(settingsEntity?.value??emptySettings()) as Settings;
  const sessions=records.filter(r=>r.kind==="session").map(r=>r.value as Session);
  if(completedDays(cycle,sessions).size!==5)throw new ApiError(409,"Completa los cinco días antes de generar el siguiente ciclo.");
  if(sessions.some(s=>s.status==="active"||s.status==="paused"))throw new ApiError(409,"Termina o cancela el entrenamiento abierto.");
  if(routine.days.some(d=>!d.slots.length||d.slots.some(s=>!s.sets)))throw new ApiError(400,"Completa la configuración de los cinco días de tu rutina base.");
  const existing=await record(owner,"proposal",cycle.id),old=existing?.value as Proposal|undefined;
  if(old?.status==="activated")throw new ApiError(409,"Esta propuesta ya está activada.");
  if(old?.status==="ready"&&!input.regenerate&&old.sourceRevision===routineEntity.revision&&old.settingsRevision===(settingsEntity?.revision??0))return json({proposal:existing,cached:true});
  if(old?.status==="generating"&&Date.now()-Date.parse(old.createdAt)<120000)return json({proposal:existing},202);
  const recentCycles=records.filter(r=>r.kind==="cycle").map(r=>r.value as Cycle).filter(c=>c.number>=cycle.number-1);
  const recent=recentCycles.flatMap(c=>c.days.flatMap(d=>d.slots.map(s=>s.exerciseId)));
  const slots=proposalSlots(routine,CATALOG,settings,recent),eligible=slots.filter(s=>s.candidates.length);
  if(eligible.length&&!env.GEMINI_API_KEY)throw new ApiError(503,"Gemini está pendiente de conexión. Puedes seguir entrenando y volver a intentarlo después.");
  const draft:Proposal={id:cycle.id,cycleId:cycle.id,baseVersion:routine.version,status:"generating",choices:[],error:null,createdAt:now(),sourceRevision:routineEntity.revision,settingsRevision:settingsEntity?.revision??0};
  let revision:number;
  if(existing){revision=(await writeServer(owner,"proposal",draft,existing.revision)).revision;}
  else{const inserted=await insertServer(owner,"proposal",draft);if(!inserted)return json({proposal:await record(owner,"proposal",cycle.id)},202);revision=1;}
  reserved={proposal:draft,revision};
  let raw:unknown={choices:[]};
  if(eligible.length){
   await db().prepare("INSERT OR IGNORE INTO ai_usage(owner,day,attempts) VALUES(?,?,0)").bind(owner,bogotaDay()).run();
   const usage=await db().prepare("UPDATE ai_usage SET attempts=attempts+1 WHERE owner=? AND day=? AND attempts<5").bind(owner,bogotaDay()).run();
   if(!usage.meta.changes)throw new ApiError(429,"Has usado los cinco intentos de hoy. La rutina y el registro siguen disponibles.");
   const payload=eligible.map(s=>({position:s.slot.id,day:s.dayId,original:{id:s.original!.id,name:s.original!.name,group:s.original!.group},candidates:s.candidates.map(e=>({id:e.id,name:e.name,recentlyUsed:recent.includes(e.id)}))}));
   try{raw=await generateChoices(payload,env.GEMINI_API_KEY!);}catch(e){if(e instanceof GeminiError)throw new ApiError(e.status,e.message);throw new ApiError(502,"No se pudo conectar con Gemini. Tu rutina sigue guardada.");}
  }
  let choices;try{choices=validateRecommendations(raw,routine,CATALOG,settings,recent);}catch{throw new ApiError(502,"La propuesta contenía cambios no permitidos y fue descartada.");}
  const freshRoutine=await record(owner,"routine","base"),freshSettings=await record(owner,"settings","preferences");
  if(freshRoutine?.revision!==routineEntity.revision||(freshSettings?.revision??0)!==(settingsEntity?.revision??0))throw new ApiError(409,"Cambiaste la rutina o el equipo durante la generación. Genera otra propuesta.");
  const ready={...draft,status:"ready" as const,choices};
  const saved=await writeServer(owner,"proposal",ready,revision);reserved=undefined;return json({proposal:saved});
 }catch(e){
  if(owner&&reserved){try{await writeServer(owner,"proposal",{...reserved.proposal,status:"failed",error:e instanceof ApiError?e.message:"No se pudo generar la propuesta. Puedes volver a intentarlo."},reserved.revision);}catch{}}
  return errorResponse(e);
 }
}
