import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test, after } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  cacheDir: "node_modules/.vite-governance-tests",
  server: { middlewareMode: true },
  appType: "custom",
});
after(() => server.close());
const parsers = await server.ssrLoadModule(
  "/src/lib/hyperlane-governance-parsers.ts",
);
const config = await server.ssrLoadModule("/src/data/hyperlane-governance.ts");
const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/hyperlane-governance.json", import.meta.url),
    "utf8",
  ),
);
const safe = parsers.parseSafeConfig(fixture.safe);
const pending = {
  ...fixture.transaction,
  nonce: 4,
  isExecuted: false,
  isSuccessful: null,
  transactionHash: null,
};

test("Safe quorum is not execution and an earlier nonce blocks an approved transaction", () => {
  const action = parsers.parseSafeAction(
    pending,
    safe,
    "bnb",
    "https://bscscan.com",
  );
  assert.equal(action.status, "Quorum recorded");
  assert.equal(action.active, true);
  assert.equal(action.confirmations, 4);
  assert.match(
    parsers.parseSafeAction({ ...pending, nonce: 5 }, safe, "bnb", "").status,
    /earlier nonce first/,
  );
});
test("Consumed nonces and failed executions are not pending approvals", () => {
  const consumed = parsers.parseSafeAction(
    { ...pending, nonce: 3 },
    safe,
    "bnb",
    "",
  );
  assert.equal(consumed.active, false);
  assert.equal(consumed.status, "Nonce already used");
  const failed = parsers.parseSafeAction(
    { ...fixture.transaction, isSuccessful: false },
    safe,
    "bnb",
    "",
  );
  assert.equal(failed.active, false);
  assert.equal(failed.status, "Execution failed");
});
test("Pending Safe approvals only count distinct current owners, with unknown configuration explicit", () => {
  const reduced = {
    ...safe,
    members: safe.members.filter(
      (m) => !pending.confirmations.some((c) => c.owner === m),
    ),
  };
  assert.equal(
    parsers.parseSafeAction(pending, reduced, "bnb", "").confirmations,
    0,
  );
  const unknown = parsers.parseSafeAction(pending, undefined, "bnb", "");
  assert.equal(unknown.confirmations, undefined);
  assert.equal(unknown.status, "Configuration unavailable");
  const repeated = {
    ...pending,
    confirmations: [
      ...pending.confirmations,
      {
        ...pending.confirmations[0],
        owner: pending.confirmations[0].owner.toLowerCase(),
      },
    ],
  };
  assert.equal(
    parsers.parseSafeAction(repeated, safe, "bnb", "").confirmations,
    4,
  );
});
test("Terra matching uses message targets, not proposal summaries or arbitrary strings", () => {
  assert.equal(parsers.matchesTerraContracts(fixture.proposal.messages), true);
  assert.equal(
    parsers.matchesTerraContracts({
      summary: config.terraContracts[0].address,
      title: "Hyperlane",
    }),
    false,
  );
  assert.equal(
    parsers.matchesTerraContracts([
      { contract: `${config.terraContracts[0].address}suffix` },
    ]),
    false,
  );
  assert.equal(
    parsers.matchesTerraContracts([
      { messages: [{ contract: config.terraContracts[0].address }] },
    ]),
    true,
  );
  assert.equal(parsers.parseTerraAction(fixture.proposal).status, "Voting");
  assert.equal(
    parsers.parseTerraAction({
      ...fixture.proposal,
      status: "PROPOSAL_STATUS_FAILED",
    }).active,
    false,
  );
});
test("Squads config decodes actual public account and rejects wrong program/type and truncated bytes", () => {
  const result = parsers.parseSquadsConfig(fixture.squads);
  assert.equal(result.threshold, 4);
  assert.equal(result.members.length, 6);
  assert.equal(result.voters, 6);
  assert.equal(result.transactionIndex, 0);
  assert.equal(result.vault, config.squads.vault);
  assert.throws(() =>
    parsers.parseSquadsConfig({
      ...fixture.squads,
      owner: "11111111111111111111111111111111",
    }),
  );
  assert.throws(() =>
    parsers.parseSquadsConfig({
      ...fixture.squads,
      data: [Buffer.from([0, 1, 2]).toString("base64"), "base64"],
    }),
  );
});
function decode58(text) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = 0n;
  for (const char of text) n = n * 58n + BigInt(alphabet.indexOf(char));
  return Buffer.from(n.toString(16).padStart(64, "0"), "hex");
}
function proposalAccount(variant, index = 1) {
  const u64 = (n) => {
    const b = Buffer.alloc(8);
    b.writeBigUInt64LE(BigInt(n));
    return b;
  };
  return {
    owner: config.squads.program,
    data: [
      Buffer.concat([
        Buffer.from(parsers.proposalDiscriminator),
        decode58(config.squads.multisig),
        u64(index),
        Buffer.from([variant]),
        ...(variant === 4 ? [] : [u64(1_790_000_000)]),
        Buffer.from([255]),
        Buffer.alloc(12),
      ]).toString("base64"),
      "base64",
    ],
  };
}
test("Squads approved, executing, executed, and stale proposals remain distinct", () => {
  const cfg = {
    ...parsers.parseSquadsConfig(fixture.squads),
    transactionIndex: 2,
  };
  assert.equal(
    parsers.parseSquadsProposal(proposalAccount(3), "proposal", cfg).status,
    "Approved",
  );
  assert.equal(
    parsers.parseSquadsProposal(proposalAccount(4), "proposal", cfg).status,
    "Executing",
  );
  assert.equal(
    parsers.parseSquadsProposal(proposalAccount(5), "proposal", cfg).active,
    false,
  );
  const stale = parsers.parseSquadsProposal(proposalAccount(3), "proposal", {
    ...cfg,
    staleTransactionIndex: 1,
  });
  assert.equal(stale.active, false);
  assert.match(stale.status, /Stale/);
  assert.equal(
    parsers.parseSquadsProposal(proposalAccount(5), "proposal", {
      ...cfg,
      staleTransactionIndex: 1,
    }).status,
    "Executed",
  );
});
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
