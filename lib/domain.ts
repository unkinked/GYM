import type { Cycle, Exercise, Replica, Routine, RoutineDay, Session, Settings, Slot, SetLog, Choice, Entity, EntityValue, Kind, Operation } from "./types.ts";
import { EQUIPMENT, keyOf } from "./types.ts";
export function equipmentIdentity(exercise:Exercise):string{return exercise.equipment.map(id=>EQUIPMENT.find(e=>e.id===id)?.name??"Equipo por confirmar").join(" + ")||"Peso corporal";}
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export const clone = <T,>(v:T):T => structuredClone(v);
export function emptyRoutine():Routine { return {id:"base",version:1,name:"Mi rutina de 5 días",days:Array.from({length:5},(_,i)=>({id:"day-"+(i+1),name:"Día "+(i+1),slots:[]})),updatedAt:now()}; }
export function emptySettings():Settings {return {id:"preferences",equipment:[],excludedExercises:[],gym:"Smart Fit Mercurio Soacha"};}
export function emptyReplica(owner:string):Replica { return {schemaVersion:1,owner,records:{},outbox:[],conflicts:[]};}
export function list<T extends EntityValue>(replica:Replica,kind:Kind):T[] {return Object.values(replica.records).filter(e=>e.kind===kind).map(e=>e.value as T);}
export function get<T extends EntityValue>(replica:Replica,kind:Kind,id:string):T|undefined {return replica.records[keyOf(kind,id)]?.value as T|undefined;}
export function putLocal(replica:Replica,kind:Kind,value:EntityValue):Replica {
 const next=clone(replica),key=keyOf(kind,value.id),previous=next.records[key],time=now();
 if(next.conflicts.some(c=>c.key===key)) throw new Error("Resuelve primero el conflicto de este registro.");
 const revision=previous?.revision??0;
 next.records[key]={kind,id:value.id,value:clone(value),revision:revision+1,updatedAt:time};
 next.outbox.push({opId:uid(),kind,entityId:value.id,baseRevision:revision,value:clone(value),createdAt:time});
 return next;
}
export function mergeSync(replica:Replica,results:{opId:string;status:string;remote?:Entity}[],remoteRecords:Entity[]):Replica {
 const next=clone(replica);const handled=new Set(results.map(r=>r.opId));
 for(const result of results){ if(result.status==="conflict"&&result.remote){const key=keyOf(result.remote.kind,result.remote.id);const local=next.records[key];if(local&&!next.conflicts.some(c=>c.key===key)) next.conflicts.push({key,local:clone(local),remote:result.remote,createdAt:now()});next.outbox=next.outbox.filter(op=>keyOf(op.kind,op.entityId)!==key);}}
 next.outbox=next.outbox.filter(op=>!handled.has(op.opId));
 for(const remote of remoteRecords){const key=keyOf(remote.kind,remote.id);if(!next.outbox.some(op=>keyOf(op.kind,op.entityId)===key)&&!next.conflicts.some(c=>c.key===key))next.records[key]=remote;}
 return next;
}
export function resolveConflict(replica:Replica,key:string,choice:"local"|"remote"):Replica{
 const next=clone(replica),conflict=next.conflicts.find(c=>c.key===key);if(!conflict)return next;
 next.conflicts=next.conflicts.filter(c=>c.key!==key);next.records[key]=clone(conflict.remote);
 return choice==="local"?putLocal(next,conflict.local.kind,conflict.local.value):next;
}
export function routineReady(day:RoutineDay):boolean {return day.slots.length>0&&day.slots.every(s=>s.sets!==null&&s.sets>=1);}
export function completedDays(cycle:Cycle,sessions:Session[]):Set<string>{return new Set(sessions.filter(s=>s.cycleId===cycle.id&&s.status==="completed"&&!s.additional&&cycle.days.some(d=>d.id===s.dayId)).map(s=>s.dayId));}
export function currentCycle(replica:Replica):Cycle|undefined{return list<Cycle>(replica,"cycle").sort((a,b)=>b.number-a.number)[0];}
export function activeSession(replica:Replica):Session|undefined{return list<Session>(replica,"session").find(s=>s.status==="active"||s.status==="paused");}
export function newCycle(routine:Routine,number=1):Cycle {return {id:"cycle-"+number,number,baseVersion:routine.version,days:clone(routine.days),createdAt:now()};}
export function blankSet():SetLog {return {id:uid(),weight:null,reps:null,seconds:null,meters:null,assistance:null,side:"both",done:false,kind:"work"};}
export function newSession(cycle:Cycle,day:RoutineDay,sessions:Session[]):Session{
 if(!routineReady(day))throw new Error("Añade ejercicios y define sus series antes de entrenar.");
 return {id:uid(),cycleId:cycle.id,dayId:day.id,dayName:day.name,status:"active",additional:completedDays(cycle,sessions).has(day.id),startedAt:now(),finishedAt:null,exercises:day.slots.map(slot=>({slot:clone(slot),originalExerciseId:slot.exerciseId,sets:Array.from({length:slot.sets!},blankSet),notes:"",skipped:false})),notes:"",restEndsAt:null};
}
export function validSet(slot:Slot,set:SetLog):boolean{
 const pos=(n:number|null)=>n!==null&&Number.isFinite(n)&&n>0,nonneg=(n:number|null)=>n!==null&&Number.isFinite(n)&&n>=0;
 switch(slot.profile){case"weight_reps":return nonneg(set.weight)&&pos(set.reps)&&Number.isInteger(set.reps);case"assisted_reps":return nonneg(set.assistance)&&pos(set.reps)&&Number.isInteger(set.reps);case"reps":return pos(set.reps)&&Number.isInteger(set.reps);case"duration":return pos(set.seconds);case"weight_duration":return nonneg(set.weight)&&pos(set.seconds);case"distance_time":return pos(set.meters)&&pos(set.seconds);case"weight_distance":return nonneg(set.weight)&&pos(set.meters);}
}
export function canFinish(session:Session):boolean{return session.exercises.some(e=>e.sets.some(s=>s.done))&&session.exercises.every(e=>e.skipped||e.sets.some(s=>s.done));}
export function candidateExercises(original:Exercise,catalog:Exercise[],settings:Settings,recent:string[]=[]):Exercise[]{
 if(!original.reviewed||!original.group)return [];
 const candidates=catalog.filter(e=>e.id!==original.id&&e.reviewed&&e.group===original.group&&e.laterality===original.laterality&&e.muscles.join("|")===original.muscles.join("|")&&!settings.excludedExercises.includes(e.id)&&e.equipment.every(eq=>settings.equipment.includes(eq)));
 return candidates.sort((a,b)=>Number(recent.includes(a.id))-Number(recent.includes(b.id))||a.id.localeCompare(b.id));
}
export function proposalSlots(routine:Routine,catalog:Exercise[],settings:Settings,recent:string[]=[]){
 return routine.days.flatMap(day=>day.slots.map(slot=>{const original=catalog.find(e=>e.id===slot.exerciseId);return {dayId:day.id,slot,original,candidates:slot.fixed||!original?[]:candidateExercises(original,catalog,settings,recent).slice(0,8)};}));
}
export function applyChoices(routine:Routine,choices:Choice[],accepted:Set<string>,catalog:Exercise[]):RoutineDay[]{
 return routine.days.map(day=>({...clone(day),slots:day.slots.map(slot=>{const c=choices.find(c=>c.slotId===slot.id);if(!c||!accepted.has(slot.id)||!c.changed||slot.fixed)return clone(slot);const exercise=catalog.find(e=>e.id===c.replacementId);if(!exercise)throw new Error("Ejercicio desconocido.");return {...clone(slot),exerciseId:exercise.id,equipmentId:equipmentIdentity(exercise),profile:exercise.profile};})}));
}
export function bogotaDay(date=new Date()):string{return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);}
export function timerRemaining(end:number|null,at=Date.now()):number{return end?Math.max(0,Math.ceil((end-at)/1000)):0;}
export function sanitizeBackup(replica:Replica){return {format:"gym-personal",schemaVersion:1,exportedAt:now(),records:Object.values(replica.records).map(({kind,id,value})=>({kind,id,value})),conflicts:replica.conflicts};}
export function operationMatches(op:Operation,entity:Entity){return op.kind===entity.kind&&op.entityId===entity.id&&op.baseRevision===entity.revision;}
