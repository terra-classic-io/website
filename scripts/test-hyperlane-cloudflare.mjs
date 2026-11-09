import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const config = await readFile(new URL("../wrangler.toml", import.meta.url), "utf8");
const compatibilityDate = config.match(/^compatibility_date\s*=\s*"([^"]+)"/m)?.[1];
assert.ok(compatibilityDate, "Use the same compatibility date as the deployed Worker");

// Bundle the real collector into a Worker without writing build artifacts.
// Responses below are generated only in this test process, never in the app.
const entry = "virtual:hyperlane-cloudflare-test";
const bundle = await build({
  root,
  configFile: false,
  logLevel: "silent",
  ssr: { target: "webworker", noExternal: true },
  plugins: [{
    name: "hyperlane-cloudflare-test",
    resolveId(id) { if (id === entry) return `\0${entry}`; },
    load(id) {
      if (id !== `\0${entry}`) return;
      return `
        import { createValidatorRequests } from ${JSON.stringify(`${root}src/lib/hyperlane-validator-requests.ts`)};
        import { loadHyperlaneValidatorSnapshot } from ${JSON.stringify(`${root}src/lib/hyperlane-validator-status.ts`)};
        export default {
          async fetch(request) {
            if (new URL(request.url).pathname === "/snapshot") {
              return Response.json(await loadHyperlaneValidatorSnapshot());
            }
            const requests = createValidatorRequests();
            try {
              return Response.json(await requests.json("https://provider.test/", {
                method: request.method,
                body: request.method === "POST" ? JSON.stringify({ method: "eth_call" }) : undefined,
              }));
            } catch (error) {
              return Response.json({ error: String(error) }, { status: 502 });
            } finally {
              requests.dispose();
            }
          }
        };
      `;
    },
  }],
  build: {
    ssr: true,
    write: false,
    minify: false,
    rollupOptions: { input: entry, output: { inlineDynamicImports: true } },
  },
});
assert.ok(!Array.isArray(bundle));
const workerCode = bundle.output.find((item) => item.type === "chunk" && item.isEntry)?.code;
assert.ok(workerCode);

function worker(t, outboundService) {
  const runtime = new Miniflare({ modules: true, script: workerCode, compatibilityDate, outboundService });
  t.after(() => runtime.dispose());
  return runtime;
}

test("Cloudflare can read successful GET and POST provider responses", { timeout: 30_000 }, async (t) => {
  const methods = [];
  const runtime = worker(t, async (request) => {
    methods.push(request.method);
    if (request.method === "POST") assert.equal((await request.json()).method, "eth_call");
    return Response.json({ result: "available" });
  });
  for (const method of ["GET", "POST"]) {
    const response = await runtime.dispatchFetch("https://dashboard.test/provider", { method });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    assert.deepEqual(body, { result: "available" });
  }
  assert.deepEqual(methods, ["GET", "POST"]);
});

test("Cloudflare rejects redirects without following the target", { timeout: 30_000 }, async (t) => {
  const calls = [];
  const runtime = worker(t, (request) => {
    calls.push(request.url);
    return new Response(null, { status: 302, headers: { Location: "https://redirect-target.test/" } });
  });
  const response = await runtime.dispatchFetch("https://dashboard.test/provider");
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /status 302/);
  assert.deepEqual(calls, ["https://provider.test/"]);
});

test("Cloudflare returns a populated validator snapshot from working providers", { timeout: 30_000 }, async (t) => {
  const addresses = Array.from({ length: 3 }, (_, index) => `0x${(index + 1).toString(16).padStart(40, "0")}`);
  const word = (value) => value.toString(16).padStart(64, "0");
  let calls = 0;
  const runtime = worker(t, async (request) => {
    calls++;
    const url = new URL(request.url);
    if (url.pathname.includes("/smart/")) {
      const query = JSON.parse(Buffer.from(decodeURIComponent(url.pathname.split("/smart/")[1]), "base64").toString());
      if (query.get_announced_validators) return Response.json({ data: { validators: addresses } });
      if (query.get_announce_storage_locations) {
        return Response.json({ data: { storage_locations: addresses.map((address, index) => [
          address, [`s3://test-bucket/us-east-1/validator-${index}`],
        ]) } });
      }
      return Response.json({ data: { count: 7 } });
    }
    if (url.hostname.endsWith("amazonaws.com")) return new Response("6");
    const rpc = await request.json();
    if (rpc.method === "eth_call") {
      return Response.json({ result: `0x${word(64)}${word(2)}${word(3)}${[1, 2, 3].map(word).join("")}` });
    }
    assert.equal(rpc.method, "getAccountInfo");
    const account = Buffer.alloc(6 + 3 * 20 + 1);
    account[0] = 1;
    account.writeUInt32LE(3, 2);
    addresses.forEach((address, index) => Buffer.from(address.slice(2), "hex").copy(account, 6 + index * 20));
    account[account.length - 1] = 2;
    return Response.json({ result: { value: { data: [account.toString("base64"), "base64"] } } });
  });
  const response = await runtime.dispatchFetch("https://dashboard.test/snapshot");
  assert.equal(response.status, 200);
  const snapshot = await response.json();
  assert.equal(snapshot.validatorAnnounceStatus, "ready");
  assert.equal(snapshot.summary.announcedValidatorCount, 3);
  assert.equal(snapshot.summary.currentCheckpointCount, 3);
  assert.equal(snapshot.summary.availableRouteCount, 3);
  assert.equal(snapshot.summary.sharedThreshold, 2);
  assert.equal(snapshot.summary.sharedValidatorCount, 3);
  assert.ok(snapshot.routes.every((route) => route.status === "ready"));
  assert.equal(calls, 9);
});
