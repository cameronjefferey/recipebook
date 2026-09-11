/* The Pink Recipe Box service worker.
 *
 * Goal is narrow: a recipe she has already opened must work in the kitchen
 * with no signal, and must not sit behind the ~1 minute cold start of a
 * sleeping free-tier server. Everything else can require the network.
 */

const VERSION = "v2";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const IMAGES = `images-${VERSION}`;

const KEEP = new Set([PAGES, ASSETS, IMAGES]);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !KEEP.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

/** Signing out must not leave the previous person's recipes on the device. */
self.addEventListener("message", (event) => {
  if (event.data === "clear-caches") {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))),
    );
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    // Never cache a redirect to the sign-in page as though it were the page.
    if (response.ok && !response.redirected) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Uploading and transcribing must always hit the network.
  if (url.pathname.startsWith("/api/captures")) return;

  // A shared book belongs to somebody else and can be taken back. Keeping a
  // copy on the guest's device would make "take the link back" a half-truth,
  // so these always ask the server and are never stored.
  if (
    url.pathname.startsWith("/shared/") ||
    url.pathname.startsWith("/api/shared/")
  ) {
    return;
  }

  // Stored photos never change once written.
  if (url.pathname.startsWith("/api/images/")) {
    event.respondWith(cacheFirst(request, IMAGES));
    return;
  }

  // Hashed build output is immutable.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, ASSETS));
    return;
  }

  // Recipe pages: fresh when possible, from the last visit when not.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES));
  }
});
