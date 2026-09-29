import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  cacheDir: "node_modules/.vite-governance-tests",
  server: { middlewareMode: true },
  appType: "custom",
});
after(() => server.close());
test("Unavailable providers stay unavailable instead of reporting zero pending actions", async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response("", { status: 429 });
  };
  try {
    const { loadHyperlaneGovernanceSnapshot } = await server.ssrLoadModule(
      "/src/lib/hyperlane-governance-status.ts",
    );
    const snapshot = await loadHyperlaneGovernanceSnapshot();
    assert.equal(snapshot.networks.length, 4);
    for (const network of snapshot.networks) {
      assert.equal(network.pending.data, undefined);
      assert.ok(network.pending.error);
      assert.equal(network.configuration.data, undefined);
      assert.ok(network.configuration.error);
      assert.equal(network.authorities.data, undefined);
      assert.ok(network.authorities.error);
    }
    assert.ok(requests <= 50, `Unexpected provider fan-out: ${requests}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
