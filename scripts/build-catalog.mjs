import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
const source=JSON.parse(readFileSync(new URL("../../catalogo-ejercicios.json",import.meta.url),"utf8"));
const definitions=[
[1,[1,4,7,8,9,10,19,20,22],"empuje horizontal · compuesto",["Pectoral"]],
[1,[2,5,21],"empuje inclinado · compuesto",["Pectoral superior"]],
[1,[3,6],"empuje declinado · compuesto",["Pectoral"]],
[1,[11,12],"press en suelo · compuesto",["Pectoral"]],
[1,[13,15,16],"aducción horizontal · aislamiento",["Pectoral"]],
[1,[14,18],"aperturas ascendentes · aislamiento",["Pectoral superior"]],
[2,[1,2,3,5,6,7,8,9,11],"tracción vertical bilateral · compuesto",["Dorsal"]],
[2,[4],"tracción vertical unilateral · compuesto",["Dorsal"]],
[2,[12,13],"remo sin apoyo · compuesto",["Espalda media","Dorsal"]],
[2,[15,16,17,19,20],"remo con apoyo · compuesto",["Espalda media","Dorsal"]],
[2,[14,18],"remo unilateral · compuesto",["Espalda media","Dorsal"]],
[2,[23,24],"remo corporal · compuesto",["Espalda media","Dorsal"]],
[3,[1,4],"press vertical de pie · compuesto",["Deltoides"]],
[3,[2,3,6,7],"press vertical sentado · compuesto",["Deltoides"]],
[3,[9,10,11],"abducción de hombro · aislamiento",["Deltoides lateral"]],
[3,[12,13],"flexión de hombro · aislamiento",["Deltoides anterior"]],
[3,[14,15,16],"abducción horizontal posterior · aislamiento",["Deltoides posterior"]],
[3,[18,19],"elevación escapular en Y · aislamiento",["Trapecio inferior"]],
[3,[20,22],"rotación externa · aislamiento",["Manguito rotador"]],
[3,[23,24],"elevación escapular · aislamiento",["Trapecio superior"]],
[4,[1,2,3,4,12,17],"flexión supinada del codo · aislamiento",["Bíceps"]],
[4,[5,14],"flexión del codo con brazo atrás · aislamiento",["Bíceps"]],
[4,[6,7],"flexión neutra del codo · aislamiento",["Braquial","Braquiorradial"]],
[4,[8,9,10],"flexión del codo con apoyo · aislamiento",["Bíceps"]],
[5,[1,2,3],"extensión de codo en polea · aislamiento",["Tríceps"]],
[5,[4,5],"extensión de codo sobre cabeza · aislamiento",["Tríceps"]],
[5,[6,7],"extensión de codo tumbado · aislamiento",["Tríceps"]],
[5,[13,14],"extensión de codo con brazo atrás · aislamiento",["Tríceps"]],
[6,[1,3],"flexión de muñeca · aislamiento",["Flexores del antebrazo"]],
[6,[2,4],"extensión de muñeca · aislamiento",["Extensores del antebrazo"]],
[7,[1,2,3,4,5],"sentadilla bilateral · compuesto",["Cuádriceps","Glúteos"]],
[7,[15,16,17],"sentadilla dividida con pie elevado · compuesto",["Cuádriceps","Glúteos"]],
[7,[23,24,25],"prensa bilateral · compuesto",["Cuádriceps","Glúteos"]],
[7,[27,28],"extensión de rodilla · aislamiento",["Cuádriceps"]],
[8,[4,5,6],"bisagra rumana bilateral · compuesto",["Isquiotibiales","Glúteos"]],
[8,[12,13,14,15],"flexión de rodilla · aislamiento",["Isquiotibiales"]],
[9,[1,2,3],"extensión de cadera en banco · compuesto",["Glúteos"]],
[9,[5,6],"puente de cadera en suelo · compuesto",["Glúteos"]],
[9,[7,9],"extensión de cadera unilateral · aislamiento",["Glúteos"]],
[9,[10,12,14],"abducción de cadera · aislamiento",["Abductores"]],
[9,[11,13,18],"aducción de cadera · aislamiento",["Aductores"]],
[10,[1,3,4,5,6,7],"flexión plantar con rodilla extendida · aislamiento",["Gastrocnemio"]],
[10,[2],"flexión plantar con rodilla flexionada · aislamiento",["Sóleo"]],
[10,[9,10],"dorsiflexión de tobillo · aislamiento",["Tibial anterior"]],
[11,[1,2,3,4],"flexión de tronco · aislamiento",["Abdominales"]],
[11,[7,8],"elevación colgado · compuesto",["Abdominales","Flexores de cadera"]],
[11,[13,15],"anti-extensión isométrica · estabilización",["Abdominales"]],
[11,[20,21],"anti-rotación · estabilización",["Abdominales"]],
];
const meta=new Map();for(const[c,nums,group,muscles]of definitions)for(const n of nums)meta.set("ej_"+String(c).padStart(2,"0")+"_"+String(n).padStart(3,"0"),{group,muscles});
function equipment(name,id){
 const n=name.toLowerCase();
 if(n.includes("smith"))return ["smith"];
 if(n.includes("polea"))return ["cable"];
 if(n.includes("banda"))return ["band"];
 if(n.includes("suspensión"))return ["suspension"];
 if(n.includes("asistidas en máquina"))return ["assisted_station"];
 if(n.includes("dominadas")||n.includes("colgado")||n.includes("chin-up"))return ["pullup"];
 if(n.includes("mancuerna"))return ["dumbbell",...(/press|inclinado|predicador|aperturas|pájaros|pecho apoyado/.test(n)?["bench"]:[])];
 if(n.includes("barra ez"))return ["ez",...(/predicador|tumbado/.test(n)?["bench"]:[])];
 if(n.includes("barra"))return ["barbell",...(/banca|inclinado|declinado|suelo|tumbado|apoyado|sentado/.test(n)?["bench"]:[]),...(n.includes("sentadilla")?["rack"]:[])];
 if(n.includes("prensa de piernas")||n.includes("talones en prensa"))return ["leg_press"];
 if(n.includes("press de pecho en máquina"))return ["chest_machine"];
 if(n.includes("press de hombros en máquina"))return ["shoulder_machine"];
 if(n.includes("remo en máquina"))return ["row_machine"];
 if(n.includes("jalón en máquina"))return ["lat_machine"];
 if(n.includes("aperturas en máquina")||n.includes("apertura inversa en máquina"))return ["fly_machine"];
 if(n.includes("curl predicador en máquina"))return ["curl_machine"];
 if(n.includes("rodilla")&&n.includes("máquina"))return ["leg_extension"];
 if(n.includes("curl femoral")&&n.includes("máquina"))return ["leg_curl"];
 if(n.includes("hip thrust en máquina"))return ["hip_machine"];
 if(n.includes("abducción")&&n.includes("máquina"))return ["abductor"];
 if(n.includes("aducción")&&n.includes("máquina"))return ["adductor"];
 if(n.includes("talones")&&n.includes("máquina"))return ["calf_machine"];
 if(n.includes("crunch en máquina"))return ["abs_machine"];
 if(n.includes("máquina"))return ["unverified_machine"];
 if(n.includes("hip thrust"))return ["bench"];
 if(n.includes("prensa"))return ["leg_press"];
 if(n.includes("balón"))return ["ball"];
 if(n.includes("kettlebell"))return ["kettlebell"];
 if(n.includes("cinta"))return ["treadmill"];
 if(n.includes("bicicleta reclinada"))return ["bike"];
 if(n.includes("ciclismo indoor"))return ["cycling"];
 if(n.includes("elíptica"))return ["elliptical"];
 if(n.includes("escaladora")||n.includes("stepper"))return ["stairs"];
 if(n.includes("remo ergómetro"))return ["rower"];
 return [];
}
function profile(name,category){const n=name.toLowerCase();if(/asistidas en máquina|fondos asistidos/.test(n))return "assisted_reps";if(category===15)return "distance_time";if(category===16||/plancha|isométric|hold|estático|sujeción|suspensión pasiva/.test(n))return /carga|discos|barra/.test(n)?"weight_duration":"duration";if(/sin carga|flexiones|dominadas|fondos|colgado/.test(n)&&!/lastre/.test(n))return "reps";if(category===12)return "reps";return "weight_reps";}
const overrides={
 ej_01_009:{equipment:["smith","bench"]},ej_01_011:{equipment:["barbell"]},ej_01_012:{equipment:["dumbbell"]},
 ej_01_020:{equipment:["bench"]},ej_01_021:{equipment:["bench"]},ej_01_022:{equipment:["unverified_machine"]},
 ej_02_001:{equipment:["lat_machine"]},ej_02_002:{equipment:["lat_machine"]},ej_02_003:{equipment:["lat_machine"]},
 ej_02_011:{equipment:["unverified_machine"]},ej_02_023:{equipment:["barbell","rack"],profile:"reps"},ej_02_024:{equipment:["suspension"],profile:"reps"},
 ej_03_007:{equipment:["smith","bench"]},ej_03_011:{equipment:["lateral_machine"]},
 ej_09_001:{equipment:["barbell","bench"]},ej_09_003:{equipment:["smith","bench"]},ej_09_005:{equipment:[],profile:"reps"},
 ej_11_001:{equipment:[],profile:"reps"},ej_11_002:{equipment:["barbell"]},ej_11_015:{equipment:["barbell"],profile:"weight_duration"}
};
const catalog=source.categorias.flatMap((c,ci)=>c.ejercicios.map(e=>{const m=meta.get(e.id),override=overrides[e.id]??{},eq=override.equipment??equipment(e.nombre,e.id);return {id:e.id,name:e.nombre,category:c.nombre,group:m?.group??null,muscles:m?.muscles??[],equipment:eq,laterality:/unilateral|una mano|una pierna|un brazo|a un lado|alterno/i.test(e.nombre)?"unilateral":"bilateral",profile:override.profile??profile(e.nombre,ci+1),reviewed:!!m&&!eq.includes("unverified_machine")};}));
mkdirSync(new URL("../data/",import.meta.url),{recursive:true});
writeFileSync(new URL("../data/catalog.json",import.meta.url),JSON.stringify(catalog,null,2)+"\n");
console.log(JSON.stringify({total:catalog.length,classified:catalog.filter(e=>e.reviewed).length}));

