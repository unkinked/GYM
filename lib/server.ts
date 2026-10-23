import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import type { Entity, EntityValue, Kind, Operation, SyncResult } from "./types";
import { now, uid } from "./domain";
import { parseValue, sessionSchema } from "./validation";
import { CATALOG } from "./catalog";
import { canFinish, validSet } from "./domain";
export class ApiError extends Error { constructor(public status:number,message:string){super(message);} }
export function db(){if(!env.DB)throw new ApiError(503,"El almacenamiento todavía no está disponible.");return env.DB;}
export async function identity(request?:Request){if(request&&request.method!=="GET"){const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin){await request.arrayBuffer();throw new ApiError(403,"Origen no permitido.");}}const user=await getChatGPTUser();if(!user)throw new ApiError(401,"Vuelve a iniciar sesión para sincronizar.");return user.userId;}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"}});}
export async function body(request:Request){const length=Number(request.headers.get("content-length")??0);if(length>2000000)throw new ApiError(413,"El archivo es demasiado grande.");const text=await request.text();if(text.length>2000000)throw new ApiError(413,"La solicitud es demasiado grande.");try{return JSON.parse(text);}catch{throw new ApiError(400,"JSON inválido.");}}
export function errorResponse(error:unknown){if(error instanceof ApiError)return json({error:error.message},error.status);if(error&&typeof error==="object"&&"issues" in error)return json({error:"Revisa los campos del registro.",details:(error as {issues:unknown}).issues},400);console.error("Gym API:",error instanceof Error?error.name:"Unknown");return json({error:"No se pudo completar la operación. Tus datos locales siguen guardados."},500);}
type Row={owner:string;kind:Kind;id:string;payload:string;revision:number;updated_at:string;last_op:string};
export const entity=(r:Row):Entity=>({kind:r.kind,id:r.id,value:JSON.parse(r.payload),revision:r.revision,updatedAt:r.updated_at});
export async function allRecords(owner:string):Promise<Entity[]>{const r=await db().prepare("SELECT * FROM records WHERE owner = ? AND revision > 0").bind(owner).all<Row>();return r.results.map(entity);}
export async function record(owner:string,kind:Kind,id:string):Promise<Entity|undefined>{const r=await db().prepare("SELECT * FROM records WHERE owner=? AND kind=? AND id=? AND revision>0").bind(owner,kind,id).first<Row>();return r?entity(r):undefined;}
export function validateReferences(kind:Kind,value:EntityValue){
 const catalogIds=new Set(CATALOG.map(e=>e.id));
 if(kind==="routine"||kind==="cycle"){const routine=value as {days:{slots:{exerciseId:string}[]}[]};if(routine.days.some(d=>d.slots.some(s=>!catalogIds.has(s.exerciseId))))throw new ApiError(400,"La rutina contiene un ejercicio desconocido.");}
 if(kind==="session"){const session=sessionSchema.parse(value);for(const e of session.exercises){if(!catalogIds.has(e.slot.exerciseId)||!catalogIds.has(e.originalExerciseId))throw new ApiError(400,"Ejercicio desconocido.");if(e.sets.some(s=>s.done&&!validSet(e.slot,s)))throw new ApiError(400,"Una serie completada tiene datos incompletos.");}if(session.status==="completed"&&!canFinish(session))throw new ApiError(400,"Completa una serie por ejercicio o marca el ejercicio como omitido.");}
}
export async function syncOperation(owner:string,op:Operation):Promise<SyncResult>{
 if(op.kind==="proposal")throw new ApiError(400,"Las propuestas solo se generan en el servidor.");
 const value=parseValue(op.kind,op.value) as EntityValue;
 if(value.id!==op.entityId)throw new ApiError(400,"Identificador inconsistente.");
 validateReferences(op.kind,value);
 if(op.kind==="cycle"&&((value as {number:number}).number!==1||value.id!=="cycle-1"))throw new ApiError(400,"El siguiente ciclo se activa desde una propuesta.");
 const payload=JSON.stringify(value);
 const prior=await db().prepare("SELECT payload,kind,entity_id FROM operations WHERE owner=? AND id=?").bind(owner,op.opId).first<{payload:string;kind:string;entity_id:string}>();
 if(prior){if(prior.payload!==payload||prior.kind!==op.kind||prior.entity_id!==op.entityId)throw new ApiError(409,"Operación repetida con contenido diferente.");return {opId:op.opId,status:"duplicate"};}
 const time=now();
 await db().batch([
  db().prepare("INSERT OR IGNORE INTO records(owner,kind,id,payload,revision,updated_at,last_op) VALUES(?,?,?,'null',0,?,'')").bind(owner,op.kind,op.entityId,time),
  db().prepare("UPDATE records SET payload=?,revision=revision+1,updated_at=?,last_op=? WHERE owner=? AND kind=? AND id=? AND revision=?").bind(payload,time,op.opId,owner,op.kind,op.entityId,op.baseRevision),
  db().prepare("INSERT OR IGNORE INTO operations(owner,id,kind,entity_id,payload,revision,created_at) SELECT owner,?,kind,id,?,revision,? FROM records WHERE owner=? AND kind=? AND id=? AND last_op=?").bind(op.opId,payload,time,owner,op.kind,op.entityId,op.opId)
 ]);
 const applied=await db().prepare("SELECT id FROM operations WHERE owner=? AND id=?").bind(owner,op.opId).first();
 if(applied)return {opId:op.opId,status:"applied"};
 const remote=await record(owner,op.kind,op.entityId);if(!remote)throw new ApiError(409,"El registro cambió durante la sincronización.");return {opId:op.opId,status:"conflict",remote};
}
export async function writeServer(owner:string,kind:Kind,value:EntityValue,expectedRevision:number):Promise<Entity>{
 const time=now(),opId=uid();
 const r=await db().prepare("UPDATE records SET payload=?,revision=revision+1,updated_at=?,last_op=? WHERE owner=? AND kind=? AND id=? AND revision=?").bind(JSON.stringify(value),time,opId,owner,kind,value.id,expectedRevision).run();
 if(!r.meta.changes)throw new ApiError(409,"Los datos cambiaron. Sincroniza y vuelve a intentarlo.");
 return {kind,id:value.id,value,revision:expectedRevision+1,updatedAt:time};
}
export async function insertServer(owner:string,kind:Kind,value:EntityValue):Promise<boolean>{const r=await db().prepare("INSERT OR IGNORE INTO records(owner,kind,id,payload,revision,updated_at,last_op) VALUES(?,?,?,?,1,?,?)").bind(owner,kind,value.id,JSON.stringify(value),now(),uid()).run();return !!r.meta.changes;}

