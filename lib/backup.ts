import { z } from "zod";
import { backupSchema, kindSchema, parseValue } from "./validation.ts";
import type { Conflict, Entity, EntityValue, Kind } from "./types";
import { keyOf } from "./types.ts";
const envelope=z.object({kind:kindSchema,id:z.string(),value:z.unknown(),revision:z.number().int().min(0),updatedAt:z.string()});
export function parseBackup(raw:unknown){
 const parsed=backupSchema.parse(raw),seen=new Set<string>();
 const records=parsed.records.map(r=>{const value=parseValue(r.kind,r.value) as EntityValue;if(value.id!==r.id)throw new Error("Identificador de respaldo inválido.");const key=keyOf(r.kind,r.id);if(seen.has(key))throw new Error("El respaldo tiene registros duplicados.");seen.add(key);return {kind:r.kind,id:r.id,value};});
 const conflicts:Conflict[]=(parsed.conflicts??[]).map(raw=>{const c=z.object({key:z.string(),local:envelope,remote:envelope,createdAt:z.string()}).parse(raw);const local={...c.local,value:parseValue(c.local.kind,c.local.value)} as Entity,remote={...c.remote,value:parseValue(c.remote.kind,c.remote.value)} as Entity;if(c.key!==keyOf(local.kind,local.id)||c.key!==keyOf(remote.kind,remote.id))throw new Error("Conflicto de respaldo inválido.");return {...c,local,remote};});
 if(new Set(conflicts.map(c=>c.key)).size!==conflicts.length)throw new Error("Conflictos duplicados.");
 return {...parsed,records,conflicts};
}
