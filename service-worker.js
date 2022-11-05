const cacheadress = "Omphali"
const assets = [
  "/",
  "/index.html",
  "/main.js",
  "/vendor/bss.js",
  "/vendor/mergerino.js",
  "/vendor/mithril.js",
  "/vendor/qr-scanner-worker.min.js",
  "/vendor/qr-scanner.min.js",
  "/icon.png",
  "/favicon.ico"
]

self.addEventListener("install", installEvent => { // on install event
  self.skipWaiting()
  installEvent.waitUntil(
    caches.open(cacheadress).then(cache => {      // cache öffnen 
      cache.addAll(assets)  // in assets gelistete dateien cachen
    })
  )
})

  self.addEventListener("fetch", fetchEvent => { // interupt fetch
    fetchEvent.respondWith(
      caches.match(fetchEvent.request).then(res => { // wenn die angeforderte datei gecacht ist mit der gecachten version antworten
        return res || fetch(fetchEvent.request)
      })
    )
  })

  self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());  // service worker in aktiven zustand versetzen 
  });

  self.addEventListener("message",(m) => { // messages werden verwendet um dem service worker zu sagen welcher trail installiert oder denistalliert werden soll
    if (m.data.type == "doinstal"){ // install
      caches.open(cacheadress).then(cache => {
        cache.addAll([`https://ompha.li/api.php?id=${m.data.trail}`])
      })
    }
    else if(m.data.type == "dodelete"){ // deinstall
      caches.open(cacheadress).then(cache => {
        cache.delete(`https://ompha.li/api.php?id=${m.data.trail}`)
      })
    }
  })