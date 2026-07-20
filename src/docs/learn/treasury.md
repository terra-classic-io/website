The Terra Classic **Community Pool** is the network's community-governed reserve. Its balances are held by the Cosmos SDK distribution module and can be allocated through on-chain governance. The live panel above queries the blockchain directly; it does not contain manually entered balances.

> **Community Pool, not the legacy Treasury module.** Terra Classic still contains historical `x/treasury` code and documentation from the original protocol design. That legacy monetary-policy module is no longer the mechanism that manages community spending. The governed funds shown here belong to the Community Pool.

## What is the on-chain Treasury?

In everyday community discussion, “Treasury” usually refers to assets that can fund network development, infrastructure, security work, integrations, and other approved initiatives. On-chain, those governed reserves are represented by the Community Pool in the distribution module.

The pool can hold several kinds of assets:

- **LUNC**, the native staking, governance, and gas asset.
- **Terra Classic fiat-denominated assets**, including USTC and the other native denominations supported by the chain.
- **IBC assets** transferred to Terra Classic from connected networks.

A balance appearing in the Community Pool does not by itself mean that the asset is liquid, actively traded, or worth its historical reference value.

## How funds move

1. **Funds enter the pool.** Assets can be routed to the Community Pool by protocol logic or deposited explicitly with `MsgFundCommunityPool`.
2. **A proposal is submitted.** A governance proposal can request a Community Pool allocation and identifies the recipient, amount, and denomination.
3. **The community votes.** LUNC stakers vote during the on-chain voting period according to the current governance parameters.
4. **Approved spending is executed.** When a valid spending proposal passes, the distribution module releases the approved assets to the specified recipient.

The balances are public and independently verifiable. A payment leaving the pool should be traceable to an executed on-chain message and its governance context.

## Understanding the live snapshot

The live dashboard reads three public data sets:

- **Community Pool balances** from the Cosmos SDK distribution query.
- **Governance proposals** from the Governance v1 query.
- **Latest block information** to show the chain height and time associated with the current session.

The interface refreshes automatically and uses several public LCD endpoints as fallbacks. If every endpoint is temporarily unavailable, the page keeps this explanatory documentation visible instead of displaying invented or cached balances as current data.

You can inspect the primary [Community Pool API response](https://terra-classic-lcd.publicnode.com/cosmos/distribution/v1beta1/community_pool) and [Governance API response](https://terra-classic-lcd.publicnode.com/cosmos/gov/v1/proposals?pagination.limit=10&pagination.reverse=true) directly.

## Treasury balances and market liquidity

Community Pool holdings and market liquidity measure different things:

- **Treasury balance** is the amount controlled by the Community Pool.
- **Market liquidity** is the amount available for trading in a specific DEX pool or order book.
- **Market value** depends on an executable price and sufficient liquidity for the amount being valued.

For that reason, the dashboard does not label Community Pool balances as DEX liquidity and does not calculate a single “Treasury value” from unsupported assumptions. A reliable liquidity view must query the contracts or APIs of each supported market, identify both pool assets, normalize token decimals, and account for slippage.

An ecosystem-wide liquidity total can be added later when there is a maintained registry of the relevant DEX factories and pool contracts. That registry is necessary to avoid presenting an incomplete total as comprehensive.

## Governance and accountability

Before evaluating a Community Pool spending proposal, review:

- the exact recipient address and denomination;
- the requested amount relative to the available pool balance;
- the deliverables, milestones, and reporting commitments;
- whether payments are one-time, recurring, or milestone-based;
- any conflicts of interest or operational dependencies;
- the final on-chain execution after the proposal passes.

The live list links each proposal to a governance explorer for easier review. The blockchain remains the authoritative source for its status and messages.

## Risks and limitations

- Public LCD endpoints can be unavailable, rate-limited, or temporarily behind the latest block.
- Community Pool amounts use on-chain base denominations and may include decimal rewards accumulated by the distribution module.
- IBC hashes do not reveal their original asset without resolving the corresponding denomination trace.
- A large token balance does not guarantee a large realizable market value.
- Governance approval does not remove execution, delivery, legal, or counterparty risk.
- Users should verify important figures against more than one independent endpoint before making decisions.

## Technical references

- [Cosmos SDK distribution module](https://docs.cosmos.network/sdk/latest/modules/distribution/README)
- [Cosmos SDK governance module](https://docs.cosmos.network/sdk/latest/modules/gov/README)
- [Terra Classic distribution module reference](/docs/develop/module-specifications/distribution)
- [Terra Classic legacy Treasury module reference](/docs/develop/module-specifications/treasury)
- [Terra Classic public network endpoints](/docs/full-node/network-endpoints)

## FAQ

### Is the Community Pool the same as `x/treasury`?

No. The Community Pool is part of the distribution module and is the relevant governed reserve for community spending. The legacy `x/treasury` module documents historical monetary-policy mechanics that are no longer effectively used for this purpose.

### Does the page show all Terra Classic liquidity?

No. It shows governed Community Pool holdings. DEX liquidity is spread across individual pool contracts and requires a separate, maintained market registry before it can be aggregated responsibly.

### Why can the figures be unavailable?

The public endpoints may be restarting, rate-limiting requests, or temporarily unreachable from the visitor's network. The refresh button retries the configured endpoints without changing any on-chain state.
