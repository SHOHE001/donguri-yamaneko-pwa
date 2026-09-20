const CACHE_PREFIX = `donguri-yamaneko:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const LEGACY_CACHE_NAME = "donguri-yamaneko-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./reader-utils.js",
  "./manifest.webmanifest",
  "./content/donguri-yamaneko.html",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];
const APP_SHELL_URLS = new Set(APP_SHELL.map((path) => new URL(path, self.registration.scope).href));
const INDEX_URL = new URL("./index.html", self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([...APP_SHELL_URLS])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) =>
        key === LEGACY_CACHE_NAME || (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      ).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const resourceURL = `${url.origin}${url.pathname}`;
  if (!APP_SHELL_URLS.has(resourceURL)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() =>
      caches.open(CACHE_NAME).then((cache) => cache.match(INDEX_URL))
    ));
    return;
  }
  event.respondWith(
    caches.open(CACHE_NAME)
      .then((cache) => cache.match(resourceURL))
      .then((cached) => cached || fetch(event.request))
  );
});
