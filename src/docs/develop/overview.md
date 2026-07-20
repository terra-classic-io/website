Terra Classic is an open-source, community-maintained blockchain built with Cosmos SDK and CosmWasm. Use this page as the starting point for applications, smart contracts, integrations, and contributions to the network.

## Quick Start

| Step | Goal | Guide |
| --- | --- | --- |
| **1. Set up your environment** | Install the tools and dependencies required for CosmWasm development. | [Prepare your local environment](/docs/develop/smart-contracts/set-up-local-environment) |
| **2. Write your code** | Create a contract with entry points, state, messages, and tests. | [Write a smart contract](/docs/develop/smart-contracts/write-smart-contract) |
| **3. Test locally** | Run a local Terra Classic network before using a public chain. | [Run Terra Classic localnet](/docs/develop/terra-core-localnet) |
| **4. Deploy and iterate** | Store, instantiate, execute, and query a contract safely. | [Interact with smart contracts](/docs/develop/smart-contracts/interact-with-smart-contract) |

> **Start small**
>
> Validate transactions and contract behaviour on a local network or testnet before deploying to Terra Classic mainnet. Review fees, tax handling, permissions, and migration paths as part of every release.

## Key Resources

| Resource | What it provides |
| --- | --- |
| [Terra Classic Core](https://github.com/classic-terra/core) | Source code, releases, issues, and protocol development. |
| [Public network endpoints](/docs/full-node/network-endpoints) | LCD, RPC, gRPC, and other public infrastructure endpoints. |
| [Builder tooling](/docs/develop/builder-tooling) | SDKs, API references, and recommended application tooling. |
| [CosmES SDK](/docs/develop/builder-tooling/cosmes) | Terra Classic TypeScript helpers for queries, wallets, transactions, and CosmWasm. |
| [Smart contract guides](/docs/develop/smart-contracts) | End-to-end CosmWasm development and deployment tutorials. |
| [Module specifications](/docs/develop/module-specifications) | Technical reference for Terra Classic Core modules and chain-specific behaviour. |

## Choose a Development Path

### Build an application

Use [CosmES](/docs/develop/builder-tooling/cosmes) to connect wallets, query chain data, compose messages, and broadcast transactions from a TypeScript application.

### Build a smart contract

Follow the [smart contract workflow](/docs/develop/smart-contracts) to prepare a Rust and CosmWasm environment, write a contract, test it, and interact with its deployed instance.

### Integrate chain data

Start with the [public network endpoints](/docs/full-node/network-endpoints). Select an endpoint appropriate for browser queries, server workloads, indexing, or operational monitoring, and plan for endpoint fallback and rate limits.

### Contribute to the protocol

Review [Terra Classic Core](https://github.com/classic-terra/core), its open issues, current releases, and the relevant [module specifications](/docs/develop/module-specifications) before proposing a protocol change.

## Terra Classic-specific Considerations

- Review [transaction best practices](/docs/develop/tx-best-practices) before composing or broadcasting messages.
- Confirm the active chain ID, fee denomination, gas settings, and endpoint network before signing.
- Treat public endpoints as shared infrastructure and implement timeouts, retries, and fallback providers.
- Test contract migrations and privileged operations with the same care as initial deployments.
- Keep SDK and Terra Classic Core versions explicit so builds remain reproducible.

## Stay Current

Terra Classic development changes through community releases and contributions. Use these sources instead of relying on hard-coded update cards:

- [Terra Classic Core releases](https://github.com/classic-terra/core/releases) for protocol and binary changes.
- [Documentation repository](https://github.com/terra-classic-io/website) for guides, corrections, and documentation contributions.
- [Terra Classic Core issues](https://github.com/classic-terra/core/issues) for active engineering discussions and known problems.

## Contributing

If a guide is incomplete or no longer matches current network behaviour, use **Improve on GitHub** to edit the Markdown source for that page. For protocol changes, open an issue or pull request in the relevant Terra Classic repository and include reproducible tests whenever possible.
