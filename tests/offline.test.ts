import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

describe("production offline cache", () => {
  it("precaches current entry bundles and their lazy chunks on first install", async () => {
    const listeners = new Map<string, (event: { waitUntil(promise: Promise<unknown>): void }) => void>();
    const html = '<script type="module" src="/assets/index-main.js"></script><link rel="stylesheet" href="/assets/index-main.css">';
    const files: Record<string, string> = {
      "/assets/index-main.js": 'const deps=["assets/RunnerView-lazy.js","assets/three-lazy.js","assets/Stage3D-lazy.js"]',
      "/assets/index-main.css": "body{}",
      "/assets/RunnerView-lazy.js": "export {}",
      "/assets/three-lazy.js": "export {}",
      "/assets/Stage3D-lazy.js": "export {}"
    };
    const shell = {
      addAll: vi.fn(async () => undefined),
      match: vi.fn(async (path: string) => (path === "/index.html" ? new Response(html) : undefined))
    };
    const staticCache = { put: vi.fn(async () => undefined) };
    const caches = {
      open: vi.fn(async (name: string) => (name.includes("shell") ? shell : staticCache)),
      keys: vi.fn(async () => []),
      delete: vi.fn(async () => true),
      match: vi.fn(async () => undefined)
    };
    const fetch = vi.fn(async (path: string) => new Response(files[path], { status: files[path] === undefined ? 404 : 200 }));
    const self = {
      location: { origin: "https://blokblitz.test" },
      clients: { claim: vi.fn(async () => undefined) },
      skipWaiting: vi.fn(async () => undefined),
      addEventListener: (type: string, listener: (event: { waitUntil(promise: Promise<unknown>): void }) => void) => listeners.set(type, listener)
    };

    runInNewContext(readFileSync("public/sw.js", "utf8"), { caches, fetch, self, Response, URL, Set, Promise, Error });
    let installPromise = Promise.resolve();
    listeners.get("install")?.({ waitUntil: (promise) => (installPromise = Promise.resolve(promise).then(() => undefined)) });
    await installPromise;

    expect(shell.addAll).toHaveBeenCalledWith(["/", "/index.html", "/favicon.svg", "/site.webmanifest"]);
    expect(fetch.mock.calls.map(([path]) => path).sort()).toEqual(Object.keys(files).sort());
    expect(staticCache.put).toHaveBeenCalledTimes(5);
    expect(self.skipWaiting).toHaveBeenCalledTimes(1);
  });
});
