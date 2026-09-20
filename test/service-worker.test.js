import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../sw.js", import.meta.url), "utf8");
const scope = "https://example.test/reader/";
const cacheName = `donguri-yamaneko:${scope}:v2`;

function worker({ entries = [], cacheNames = [cacheName], network = async () => new Response("network") } = {}) {
  const listeners = new Map();
  const cached = new Map(entries);
  const calls = { opened: [], deleted: [], fetched: [], precached: [], claimed: 0, skipped: 0 };
  const cache = {
    match: async (url) => cached.get(url),
    addAll: async (urls) => { calls.precached.push(...urls); },
  };
  vm.runInNewContext(source, {
    URL,
    self: {
      location: new URL("sw.js", scope),
      registration: { scope },
      addEventListener: (name, handler) => listeners.set(name, handler),
      skipWaiting: () => { calls.skipped++; },
      clients: { claim: async () => { calls.claimed++; } },
    },
    caches: {
      keys: async () => cacheNames,
      delete: async (name) => { calls.deleted.push(name); return true; },
      open: async (name) => {
        calls.opened.push(name);
        assert.equal(name, cacheName, "must open only this installation's current cache");
        return cache;
      },
      match: () => { throw new Error("origin-wide cache lookup must not be used"); },
    },
    fetch: async (request) => { calls.fetched.push(request.url); return network(request); },
  });
  return {
    calls,
    async lifecycle(name) {
      let pending;
      listeners.get(name)({ waitUntil: (promise) => { pending = promise; } });
      await pending;
    },
    request(path, { method = "GET", mode = "cors" } = {}) {
      let response;
      const request = { url: new URL(path, scope).href, method, mode };
      listeners.get("fetch")({ request, respondWith: (promise) => { response = promise; } });
      return response;
    },
  };
}

test("install precaches the app shell in this registration's own cache", async () => {
  const sw = worker();
  await sw.lifecycle("install");
  assert.deepEqual(sw.calls.opened, [cacheName]);
  assert.ok(sw.calls.precached.includes(`${scope}index.html`));
  assert.ok(sw.calls.precached.includes(`${scope}content/donguri-yamaneko.html`));
  assert.ok(sw.calls.precached.every((url) => url.startsWith(scope)));
  assert.equal(sw.calls.skipped, 1);
});

test("activate deletes only owned obsolete caches and the known legacy cache", async () => {
  const obsolete = `donguri-yamaneko:${scope}:v1`;
  const sw = worker({ cacheNames: [
    cacheName, obsolete, "donguri-yamaneko-v1", "another-pwa-v1",
    "donguri-yamaneko:https://example.test/another-reader/:v1",
  ] });
  await sw.lifecycle("activate");
  assert.deepEqual(sw.calls.deleted, [obsolete, "donguri-yamaneko-v1"]);
  assert.equal(sw.calls.claimed, 1);
});

test("app assets are read from the current cache without origin-wide lookup", async () => {
  const response = new Response("own app styles");
  const sw = worker({ entries: [[`${scope}styles.css`, response]] });
  assert.equal(await sw.request("styles.css"), response);
  assert.deepEqual(sw.calls.opened, [cacheName]);
  assert.deepEqual(sw.calls.fetched, []);
});

test("query strings on app shell URLs can still use the offline shell", async () => {
  const response = new Response("own app module");
  const sw = worker({ entries: [[`${scope}app.js`, response]] });
  assert.equal(await sw.request("app.js?source=installed"), response);
  assert.deepEqual(sw.calls.fetched, []);
});

test("uncached app assets fall back to the network", async () => {
  const response = new Response("network asset");
  const sw = worker({ network: async () => response });
  assert.equal(await sw.request("styles.css"), response);
  assert.deepEqual(sw.calls.fetched, [`${scope}styles.css`]);
});

test("unrelated requests are left to the browser", () => {
  const sw = worker();
  for (const path of ["https://other.test/reader/app.js", "/another-app/index.html", "api/session", "unlisted.js"]) {
    assert.equal(sw.request(path), undefined);
    assert.equal(sw.request(path, { mode: "navigate" }), undefined);
  }
  assert.equal(sw.request("index.html", { method: "POST" }), undefined);
  assert.deepEqual(sw.calls.opened, []);
  assert.deepEqual(sw.calls.fetched, []);
});

test("navigation prefers the network when online", async () => {
  const online = new Response("online document");
  const sw = worker({
    entries: [[`${scope}index.html`, new Response("offline document")]],
    network: async () => online,
  });
  assert.equal(await sw.request("./", { mode: "navigate" }), online);
  assert.deepEqual(sw.calls.opened, []);
});

test("offline navigation falls back to this app's own index document", async () => {
  const offline = new Response("offline document");
  const sw = worker({
    entries: [[`${scope}index.html`, offline]],
    network: async () => { throw new TypeError("Offline"); },
  });
  assert.equal(await sw.request("./?source=installed", { mode: "navigate" }), offline);
  assert.deepEqual(sw.calls.opened, [cacheName]);
});
