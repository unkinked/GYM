// Local-only production QA gateway. Never included in the Worker entrypoint.
import http from "node:http";
const target="http://127.0.0.1:5174";
http.createServer(async(req,res)=>{
 if(req.url==="/__mobile"){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gym Personal · Mobile QA</title><style>body{margin:0;background:#090d07;display:flex;justify-content:center}iframe{width:390px;height:100vh;border:0;flex-shrink:0}</style><iframe title="Gym Personal móvil" src="/"></iframe>');return;}
 try{const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value&&!["host","connection","content-length"].includes(key))headers.set(key,Array.isArray(value)?value.join(","):value);headers.set("oai-authenticated-user-id","qa-browser");headers.set("oai-authenticated-user-email","qa-browser@example.test");if(headers.has("origin"))headers.set("origin",target);
 const chunks=[];for await(const chunk of req)chunks.push(chunk);const response=await fetch(target+req.url,{method:req.method,headers,redirect:"manual",...(req.method!=="GET"&&req.method!=="HEAD"?{body:Buffer.concat(chunks)}:{})});res.writeHead(response.status,Object.fromEntries([...response.headers].filter(([k])=>!["content-encoding","content-length","transfer-encoding"].includes(k))));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(503);res.end("Servidor de prueba no disponible.");}
}).listen(5180,"127.0.0.1",()=>console.log("Production QA: http://127.0.0.1:5180/ · Mobile layout: /__mobile"));

