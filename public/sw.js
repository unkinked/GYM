const SHELL="gym-personal-shell-v1",ASSETS="gym-personal-assets-v1";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("message",event=>{
 if(event.data?.type==="CLEAR"){event.waitUntil(Promise.all([caches.delete(SHELL),caches.delete(ASSETS)]));return;}
 if(event.data?.type!=="CACHE_SHELL")return;
 event.waitUntil((async()=>{try{const shell=await caches.open(SHELL),response=await fetch("/",{credentials:"same-origin",cache:"reload"});if(!response.ok||response.redirected||!response.headers.get("content-type")?.includes("text/html"))return;await shell.put("/",response);const assets=await caches.open(ASSETS),urls=["/manifest.webmanifest","/icon.svg","/icon-192.png","/icon-512.png",...(event.data.assets??[])].filter(url=>new URL(url,self.location.origin).origin===self.location.origin);await Promise.all(urls.map(async url=>{const r=await fetch(url,{credentials:"same-origin"});if(r.ok&&!r.redirected)await assets.put(url,r);}));event.source?.postMessage({type:"OFFLINE_READY"});}catch{}})());
});
self.addEventListener("fetch",event=>{const request=event.request,url=new URL(request.url);if(request.method!=="GET"||url.origin!==self.location.origin||url.pathname.startsWith("/api/")||url.pathname.startsWith("/signin")||url.pathname.startsWith("/signout")||url.pathname==="/callback")return;
 if(request.mode==="navigate"){event.respondWith((async()=>{try{const response=await fetch(request);if(response.ok&&!response.redirected&&url.pathname==="/"&&response.headers.get("content-type")?.includes("text/html")){const cache=await caches.open(SHELL);await cache.put("/",response.clone());}return response;}catch{const fallback=await caches.match("/",{cacheName:SHELL});return fallback??new Response("Abre Gym Personal una vez con conexión para descargar tu rutina.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});}})());return;}
 if(/\.(?:js|css|png|svg|woff2?)(?:$)/.test(url.pathname)||url.pathname==="/manifest.webmanifest"){event.respondWith((async()=>{const cache=await caches.open(ASSETS),hit=await cache.match(request);if(hit)return hit;const response=await fetch(request);if(response.ok&&!response.redirected)await cache.put(request,response.clone());return response;})());}
});
