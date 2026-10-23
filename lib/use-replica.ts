"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Entity, EntityValue, Kind, Replica, SyncResult } from "./types";
import { emptyReplica, mergeSync, putLocal, resolveConflict } from "./domain";
import { readReplica, writeReplica } from "./local-db";
export function useReplica(owner:string){
 const [replica,setReplica]=useState<Replica>(emptyReplica(owner)),[ready,setReady]=useState(false),[online,setOnline]=useState(true),[syncing,setSyncing]=useState(false),[error,setError]=useState(""),[lastSync,setLastSync]=useState<string|null>(null);
 const current=useRef(replica),flight=useRef(false),writes=useRef<Promise<void>>(Promise.resolve()),mounted=useRef(true);
 const persist=useCallback((next:Replica)=>{current.current=next;setReplica(next);writes.current=writes.current.then(()=>writeReplica(next)).catch(()=>{setError("No pudimos guardar en este dispositivo. No cierres la app; exporta un respaldo.");});},[]);
 useEffect(()=>{mounted.current=true;setOnline(navigator.onLine);readReplica(owner).then(value=>{if(mounted.current){current.current=value;setReplica(value);setReady(true);}}).catch(()=>{setError("El navegador no permitió abrir el almacenamiento local. Activa el almacenamiento del sitio para entrenar.");});const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener("online",on);window.addEventListener("offline",off);return()=>{mounted.current=false;window.removeEventListener("online",on);window.removeEventListener("offline",off);};},[owner]);
 const commit=useCallback((kind:Kind,value:EntityValue)=>{try{persist(putLocal(current.current,kind,value));return true;}catch(e){setError(e instanceof Error?e.message:"No pudimos guardar.");return false;}},[persist]);
 const sync=useCallback(async()=>{
  if(flight.current||!navigator.onLine)return false;flight.current=true;setSyncing(true);
  try{
   await writes.current;
   const operations=current.current.outbox.slice(0,100);
   const response=await fetch("/api/sync",{method:operations.length?"POST":"GET",...(operations.length?{headers:{"Content-Type":"application/json"},body:JSON.stringify({operations})}:{}),cache:"no-store"});
   const data=await response.json() as {error?:string;results?:SyncResult[];records?:Entity[]};
   if(!response.ok)throw new Error(data.error??"No se pudo sincronizar.");
   persist(mergeSync(current.current,data.results??[],data.records??[]));setError("");setLastSync(new Date().toISOString());return true;
  }catch(e){setError(e instanceof TypeError||e instanceof SyntaxError?"No hay conexión con el servidor. Tus cambios siguen guardados en este dispositivo.":e instanceof Error?e.message:"No se pudo sincronizar. Los cambios quedan pendientes.");return false;}
  finally{flight.current=false;setSyncing(false);}
 },[persist]);
 useEffect(()=>{if(!ready||!online||replica.conflicts.length)return;const timer=setTimeout(()=>void sync(),700);return()=>clearTimeout(timer);},[ready,online,replica.outbox.length,replica.conflicts.length,sync]);
 const acceptServer=useCallback((records:Entity[])=>persist(mergeSync(current.current,[],records)),[persist]);
 const resolve=useCallback((key:string,choice:"local"|"remote")=>persist(resolveConflict(current.current,key,choice)),[persist]);
 const replace=useCallback((next:Replica)=>persist(next),[persist]);
 return {replica,ready,online,syncing,error,lastSync,commit,sync,acceptServer,resolve,replace,current};
}
