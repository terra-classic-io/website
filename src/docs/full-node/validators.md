Terra Classic validators operate the infrastructure that proposes and signs blocks, keeps the network available, participates in governance, and reports oracle exchange rates. Use this page as the starting point for planning, launching, and maintaining a validator responsibly.

## Start validating

| Step | Goal | Guide |
| --- | --- | --- |
| **1. Understand the role** | Review consensus, staking, rewards, governance, and slashing before committing capital or infrastructure. | [Terra Classic protocol](/docs/learn/protocol) |
| **2. Design the infrastructure** | Prepare hardened validator and sentry nodes with sufficient compute, storage, networking, and monitoring. | [Production environment](/docs/full-node/overview/set-up-production) |
| **3. Build and synchronize** | Install the current Terra Core release, join the correct network, and verify that the node is fully synchronized. | [Full-node overview](/docs/full-node/overview) |
| **4. Join the validator set** | Create the validator transaction, configure commission carefully, and deploy the oracle feeder. | [Validate on columbus-5](/docs/full-node/overview/validator-columbus-5) |

> **Validator keys control consensus power**
>
> Keep consensus and account keys outside public-facing infrastructure. Document recovery procedures, maintain encrypted offline backups, and test operational changes before applying them to a production validator.

## Core responsibilities

### Consensus and uptime

Validators must remain synchronized and sign consensus votes reliably. Monitor missed blocks, peer connectivity, disk latency, memory pressure, clock drift, and process health. Extended downtime can remove a validator from the active set or trigger protocol penalties.

### Oracle participation

Terra Classic validators submit exchange-rate votes through the oracle feeder. Operate the feeder independently from public APIs where practical, monitor vote success, and keep its configuration aligned with the active network parameters and supported software release.

### Governance

Validators review and vote on governance proposals with the voting power delegated to them. Delegators can submit their own vote and override the validator's choice for their stake. Publish a clear governance policy and explain important votes to delegators.

### Delegator communication

Keep the validator identity, commission policy, contact channels, and operational status current. Announce maintenance and incidents promptly, and never imply that staking rewards or uptime are guaranteed.

## Recommended architecture

| Layer | Responsibility |
| --- | --- |
| **Validator node** | Signs consensus messages and accepts inbound connections only from trusted sentries. |
| **Sentry nodes** | Relay peer traffic and isolate the validator from direct internet exposure. |
| **Oracle feeder** | Collects approved market inputs and broadcasts oracle votes using an authorized feeder account. |
| **Monitoring** | Tracks synchronization, missed blocks, voting, peers, storage, system resources, and service availability. |
| **Backups and recovery** | Protects configuration, key material, validator state, and documented restoration procedures. |

Use private networking between the validator and its sentries. Restrict RPC, LCD, gRPC, Prometheus, and administrative services to trusted networks or authenticated access.

## Mainnet and testnet paths

### Columbus-5 mainnet

Follow the [columbus-5 validator guide](/docs/full-node/overview/validator-columbus-5) for production deployment, validator creation, oracle feeder setup, and operational checks. Confirm the current chain ID, software release, minimum gas prices, and governance parameters before broadcasting transactions.

### Rebel-2 testnet

Use the [rebel-2 validator guide](/docs/full-node/overview/validator-rebel-2) to rehearse installation, upgrades, monitoring, and recovery procedures without putting a mainnet validator at risk.

## Operational checklist

- Run the current stable Terra Core release and review upgrade instructions before every network update.
- Maintain multiple trusted peers and verify sentry connectivity from the validator node.
- Alert on missed blocks, oracle vote failures, synchronization drift, storage growth, and expiring certificates.
- Keep enough LUNC in operational accounts for transaction fees without exposing treasury funds.
- Review commission settings before creating the validator; some parameters cannot be changed later.
- Test backups and restoration procedures on isolated infrastructure.
- Apply operating-system and dependency updates through a documented maintenance process.
- Prepare an incident-response plan for key compromise, double-sign risk, data corruption, and network outages.

## Validator resources

| Resource | Purpose |
| --- | --- |
| [Public network endpoints](/docs/full-node/network-endpoints) | Reference endpoints for verification, fallback queries, and operational testing. |
| [System configuration](/docs/full-node/overview/system-configuration) | Hardware, operating-system, and networking prerequisites. |
| [Build Terra Core](/docs/full-node/overview/build-terra-core) | Compile the current Terra Classic node software from source. |
| [Synchronization guide](/docs/full-node/overview/sync) | Restore snapshots, replay chain data, and verify synchronization. |
| [Troubleshooting](/docs/full-node/overview/troubleshoot) | Diagnose configuration drift, startup failures, and node health. |
| [Validator ecosystem directory](/ecosystem?cat=validators) | Monitoring tools, infrastructure providers, and validator community channels. |

## Before going live

Do not create a production validator until the node is synchronized, the sentry topology is tested, monitoring is active, backups are verified, and the oracle feeder is submitting successfully. Start on testnet when validating a new architecture or operating procedure.
