# Glossary

Use this glossary to learn about terms specific to the Terra Classic Protocol.

## Active set

Top validators that participate in consensus and earn rewards. If more than the configured maximum of validators want to join the active set, the validator with the lowest self-bond is removed from the active set.

## Airdrops

Additional rewards given to delegators through specific validators, separate from staking rewards. Terra ecosystem protocols may distribute airdrops to boost visibility. Claim them via the protocol’s website.

## Algorithmic stablecoin

Crypto asset that tracks another asset’s price via software rules instead of collateral.

## Arbitrage

Profiting from price differences across markets. Traders buy in one market and sell in another at a higher price.

## Blockchain

Immutable ledger of transactions replicated across a network of independent computers.

## Blocks

Grouped transactions stored on the blockchain. Validators batch, verify, and sign blocks.

## bLUNA

Legacy token representing bonded LUNA used historically on protocols like Anchor and Mirror. Bonded positions took 21 days to unbond.

## Bonded validator

Validator in the active set participating in consensus and earning rewards.

## Bonding

Delegating or staking LUNC to a validator to receive rewards. Validators never take custody of delegator funds.

## Burn

Permanent destruction of tokens. Terra protocol historically burned LUNC to mint stablecoins, and vice versa.

## CHAI

Korean mobile payments app powered by Terra’s blockchain.

## Columbus-5

Current Terra Classic mainnet version.

## Commission

Validator’s share of staking rewards retained before distributing the remainder to delegators.

## Community pool

On-chain fund accessible via governance proposals for ecosystem projects.

## Consensus

Process by which validators agree that each block of transactions is valid. Terra uses Tendermint consensus. See the official [Tendermint docs](https://docs.tendermint.com/).

## Cosmos SDK

Open-source framework used to build Terra’s blockchain. See the [Cosmos SDK docs](https://docs.cosmos.network/).

## dApp

Application built on a decentralized platform.

## DDoS

Distributed denial of service attack that floods a network with requests to disrupt service.

## DeFi

Decentralized finance—financial applications operating without traditional intermediaries.

## Delegate

Action of bonding LUNC to a validator to earn rewards.

## Delegator

Account that bonds or stakes LUNC to a validator and earns rewards.

## Epoch

Time window measured in blocks. Governance epochs last 100,800 blocks (~7.7 days at 6.6 s block time).

## Fees

- **Gas**: Compute fee added to every transaction to prevent spam. Validators set minimum gas prices.
- **Spread fee**: Historical fee on Terra↔LUNC swaps.
- **Tobin tax**: Historical fee on Terra stablecoin swaps.

Refer to the [fees guide](./fees.md).

## Fiat currency

Government-issued currency not backed by another asset (e.g., USD).

## Full node

Server that validates and broadcasts transactions on the Terra mainnet. All validators run full nodes.

## LUNC

Terra Classic staking/governance token. On-chain micro-denom remains `uluna`.

## Governance

On-chain process allowing stakers to update the protocol via proposals and voting.

## Governance proposal

Formal request for a protocol change. Types include parameter changes, community pool spends, and text proposals.

## IBC

Inter-Blockchain Communication protocol enabling cross-chain asset transfers.

## Inactive set

Validators outside the active set. They neither sign blocks nor earn rewards.

## Jailed

Status applied to misbehaving validators. Jailed validators leave the active set until unjailed.

## Market swap

Terra Station action routing through the market module to swap between Terra stablecoins or Terra and LUNC. Incurs gas plus Tobin or spread fees when enabled.

### Examples

- Swapping UST for KRT charged gas and Tobin tax.
- Swapping LUNC for UST charged gas and spread fee.

## Mint

Creation of new tokens. Opposite of burn.

## Miss

Consensus vote that fails to be included in a block.

## Module

Logical component of Terra Core implementing a specific feature.

## Oracle

Module that aggregates exchange-rate votes from validators. Drives pricing for stablecoin mechanisms.

## Peg

Fixed exchange ratio between an asset and its reference value (e.g., 1 UST ↔ 1 USD historically).

## Pools

Token groupings used in swap or liquidity mechanics.

## Proof of Stake

Consensus model where validators are selected to propose blocks based on staked tokens.

## Quorum

Minimum participation (40% of staked LUNC) required for a governance vote to be valid.

## Redelegate

Move bonded LUNC from one validator to another instantly, subject to a 21-day cooldown between the same source and destination validators.

## Rewards

Staking income (gas, taxes, historical swap fees) distributed to validators and delegators.

## SDR

IMF Special Drawing Rights. Terra historically used TerraSDR as its reference unit.

## Seigniorage

Value captured when minting currency. On Classic, all seigniorage is burned.

## Self-delegation

LUNC that a validator stakes to itself.

## Slashing

Penalty applied to validators for misbehaviour (double-signing, downtime, oracle faults).

## Slippage

Difference between expected and executed trade price.

## Stake

Total LUNC bonded to a validator.

## Staking

Bonding LUNC to a validator to secure the network and earn rewards.

## Tendermint consensus

Two-round voting process securing Terra Classic. Validators propose, vote, and commit blocks via Tendermint.

## Terra Classic Core

Golang reference implementation of the Terra Classic protocol.

## Terra Classic mainnet

Live network where all Terra Classic transactions occur.

## Terra Classic stablecoins

Stable assets that historically tracked fiat currencies via algorithmic supply changes. Names mirror underlying currency codes (e.g., TerraUSD `UST`, TerraKRW `KRT`).

## `terrad`

CLI for interacting with a Terra node.

## `terravaloper` address

Validator operator address starting with `terravaloper`.

## Testnet

Non-production network (`rebel-2`) used for testing and dry runs.

## Terra ecosystem

Network of dApps built on Terra Classic.

## Terra protocol

Open-source blockchain for algorithmic stablecoins.

## Tobin tax

Historical fee on Terra stablecoin swaps (rates available via oracle LCD). Disabled on Classic.

## Tombstone

State applied to validators that double-sign. Tombstoned validators cannot rejoin consensus.

## Total stake

Aggregate LUNC bonded to a validator, including self-bond.

## Unbonded validator

Validator outside the active set and not participating in consensus.

## Unbonding validator

Validator transitioning out of the active set; does not sign blocks or earn rewards.

## Unbonded LUNC

Liquid LUNC not currently staked.

## Unbonding

Process of unstaking LUNC. Takes 21 days with no rewards accrued.

## Unbonding LUNC

LUNC currently in the unbonding period and not transferable.

## Undelegate

Action to start unbonding LUNC from a validator (21-day wait).

## Uptime

Percentage of time a validator is online and signing blocks. Low uptime risks slashing.

## Validator

Node operator verifying transactions, participating in consensus, and voting in governance. Top 130 by stake form the active set.

## Weight

Validator’s total stake, used for block proposer selection and governance voting power.
