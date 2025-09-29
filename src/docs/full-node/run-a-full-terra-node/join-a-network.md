## Bootstrapping workflow

1. Provision the host and build `terrad` by following the [Build Terra Core](/docs/full-node/overview/build-terra-core) prerequisites bundled inside each validator playbook.
2. Download the latest genesis, address book, and snapshots published by trusted community mirrors.
3. Start `terrad`, confirm sync status, and register the validator or full node as described in the network-specific guides below.

## Select your target network

### Mainnet (*columbus-5*)

- Follow the [dedicated guide](/docs/full-node/overview/validator-columbus-5) for:
  - Current Terra Classic Core and oracle-feeder versions.
  - Public RPC/LCD endpoints.
  - Snapshot sources, hardware sizing, and validator registration commands.
- The document also covers oracle feeder configuration, unbonding, and troubleshooting specific to mainnet operations.

### Testnet (*rebel-2*)

- Use the [dedicated guide](/docs/full-node/overview/validator-rebel-2) to practise upgrades and validator workflows.
- The guide lists the latest rebel-2 release tag, faucet links, and rebuild/snapshot procedures maintained by the testnet operators.

## Related references

- [Build Terra Core](/docs/full-node/overview/build-terra-core) — shared steps for checking out the correct Terra Core tag, installing Go, and compiling `terrad` before joining any network.
- [Validator Resources](/docs/full-node/overview/validator-resources) — curated links for snapshots, tooling, and community coordination channels.

> **Tip**
> For development-only scenarios, consider running `terrad` locally (see [Localnet](/docs/develop/how-to/terra-core-localnet)) instead of joining a public network.
