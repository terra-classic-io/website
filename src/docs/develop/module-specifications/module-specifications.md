# Terra Classic Core modules

Terra Classic Core is the Golang implementation of the Terra Classic protocol, built on top of the [Cosmos SDK](https://cosmos.network/appchains) and [CometBFT](https://cometbft.com/). Use these module specifications to understand how Classic’s on-chain logic is organized and how each module contributes to validator operations, governance, and the wider economy.

## Module specs

- [Auth (`x/auth`)](./auth)
- [Authz (`x/authz`)](./authz)
- [Bank (`x/bank`)](./bank)
- [Capability (`x/capability`)](./capability)
- [Consensus Params (`x/consensus`)](./consensus)
- [Crisis (`x/crisis`)](./crisis)
- [Distribution (`x/distribution`)](./distribution)
- [DynComm (`x/dyncomm`)](./dyncomm)
- [Evidence (`x/evidence`)](./evidence)
- [Feegrant (`x/feegrant`)](./feegrant)
- [GenUtil (`x/genutil`)](./genutil)
- [Governance (`x/gov`)](./governance)
- [IBC Core (`x/ibc`)](./ibc)
- [IBC Fee (`x/ibc-fee`)](./ibc-fee)
- [IBC Hooks (`x/ibc-hooks`)](./ibc-hooks)
- [Interchain Accounts (`x/ica`)](./ica)
- [Market (`x/market`)](./market)
- [Mint (`x/mint`)](./mint)
- [Oracle (`x/oracle`)](./oracle)
- [Params (`x/params`)](./params)
- [Slashing (`x/slashing`)](./slashing)
- [Staking (`x/staking`)](./staking)
- [Tax (`x/tax`)](./tax)
- [Tax Exemption (`x/taxexemption`)](./taxexemption)
- [Treasury (`x/treasury`)](./treasury)
- [Token Transfer (`x/transfer`)](./transfer)
- [Upgrade (`x/upgrade`)](./upgrade)
- [Vesting (`x/vesting`)](./vesting)
- [Wasm (`x/wasm`)](./wasm)

## How to use these specs

Each document starts with the module’s role in the protocol and then dives into state, message handling, and block transitions. Parameter tables at the end highlight defaults and governance-controlled values. The specs are designed to supplement a direct read of the Terra Core source code and help contributors reason about Classic-specific behavior.

> **Note**
> References to seigniorage and market swaps reflect the historical behavior of the Terra protocol. On Terra Classic, seigniorage is fully burned and the market module’s swap paths are disabled to protect supply.

## Module architecture (init order)

1. `genaccounts` — import and export genesis accounts.
2. [`distribution`](./distribution) — validator and delegator rewards, community pool.
3. [`staking`](./staking) — validator set management and bonded LUNC.
4. [`auth`](./auth) — ante handler and account types (including vesting accounts).
5. [`bank`](./bank) — token transfers across accounts.
6. [`slashing`](./slashing) — penalties for downtime and double-signing.
7. [`oracle`](./oracle) — exchange-rate voting, ballot rewards, oracle slashing.
8. [`treasury`](./treasury) — monetary policy levers such as tax rate and reward weight.
9. [`gov`](./governance) — on-chain governance, parameters, proposal handlers.
10. [`market`](./market) — historical price-stabilisation logic.
11. `crisis` — halting the chain on invariant violations.
12. `genutil` — handling genesis transactions (`gentx`).

Many Terra Classic modules are inherited from the Cosmos SDK with Classic-specific parameters and custom hooks.

## Block lifecycle overview

### Begin block

- Distribution: pay rewards for the previous block.
- Slashing: check downtime and double-signing evidence.

### Process messages

- Route and execute tx messages in their respective modules.

### End block

- Crisis: assert registered invariants.
- Oracle: tally exchange-rate votes (`VotePeriod`) and penalise oracle downtime (`SlashWindow`).
- Governance: expire deposits/votes and execute passed proposals.
- Market: replenish liquidity pools (Classic swaps remain disabled).
- Treasury: adjust tax rate and reward weight at each epoch.
- Staking: recompute the top-130 active validator set.

## Conventions

### Currency denominations

- LUNC is Terra Classic’s staking and governance asset (`uluna` microunit).
- All denominations use microunits (`10^-6`) on-chain.

Price discovery relies on the [oracle module](./oracle), while the [market module](./market) historically mediated swaps using those oracle rates.
