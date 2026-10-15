import assert from "node:assert/strict";
import { test, beforeEach, afterEach, after } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  cacheDir: "node_modules/.vite-validator-tests",
  server: { middlewareMode: true },
  appType: "custom",
});
const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
const originalNow = Date.now;
const originalWarn = console.warn;
beforeEach(() => {
  server.moduleGraph.invalidateAll();
  console.warn = () => {};
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalCaches === undefined) delete globalThis.caches;
  else globalThis.caches = originalCaches;
  Date.now = originalNow;
  console.warn = originalWarn;
});
after(() => server.close());

const loadStatus = () => server.ssrLoadModule("/src/lib/hyperlane-validator-status.ts");
const loadRequests = () => server.ssrLoadModule("/src/lib/hyperlane-validator-requests.ts");
const address = (index) => `0x${index.toString(16).padStart(40, "0")}`;
const word = (value) => value.toString(16).padStart(64, "0");
const json = (value) => Response.json(value);
const unavailable = () => new Response("", { status: 503 });

// Generated test responses, never recorded chain state or application fallbacks.
function mockProviders({ announceFailure = false, storageFailure = false, merkleFailure = false, count = 1, locations = 1, checkpoint = "9" } = {}) {
  const addresses = Array.from({ length: count }, (_, index) => address(index + 1));
  const metrics = { calls: 0, active: 0, maxActive: 0, checkpoints: [], locationQuerySize: 0 };
  globalThis.fetch = async (input, init) => {
    metrics.calls++;
    metrics.active++;
    metrics.maxActive = Math.max(metrics.maxActive, metrics.active);
    await new Promise((resolve) => setTimeout(resolve, 1));
    try {
      const url = String(input);
      if (url.includes("/smart/")) {
        const query = JSON.parse(atob(decodeURIComponent(url.split("/smart/")[1])));
        if (query.get_announced_validators) {
          return announceFailure ? unavailable() : json({ data: { validators: addresses } });
        }
        if (query.get_announce_storage_locations) {
          const requested = query.get_announce_storage_locations.validators;
          metrics.locationQuerySize = requested.length;
          return storageFailure ? unavailable() : json({ data: { storage_locations: requested.map((validator) => [validator,
            Array.from({ length: locations }, (_, index) => `s3://test-bucket/us-east-1/${validator}/${index}`),
          ]) } });
        }
        return merkleFailure ? unavailable() : json({ data: { count: 10 } });
      }
      if (url.includes("amazonaws.com")) {
        metrics.checkpoints.push(url);
        return new Response(checkpoint);
      }
      const rpc = JSON.parse(init.body);
      if (rpc.method === "eth_call") {
        return json({ result: `0x${word(64)}${word(1)}${word(1)}${word(1)}` });
      }
      return unavailable();
    } finally {
      metrics.active--;
    }
  };
  return metrics;
}

test("An unavailable Terra announcement list produces unknown flags and count, including after JSON serialization", async () => {
  mockProviders({ announceFailure: true });
  const { loadHyperlaneValidatorSnapshot } = await loadStatus();
  const snapshot = JSON.parse(JSON.stringify(await loadHyperlaneValidatorSnapshot()));
  assert.equal(snapshot.validatorAnnounceStatus, "unavailable");
  assert.equal(snapshot.summary.announcedValidatorCount, null);
  assert.equal(snapshot.summary.currentCheckpointCount, null);
  assert.equal(snapshot.validators.length, 1);
  assert.equal(snapshot.validators[0].announced, null);
});

test("A successfully loaded empty announcement list still means not announced and zero", async () => {
  mockProviders({ count: 0 });
  const { loadHyperlaneValidatorSnapshot } = await loadStatus();
  const snapshot = await loadHyperlaneValidatorSnapshot();
  assert.equal(snapshot.validatorAnnounceStatus, "ready");
  assert.equal(snapshot.summary.announcedValidatorCount, 0);
  assert.equal(snapshot.validators[0].announced, false);
});

for (const failure of ["storageFailure", "merkleFailure"]) {
  test(`${failure} preserves a successfully read announcement`, async () => {
    mockProviders({ [failure]: true });
    const { loadHyperlaneValidatorSnapshot } = await loadStatus();
    const snapshot = await loadHyperlaneValidatorSnapshot();
    assert.equal(snapshot.validatorAnnounceStatus, "ready");
    assert.equal(snapshot.summary.announcedValidatorCount, 1);
    assert.equal(snapshot.validators[0].announced, true);
    assert.equal(snapshot.validators[0].checkpointCurrent, undefined);
  });
}

test("Large validator and location lists stay within the global budget; incomplete checks stay unknown", async () => {
  const metrics = mockProviders({ count: 40, locations: 8, checkpoint: "0" });
  const { loadHyperlaneValidatorSnapshot } = await loadStatus();
  const snapshot = await loadHyperlaneValidatorSnapshot();
  assert.equal(snapshot.summary.announcedValidatorCount, 40);
  assert.equal(snapshot.validators.length, 40);
  assert.ok(metrics.calls <= 48);
  assert.ok(metrics.maxActive <= 6);
  assert.equal(metrics.locationQuerySize, 32);
  assert.ok(metrics.checkpoints.length > 0);
  const queried = new Map();
  for (const url of metrics.checkpoints) {
    const validator = new URL(url).pathname.split("/")[1];
    queried.set(validator, (queried.get(validator) ?? 0) + 1);
  }
  assert.ok([...queried.values()].every((value) => value <= 3));
  assert.ok(snapshot.validators.every((validator) => validator.announced === true));
  assert.ok(snapshot.validators.every((validator) => validator.checkpointCurrent === undefined));
});

test("Complete checkpoint checks can establish current and behind states", async () => {
  const { loadHyperlaneValidatorSnapshot } = await loadStatus();
  mockProviders({ checkpoint: "9" });
  assert.equal((await loadHyperlaneValidatorSnapshot()).validators[0].checkpointCurrent, true);
  mockProviders({ checkpoint: "8" });
  assert.equal((await loadHyperlaneValidatorSnapshot()).validators[0].checkpointCurrent, false);
  mockProviders({ checkpoint: "" });
  assert.equal((await loadHyperlaneValidatorSnapshot()).validators[0].checkpointIndex, undefined);
});

test("Concurrent refreshes and subsequent reads share a snapshot; expiry loads fresh data", async () => {
  const metrics = mockProviders();
  const { getHyperlaneValidatorSnapshot } = await loadStatus();
  const snapshots = await Promise.all(Array.from({ length: 20 }, () => getHyperlaneValidatorSnapshot()));
  assert.ok(snapshots.every((snapshot) => snapshot === snapshots[0]));
  const firstCalls = metrics.calls;
  assert.equal(await getHyperlaneValidatorSnapshot(), snapshots[0]);
  assert.equal(metrics.calls, firstCalls);
  const future = originalNow() + 60_001;
  Date.now = () => future;
  assert.notEqual(await getHyperlaneValidatorSnapshot(), snapshots[0]);
  assert.equal(metrics.calls, firstCalls * 2);
});

test("Unavailable provider snapshots are briefly reused, preventing retry storms", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return unavailable(); };
  const { getHyperlaneValidatorSnapshot } = await loadStatus();
  const first = await getHyperlaneValidatorSnapshot();
  const firstCalls = calls;
  assert.equal(await getHyperlaneValidatorSnapshot(), first);
  assert.equal(calls, firstCalls);
  assert.equal(first.summary.announcedValidatorCount, null);
});

test("Timeout covers a stalled response body and cancels its request", async () => {
  const { createValidatorRequests, VALIDATOR_REQUEST_LIMITS } = await loadRequests();
  let signal;
  globalThis.fetch = async (_, init) => {
    signal = init.signal;
    return new Response(new ReadableStream({ start() {} }));
  };
  const requests = createValidatorRequests({ ...VALIDATOR_REQUEST_LIMITS, requestTimeoutMs: 20 });
  try {
    await assert.rejects(requests.read("https://test.invalid"), /timed out/);
    assert.equal(signal.aborted, true);
  } finally { requests.dispose(); }
});

test("Global deadline drains queued reads without starting more network calls", async () => {
  const { createValidatorRequests, VALIDATOR_REQUEST_LIMITS } = await loadRequests();
  let calls = 0;
  globalThis.fetch = () => { calls++; return new Promise(() => {}); };
  const requests = createValidatorRequests({ ...VALIDATOR_REQUEST_LIMITS, concurrency: 2, snapshotTimeoutMs: 25 });
  try {
    const started = Date.now();
    const results = await Promise.allSettled(Array.from({ length: 10 }, () => requests.read("https://test.invalid")));
    assert.ok(results.every((result) => result.status === "rejected"));
    assert.equal(calls, 2);
    assert.ok(Date.now() - started < 1_000);
  } finally { requests.dispose(); }
});

test("Oversized response bodies are rejected", async () => {
  const { createValidatorRequests, VALIDATOR_REQUEST_LIMITS } = await loadRequests();
  globalThis.fetch = async () => new Response("x".repeat(100));
  const requests = createValidatorRequests({ ...VALIDATOR_REQUEST_LIMITS, responseBytes: 10 });
  try { await assert.rejects(requests.read("https://test.invalid"), /size limit/); }
  finally { requests.dispose(); }
});

test("Worker response cache ignores query variations and survives loader instance replacement", async () => {
  const metrics = mockProviders();
  const entries = new Map();
  globalThis.caches = { open: async () => ({
    match: async (key) => entries.get(key)?.clone(),
    put: async (key, response) => { entries.set(key, response.clone()); },
  }) };
  let { hyperlaneValidatorResponse } = await server.ssrLoadModule("/src/lib/hyperlane-validator-response.ts");
  const first = await hyperlaneValidatorResponse("https://site.invalid/api/hyperlane/validators?refresh=1");
  const firstBody = await first.json();
  const firstCalls = metrics.calls;
  assert.equal(entries.size, 1);
  assert.match(first.headers.get("Cache-Control"), /^public, max-age=\d+$/);
  server.moduleGraph.invalidateAll();
  ({ hyperlaneValidatorResponse } = await server.ssrLoadModule("/src/lib/hyperlane-validator-response.ts"));
  const second = await hyperlaneValidatorResponse("https://site.invalid/api/hyperlane/validators?refresh=2");
  assert.deepEqual(await second.json(), firstBody);
  assert.equal(metrics.calls, firstCalls);
});

test("Cache failures still return live results", async () => {
  mockProviders();
  globalThis.caches = { open: async () => { throw new Error("cache unavailable"); } };
  const { hyperlaneValidatorResponse } = await server.ssrLoadModule("/src/lib/hyperlane-validator-response.ts");
  const response = await hyperlaneValidatorResponse("https://site.invalid/api/hyperlane/validators");
  assert.equal((await response.json()).summary.announcedValidatorCount, 1);
});
