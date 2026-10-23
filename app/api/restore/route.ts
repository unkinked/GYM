import { allRecords, ApiError, db, errorResponse, identity, json } from "@/lib/server";
import {parseBackup} from "@/lib/backup";
import {validateReferences} from "@/lib/server";
import {now,uid} from "@/lib/domain";
import {keyOf} from "@/lib/types";
import type {EntityValue,Kind} from "@/lib/types";
export async function POST(request:Request){try{
 const owner=await identity(request),text=await request.text();if(text.length>20000000)throw new ApiError(413,"El respaldo supera el tamaño permitido.");
 let input;try{input=parseBackup(JSON.parse(text));}catch{throw new ApiError(400,"El respaldo no es válido o usa una versión incompatible.");}
 const entries=new Map(input.records.map(r=>[keyOf(r.kind,r.id),r]));
 for(const c of input.conflicts)entries.set(c.key,{kind:c.remote.kind,id:c.remote.id,value:c.remote.value});
 for(const r of entries.values())validateReferences(r.kind,r.value as EntityValue);
 const time=now(),token=uid(),rows=[...entries.values()].map(r=>({kind:r.kind,id:r.id,payload:JSON.stringify(r.value)}));
 await db().prepare(`INSERT INTO records(owner,kind,id,payload,revision,updated_at,last_op)
 SELECT ?,json_extract(value,'$.kind'),json_extract(value,'$.id'),json_extract(value,'$.payload'),1,?,? FROM json_each(?) WHERE true
 ON CONFLICT(owner,kind,id) DO UPDATE SET payload=excluded.payload,revision=records.revision+1,updated_at=excluded.updated_at,last_op=excluded.last_op`).bind(owner,time,token,JSON.stringify(rows)).run();
 return json({records:await allRecords(owner),restored:rows.length});
 }catch(e){return errorResponse(e);}}
