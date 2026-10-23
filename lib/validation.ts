import { z } from "zod";
const id=z.string().min(1).max(100);
const metric=z.number().finite().min(0).max(1000000).nullable();
const profile=z.enum(["weight_reps","reps","assisted_reps","duration","weight_duration","distance_time","weight_distance"]);
export const slotSchema=z.object({id,exerciseId:id,equipmentId:z.string().max(150),fixed:z.boolean(),profile,sets:z.number().int().min(1).max(50).nullable(),repsMin:metric,repsMax:metric,targetSeconds:metric,targetMeters:metric,restSeconds:metric}).strict();
const day=z.object({id,name:z.string().min(1).max(80),slots:z.array(slotSchema).max(50)}).strict();
const days=z.array(day).length(5).refine(d=>new Set(d.map(x=>x.id)).size===5,"Días duplicados").refine(d=>{const ids=d.flatMap(x=>x.slots.map(s=>s.id));return new Set(ids).size===ids.length;},"Posiciones duplicadas");
export const routineSchema=z.object({id:z.literal("base"),version:z.number().int().min(1),name:z.string().min(1).max(100),days,updatedAt:z.string().datetime()}).strict();
export const cycleSchema=z.object({id,number:z.number().int().min(1),baseVersion:z.number().int().min(1),days,createdAt:z.string().datetime()}).strict();
const set=z.object({id,weight:metric,reps:metric,seconds:metric,meters:metric,assistance:metric,side:z.enum(["both","left","right"]),done:z.boolean(),kind:z.enum(["work","warmup","drop"])}).strict();
export const sessionSchema=z.object({id,cycleId:id,dayId:id,dayName:z.string().max(80),status:z.enum(["active","paused","completed","cancelled"]),additional:z.boolean(),startedAt:z.string().datetime(),finishedAt:z.string().datetime().nullable(),exercises:z.array(z.object({slot:slotSchema,originalExerciseId:id,sets:z.array(set).max(100),notes:z.string().max(2000),skipped:z.boolean()}).strict()).min(1).max(50),notes:z.string().max(3000),restEndsAt:z.number().finite().nullable()}).strict();
export const settingsSchema=z.object({id:z.literal("preferences"),equipment:z.array(id).max(100),excludedExercises:z.array(id).max(500),gym:z.string().max(100)}).strict();
const choice=z.object({slotId:id,originalId:id,replacementId:id,reason:z.string().max(1200),changed:z.boolean()}).strict();
export const proposalSchema=z.object({id,cycleId:id,baseVersion:z.number().int().min(1),status:z.enum(["generating","ready","failed","activated"]),choices:z.array(choice).max(250),error:z.string().max(1200).nullable(),createdAt:z.string().datetime(),sourceRevision:z.number().int().min(0),settingsRevision:z.number().int().min(0)}).strict();
export const kindSchema=z.enum(["routine","cycle","session","settings","proposal"]);
export function parseValue(kind:string,value:unknown){switch(kind){case"routine":return routineSchema.parse(value);case"cycle":return cycleSchema.parse(value);case"session":return sessionSchema.parse(value);case"settings":return settingsSchema.parse(value);case"proposal":return proposalSchema.parse(value);default:throw new Error("Tipo de registro inválido.");}}
export const operationSchema=z.object({opId:id,kind:kindSchema,entityId:id,baseRevision:z.number().int().min(0),value:z.unknown(),createdAt:z.string().datetime()}).strict();
export const syncSchema=z.object({operations:z.array(operationSchema).max(100)}).strict();
export const backupSchema=z.object({format:z.literal("gym-personal"),schemaVersion:z.literal(1),exportedAt:z.string(),records:z.array(z.object({kind:kindSchema,id,value:z.unknown()})).max(10000),conflicts:z.array(z.unknown()).optional()});
