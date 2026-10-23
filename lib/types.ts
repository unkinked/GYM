export type Profile = "weight_reps" | "reps" | "assisted_reps" | "duration" | "weight_duration" | "distance_time" | "weight_distance";
export type Exercise = { id:string; name:string; category:string; group:string|null; muscles:string[]; equipment:string[]; laterality:"bilateral"|"unilateral"|"either"; profile:Profile; reviewed:boolean; };
export type Slot = { id:string; exerciseId:string; equipmentId:string; fixed:boolean; profile:Profile; sets:number|null; repsMin:number|null; repsMax:number|null; targetSeconds:number|null; targetMeters:number|null; restSeconds:number|null; };
export type RoutineDay = { id:string; name:string; slots:Slot[] };
export type Routine = { id:"base"; version:number; name:string; days:RoutineDay[]; updatedAt:string };
export type Cycle = { id:string; number:number; baseVersion:number; days:RoutineDay[]; createdAt:string };
export type SetLog = { id:string; weight:number|null; reps:number|null; seconds:number|null; meters:number|null; assistance:number|null; side:"both"|"left"|"right"; done:boolean; kind:"work"|"warmup"|"drop"; };
export type SessionExercise = { slot:Slot; originalExerciseId:string; sets:SetLog[]; notes:string; skipped:boolean };
export type Session = { id:string; cycleId:string; dayId:string; dayName:string; status:"active"|"paused"|"completed"|"cancelled"; additional:boolean; startedAt:string; finishedAt:string|null; exercises:SessionExercise[]; notes:string; restEndsAt:number|null; };
export type Settings = { id:"preferences"; equipment:string[]; excludedExercises:string[]; gym:string; };
export type Choice = { slotId:string; originalId:string; replacementId:string; reason:string; changed:boolean };
export type Proposal = { id:string; cycleId:string; baseVersion:number; status:"generating"|"ready"|"failed"|"activated"; choices:Choice[]; error:string|null; createdAt:string; sourceRevision:number; settingsRevision:number; };
export type EntityValue = Routine|Cycle|Session|Settings|Proposal;
export type Kind = "routine"|"cycle"|"session"|"settings"|"proposal";
export type Entity = { kind:Kind; id:string; value:EntityValue; revision:number; updatedAt:string };
export type Operation = { opId:string; kind:Kind; entityId:string; baseRevision:number; value:EntityValue; createdAt:string };
export type Conflict = { key:string; local:Entity; remote:Entity; createdAt:string };
export type Replica = { schemaVersion:1; owner:string; records:Record<string,Entity>; outbox:Operation[]; conflicts:Conflict[]; };
export type SyncResult = { opId:string; status:"applied"|"duplicate"|"conflict"; remote?:Entity };
export type Tab = "today"|"routine"|"variations"|"progress"|"settings";
export const keyOf = (kind:Kind,id:string) => kind+":"+id;
export const EQUIPMENT = [
{id:"dumbbell",name:"Mancuernas",reference:"En fotos de Mercurio"},
{id:"barbell",name:"Barra libre y discos",reference:"Confirma disponibilidad"},
{id:"ez",name:"Barra EZ / W",reference:"Confirma disponibilidad"},
{id:"bench",name:"Banco plano o ajustable",reference:"En fotos de Mercurio"},
{id:"cable",name:"Poleas ajustables",reference:"En fotos de Mercurio"},
{id:"chest_machine",name:"Máquina de press de pecho",reference:"Confirma el equipo"},
{id:"fly_machine",name:"Máquina de aperturas / posterior",reference:"Confirma el equipo"},
{id:"lat_machine",name:"Jalón al pecho",reference:"Confirma el equipo"},
{id:"row_machine",name:"Remo en máquina",reference:"Confirma el equipo"},
{id:"shoulder_machine",name:"Press de hombros en máquina",reference:"Confirma el equipo"},
{id:"lateral_machine",name:"Elevaciones laterales en máquina",reference:"Confirma disponibilidad"},
{id:"curl_machine",name:"Máquina de bíceps",reference:"Confirma el equipo"},
{id:"triceps_machine",name:"Máquina de tríceps",reference:"Confirma el equipo"},
{id:"smith",name:"Máquina Smith",reference:"Confirma disponibilidad"},
{id:"rack",name:"Soporte de sentadilla",reference:"Confirma disponibilidad"},
{id:"leg_press",name:"Prensa de piernas",reference:"Confirma el equipo"},
{id:"hack",name:"Sentadilla hack",reference:"Confirma disponibilidad"},
{id:"leg_extension",name:"Extensión de cuádriceps",reference:"Confirma el equipo"},
{id:"leg_curl",name:"Curl femoral",reference:"Confirma el equipo"},
{id:"hip_machine",name:"Hip thrust en máquina",reference:"Confirma disponibilidad"},
{id:"abductor",name:"Máquina de abductores",reference:"Confirma disponibilidad"},
{id:"adductor",name:"Máquina de aductores",reference:"Confirma disponibilidad"},
{id:"calf_machine",name:"Máquina de pantorrillas",reference:"Confirma el equipo"},
{id:"abs_machine",name:"Máquina abdominal",reference:"Confirma el equipo"},
{id:"back_bench",name:"Banco de hiperextensiones",reference:"Confirma disponibilidad"},
{id:"pullup",name:"Barra de dominadas",reference:"Confirma disponibilidad"},
{id:"dip",name:"Paralelas",reference:"Confirma disponibilidad"},
{id:"assisted_station",name:"Dominadas / fondos asistidos",reference:"Confirma disponibilidad"},
{id:"band",name:"Bandas elásticas",reference:"Confirma disponibilidad"},
{id:"kettlebell",name:"Kettlebells",reference:"En fotos de Mercurio"},
{id:"suspension",name:"Correas de suspensión",reference:"En fotos de Mercurio"},
{id:"ball",name:"Balón de estabilidad",reference:"En fotos de Mercurio"},
{id:"sandbag",name:"Sacos con asas",reference:"En fotos de Mercurio"},
{id:"medicine_ball",name:"Balones con asas",reference:"En fotos de Mercurio"},
{id:"step",name:"Step",reference:"En fotos de Mercurio"},
{id:"balance",name:"Plataforma de equilibrio",reference:"En fotos de Mercurio"},
{id:"trampoline",name:"Minitrampolín",reference:"En fotos de Mercurio"},
{id:"treadmill",name:"Caminadora",reference:"En fotos de Mercurio"},
{id:"bike",name:"Bicicleta reclinada",reference:"En fotos de Mercurio"},
{id:"cycling",name:"Bicicleta de cycling",reference:"En fotos de Mercurio"},
{id:"elliptical",name:"Elíptica",reference:"Confirma disponibilidad"},
{id:"stairs",name:"Escaladora",reference:"Confirma disponibilidad"},
{id:"rower",name:"Remadora de cardio",reference:"Confirma disponibilidad"},
] as const;
export const PROFILE_LABELS:Record<Profile,string> = {weight_reps:"Peso y repeticiones",reps:"Repeticiones",assisted_reps:"Asistencia y repeticiones",duration:"Tiempo",weight_duration:"Peso y tiempo",distance_time:"Distancia y tiempo",weight_distance:"Peso y distancia"};
