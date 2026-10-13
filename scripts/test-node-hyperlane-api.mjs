import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

// Run through `npm run test:node-api` to build the real production bundle first.
// External providers fail deterministically in the child process. No chain data
// is recorded, and no mock is loaded by the application's normal entry points.
test("Node production serves both Hyperlane APIs before the HTML fallback", { timeout: 20_000 }, async (t) => {
  const child = spawn(process.execPath, ["--input-type=module", "--eval", `
    import { Server } from "node:http";
    const listen = Server.prototype.listen;
    Server.prototype.listen = function (...args) {
      this.once("listening", () => process.send({ port: this.address().port }));
      return listen.apply(this, args);
    };
    globalThis.fetch = async () => new Response("", { status: 503 });
    await import("./server.js");
  `], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    env: { ...process.env, NODE_ENV: "production", PORT: "0" },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  const exited = once(child, "exit");
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      const force = setTimeout(() => child.kill("SIGKILL"), 6_000);
      try { await exited; } finally { clearTimeout(force); }
    }
  });
  const [message] = await Promise.race([
    once(child, "message", { signal: AbortSignal.timeout(10_000) }),
    exited.then(() => { throw new Error(`Production server exited before listening:\n${output}`); }),
  ]);
  const base = `http://127.0.0.1:${message.port}`;
  for (const route of ["validators", "governance"]) {
    const url = `${base}/api/hyperlane/${route}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    assert.equal(response.status, 200, `${route}: ${output}`);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.equal(response.headers.get("cache-control"), "public, max-age=30");
    const snapshot = await response.json();
    if (route === "validators") {
      assert.equal(snapshot.validatorAnnounceStatus, "unavailable");
      assert.equal(snapshot.summary.announcedValidatorCount, null);
      assert.ok(Array.isArray(snapshot.validators));
      const repeated = await fetch(url);
      assert.equal((await repeated.json()).fetchedAt, snapshot.fetchedAt);
    } else {
      assert.equal(snapshot.networks.length, 4);
    }
    const rejected = await fetch(url, { method: "POST" });
    assert.equal(rejected.status, 405);
    assert.equal(rejected.headers.get("allow"), "GET");
    await rejected.text();
  }
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  await page.text();
});
