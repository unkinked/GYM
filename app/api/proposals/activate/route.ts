import { z } from "zod";
import { allRecords, ApiError, body, db, errorResponse, identity, json } from "@/lib/server";
import { applyChoices, completedDays, now, uid } from "@/lib/domain";
import { CATALOG } from "@/lib/catalog";
import { validateRecommendations } from "@/lib/recommendations";
import type { Cycle, Proposal, Routine, Session, Settings } from "@/lib/types";
export async function POST(request:Request){try{
 const owner=await identity(request),input=z.object({proposalId:z.string(),acceptedSlotIds:z.array(z.string()).max(250)}).strict().parse(await body(request));
 const records=await allRecords(owner),pe=records.find(r=>r.kind==="proposal"&&r.id===input.proposalId),p=pe?.value as Proposal|undefined;
 if(!pe||!p)throw new ApiError(404,"No encontramos esa propuesta.");
 const prior=records.find(r=>r.kind==="cycle"&&r.id==="cycle-"+((records.find(r=>r.kind==="cycle"&&r.id===p.cycleId)?.value as Cycle|undefined)?.number!+1));
 if(p.status==="activated"&&prior)return json({records});
 if(p.status!=="ready")throw new ApiError(409,"Primero genera una propuesta válida.");
 const re=records.find(r=>r.kind==="routine"),se=records.find(r=>r.kind==="settings");
 if(!re||re.revision!==p.sourceRevision||(se?.revision??0)!==p.settingsRevision)throw new ApiError(409,"La rutina o los equipos cambiaron. Regenera la propuesta.");
 const routine=re.value as Routine,settings=se?.value as Settings|undefined;
 const cycle=records.find(r=>r.kind==="cycle"&&r.id===p.cycleId)?.value as Cycle|undefined;
 const sessions=records.filter(r=>r.kind==="session").map(r=>r.value as Session);
 const latest=records.filter(r=>r.kind==="cycle").map(r=>r.value as Cycle).sort((a,b)=>b.number-a.number)[0];
 if(!cycle||latest?.id!==cycle.id||completedDays(cycle,sessions).size!==5||sessions.some(s=>s.status==="active"||s.status==="paused"))throw new ApiError(409,"Termina el ciclo y cualquier sesión abierta antes de activar.");
 // Revalidate against the same candidate order used during generation.
 const recent=records.filter(r=>r.kind==="cycle").map(r=>r.value as Cycle).filter(c=>c.number>=cycle.number-1).flatMap(c=>c.days.flatMap(d=>d.slots.map(s=>s.exerciseId)));
 validateRecommendations({choices:p.choices.filter(c=>c.changed).map(c=>({slotId:c.slotId,replacementId:c.replacementId,reason:c.reason}))},routine,CATALOG,settings??{id:"preferences",equipment:[],excludedExercises:[],gym:""},recent);
 if(input.acceptedSlotIds.some(id=>!p.choices.some(c=>c.slotId===id&&c.changed)))throw new ApiError(400,"Selección de cambios inválida.");
 const next:Cycle={id:"cycle-"+(cycle.number+1),number:cycle.number+1,baseVersion:routine.version,days:applyChoices(routine,p.choices,new Set(input.acceptedSlotIds),CATALOG),createdAt:now()},token=uid(),time=now();
 await db().batch([
  db().prepare("INSERT OR IGNORE INTO records(owner,kind,id,payload,revision,updated_at,last_op) SELECT ?,'cycle',?,?,1,?,? WHERE EXISTS(SELECT 1 FROM records WHERE owner=? AND kind='proposal' AND id=? AND revision=?)").bind(owner,next.id,JSON.stringify(next),time,token,owner,p.id,pe.revision),
  db().prepare("UPDATE records SET payload=?,revision=revision+1,updated_at=?,last_op=? WHERE owner=? AND kind='proposal' AND id=? AND revision=? AND EXISTS(SELECT 1 FROM records WHERE owner=? AND kind='cycle' AND id=? AND last_op=?)").bind(JSON.stringify({...p,status:"activated"}),time,token,owner,p.id,pe.revision,owner,next.id,token)
 ]);
 const saved=await allRecords(owner);if(!(saved.find(r=>r.kind==="proposal"&&r.id===p.id)?.value as Proposal)?.status?.includes("activated"))throw new ApiError(409,"El ciclo cambió. Sincroniza para continuar.");return json({records:saved});
 }catch(e){return errorResponse(e);}}
