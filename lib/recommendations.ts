import { z } from "zod";
import type { Choice, Exercise, Routine, Settings } from "./types.ts";
import { proposalSlots } from "./domain.ts";
export const modelOutputSchema=z.object({choices:z.array(z.object({slotId:z.string(),replacementId:z.string(),reason:z.string().min(1).max(600)}).strict()).max(250)}).strict();
export function validateRecommendations(raw:unknown,routine:Routine,catalog:Exercise[],settings:Settings,recent:string[]=[]):Choice[]{
 const parsed=modelOutputSchema.parse(raw),slots=proposalSlots(routine,catalog,settings,recent);
 const seen=new Set<string>();for(const choice of parsed.choices){if(seen.has(choice.slotId))throw new Error("Posición duplicada.");seen.add(choice.slotId);const target=slots.find(s=>s.slot.id===choice.slotId);if(!target||target.slot.fixed||!target.candidates.some(e=>e.id===choice.replacementId))throw new Error("Sustitución no autorizada.");}
 return slots.map(({slot,original,candidates})=>{const selected=parsed.choices.find(c=>c.slotId===slot.id);return {slotId:slot.id,originalId:slot.exerciseId,replacementId:selected?.replacementId??slot.exerciseId,reason:selected?.reason??(slot.fixed?"Lo marcaste como fijo.":!original?.reviewed?"Este ejercicio todavía no tiene una clasificación suficiente para proponer equivalencias.":!candidates.length?"No hay alternativas compatibles con tu equipo confirmado y tus exclusiones.":"No se propuso una alternativa válida; conservamos el ejercicio."),changed:!!selected};});
}
export const geminiSchema={type:"object",properties:{choices:{type:"array",items:{type:"object",properties:{slotId:{type:"string"},replacementId:{type:"string"},reason:{type:"string"}},required:["slotId","replacementId","reason"],additionalProperties:false}}},required:["choices"],additionalProperties:false};
