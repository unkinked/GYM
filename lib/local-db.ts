import type { Replica } from "./types";
import { emptyReplica } from "./domain";
const DATABASE="gym-personal-v1";
let dbPromise:Promise<IDBDatabase>|undefined;
function database(){return dbPromise??=new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DATABASE,1);r.onupgradeneeded=()=>r.result.createObjectStore("replicas");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function readReplica(owner:string):Promise<Replica>{const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction("replicas").objectStore("replicas").get(owner);r.onsuccess=()=>resolve(r.result??emptyReplica(owner));r.onerror=()=>reject(r.error);});}
export async function writeReplica(replica:Replica){const db=await database();return new Promise<void>((resolve,reject)=>{const tx=db.transaction("replicas","readwrite");tx.objectStore("replicas").put(replica,replica.owner);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
export async function deleteReplica(owner:string){const db=await database();return new Promise<void>((resolve,reject)=>{const tx=db.transaction("replicas","readwrite");tx.objectStore("replicas").delete(owner);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
