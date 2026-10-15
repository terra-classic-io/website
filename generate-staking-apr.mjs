// Refreshes src/generated/staking-apr-fallback.json with a full on-chain measurement.
// The site serves this value whenever a live measurement is not available yet, so the
// staking APR card is never blank. If the chain cannot be reached, the existing file is kept
// and the build continues.
import { readFileSync, writeFileSync } from "fs";
import { createServer } from "vite";

const OUTPUT_FILE = "src/generated/staking-apr-fallback.json";

if (process.env.SKIP_STAKING_APR === "1") {
  console.log("Staking APR fallback: skipped (SKIP_STAKING_APR=1)");
  process.exit(0);
}

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "silent" });
try {
  const { refreshStakingApr, createMemoryStore, parseWindowBlocks } = await server.ssrLoadModule("/src/lib/staking-apr.ts");
  const result = await refreshStakingApr(createMemoryStore(), {
    windowBlocks: parseWindowBlocks(process.env.STAKING_APR_WINDOW_BLOCKS),
  });
  if (result.freshness !== "fresh") {
    const previous = JSON.parse(readFileSync(OUTPUT_FILE, "utf8"));
    console.warn(`Staking APR fallback: chain unavailable, keeping ${previous.apr.toFixed(2)}% from ${previous.computedAt}`);
  } else {
    const { freshness: _freshness, subrequests: _subrequests, refreshProgress: _progress, ...snapshot } = result;
    writeFileSync(OUTPUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`Staking APR fallback: ${snapshot.apr.toFixed(4)}% (blocks ${snapshot.fromHeight}-${snapshot.toHeight})`);
  }
} catch (error) {
  console.warn(`Staking APR fallback: not refreshed (${error instanceof Error ? error.message : error})`);
} finally {
  await server.close();
}
