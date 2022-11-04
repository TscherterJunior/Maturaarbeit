const cacheadress = "Omphali"
const assets = [
  "/",
  "/index.html",
  "/main.js",
  //"/vendor/",
  "/vendor/bss.js",
  "/vendor/mergerino.js",
  "/vendor/mithril.js",
  "/vendor/qr-scanner-worker.min.js",
  "/vendor/qr-scanner.min.js",
  "/icon.png",
  //"http://localhost/api.php?get",
  "/favicon.ico"
 // "http://localhost/api.php/get?id=lorem"
]

self.addEventListener("install", installEvent => {
  self.skipWaiting()
  installEvent.waitUntil(
    caches.open(cacheadress).then(cache => {
      cache.addAll(assets).catch((e) => {
		  console.log(e)
	  })
    })
  )
})

  self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
      caches.match(fetchEvent.request).then(res => {
        //console.log(fetchEvent.request,"t")
        return res || fetch(fetchEvent.request)
      })
    )
  })

  self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
  });

  self.addEventListener("message",(m) => {
    //console.log(m.data)
    if (m.data.type == "doinstal"){
      caches.open(cacheadress).then(cache => {
        cache.addAll([`https://ompha.li/api.php?id=${m.data.trail}`])
      })
    }
    else if(m.data.type == "dodelete"){
      caches.open(cacheadress).then(cache => {
        cache.delete(`https://ompha.li/api.php?id=${m.data.trail}`)
      })
    }
  })