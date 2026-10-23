import data from "../data/catalog.json";
import type {Exercise} from "./types";
export const CATALOG = data as Exercise[];
export const EXERCISES = new Map(CATALOG.map(e=>[e.id,e]));
export const CATEGORIES = [...new Set(CATALOG.map(e=>e.category))];
export const exerciseName = (id:string) => EXERCISES.get(id)?.name??"Ejercicio desconocido";
export const equipmentLabel = (exercise:Exercise) => exercise.equipment.length?exercise.equipment.join(", "):"Peso corporal";
