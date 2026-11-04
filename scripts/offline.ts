import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
// Cache public application assets only. API responses and third-party data never enter this cache.
export function offlineShell(): Plugin {
  return {
    name: "talin-offline-shell",
    apply: "build",
    generateBundle(_options, bundle) {
      const files = [
        "/",
        "/icon.svg",
        "/apple-touch-icon.png",
        "/manifest.webmanifest",
        "/icon-192.png",
        "/icon-512.png",
        ...Object.keys(bundle)
          .filter((name) => name.endsWith(".js") || name.endsWith(".css"))
          .map((name) => `/${name}`),
      ];
      const digest = createHash("sha256").update(readFileSync("index.html"));
      for (const path of files.filter(
        (path) => !path.startsWith("/assets/") && path !== "/",
      ))
        digest.update(readFileSync(`public${path}`));
      const version = digest
        .update(JSON.stringify(files))
        .digest("hex")
        .slice(0, 16);
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const CACHE='talin-shell-${version}';
const FILES=${JSON.stringify(files)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(url=>new Request(url,{cache:'reload',credentials:'omit'})))));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('talin-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/')).then(response=>response||Response.error())));return;
 }
 if(FILES.includes(url.pathname))event.respondWith(caches.open(CACHE).then(cache=>cache.match(url.pathname)).then(response=>response||fetch(request)));
});
`,
      });
    },
  };
}
