/* Tengwar Transcriber — offline-first service worker */
var CACHE = "tengwar-v2";
var ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/transcriber.js",
  "js/tengwar-core.js",
  "js/tengwar-pua.js",
  "js/html2canvas.min.js",
  "data/phrases.json",
  "img/icon.svg",
  "img/icon-192.png",
  "img/icon-512.png",
  "fonts/TengwarAnnatar.ttf",
  "fonts/TengwarEldamar.ttf",
  "fonts/TengwarFormalCSUR.ttf",
  "fonts/AlcarinTengwar-Regular.ttf",
  "fonts/AlcarinTengwar-Bold.ttf",
  "fonts/TengwarArtano.ttf"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).catch(function () { return cached; });
    })
  );
});