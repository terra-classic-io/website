import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { needsLightLogoBacking } from "../src/components/project-map/logo-backing.ts";

const affected = [
  "applications/base.png", "applications/terra-classic-money.png",
  "cex/bitget.png", "cex/btcc.png", "cex/bybit.svg", "cex/lbank.svg", "cex/phemex.svg",
  "dex/garuda.png", "entertainment/galacticshift.png",
  "for-developers/github.svg", "infrastructure/nownodes.svg", "tools/luncdash.png",
  "validators/discord.svg",
];

test("known dark artwork gets a backing only in dark mode", () => {
  for (const asset of affected) {
    assert.ok(existsSync(new URL(`../public/logos/${asset}`, import.meta.url)), asset);
    assert.equal(needsLightLogoBacking("dark", `/logos/${asset}`), true, asset);
    assert.equal(needsLightLogoBacking("light", `/logos/${asset}`), false, asset);
  }
});

test("colorful, pre-backed, dark-variant, hub, and missing logos stay unchanged", () => {
  for (const asset of [
    "/logos/cex/binance.svg", "/logos/cex/bitmart.png", "/logos/dex/osmosis.svg",
    "/logos/dex/mdex.svg",
    "/logos/cex/bybit-dark.svg", "/logos/tokens/terra-classic.svg", undefined, "",
  ]) {
    assert.equal(needsLightLogoBacking("dark", asset), false, asset);
    assert.equal(needsLightLogoBacking("light", asset), false, asset);
  }
});
