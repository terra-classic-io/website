## Hyperlane on Terra Classic

Hyperlane provides permissionless interoperability infrastructure for sending messages and moving assets between Terra Classic and other supported networks.

The Terra Classic deployment currently connects LUNC and USTC with BNB Smart Chain, Ethereum, and Solana through Hyperlane Warp routes. Independent Hyperlane validators observe the Terra Classic contracts, sign checkpoints, and publish the data required by relayers to verify cross-chain messages.

## Choose a guide

| Goal | Guide |
| --- | --- |
| Verify core contracts, token addresses, mints, and Warp route programs | [Contracts and Warp routes](/docs/develop/hyperlane/contracts) |
| Operate a Terra Classic Hyperlane validator | [Run a Hyperlane validator](/docs/develop/hyperlane/validator) |

## Before using the bridge

- Confirm that every address matches the current Hyperlane Registry entry and the relevant block explorer.
- Verify the deployment's current ownership and security configuration.
- Use small amounts for initial bridge tests.
- Confirm the destination network before signing a transaction.

The [Terra Classic Bridge](https://terraclassic-bridge.xyz/) provides the user interface. Developers and operators should treat the [Hyperlane Registry](https://github.com/hyperlane-xyz/hyperlane-registry) as the technical source of truth for registered deployments.
