Terra Classic includes a native network asset, **LUNC**, and a set of historical fiat-denominated assets created by the original Terra protocol. These assets can be transferred on-chain and integrated by wallets, exchanges, payment applications, and DeFi protocols.

> The word “stablecoin” describes the original design of these fiat-denominated assets. It is not a guarantee that an asset currently tracks its reference currency. Always verify live market data, liquidity, and counterparty risk before using or trading an asset.

## Why these assets matter

- **Multiple denominations.** Applications can represent value in familiar currency units while settling on Terra Classic.
- **Global access.** On-chain assets can be transferred without relying on banking hours.
- **Fast settlement.** Terra Classic transactions provide predictable on-chain execution and network fees.
- **Composable finance.** Wallets and applications can integrate the same native denominations into payment and DeFi experiences.

## Assets and network denominations

The directory below reflects the native denominations exposed by Terra Classic. **LUNC appears first because it is the network's native staking, governance, and gas asset. The other entries are historical fiat-denominated assets; their names do not imply a current price peg.**

<!-- ASSET_SUPPLY_TABLE -->

## How denominations work

Terra Classic represents these assets as native Cosmos SDK coins. Each asset has a base denomination used by the bank module, transaction messages, queries, and smart contracts. For example, USTC uses `uusd`, EUTC uses `ueur`, and KRTC uses `ukrw`.

Balances are stored as whole numbers in the base denomination. Terra Classic interfaces conventionally format **1,000,000 base units as one display unit**: `1,000,000 uusd` is displayed as `1 USTC`. Applications must perform this formatting themselves and must use the exact base denomination when constructing a transaction.

These assets are native denominations, not CW20 token contracts. A CosmWasm contract receives them through the transaction's native funds, while wallets and explorers query them through the chain's bank module.

## Oracle and legacy market mechanics

The original Terra protocol combined two mechanisms:

- The [oracle module](/docs/develop/module-specifications/oracle) collected exchange-rate votes from validators for whitelisted fiat denominations.
- The [market module](/docs/develop/module-specifications/market) enabled protocol swaps between LUNC and Terra stablecoins through mint-and-burn mechanics.

Following the events of May 2022, Terra Classic governance disabled the protocol market-swap paths. The legacy denominations and oracle infrastructure remain part of the chain, but the protocol no longer guarantees conversion at the referenced fiat value. Trading now depends on liquidity provided by exchanges and decentralized liquidity pools.

An oracle exchange rate is an on-chain data point used by protocol logic. It is not a redemption promise and may differ from the executable price available in a market.

## On-chain use cases

- **Native transfers:** send a supported denomination between Terra Classic accounts through the bank module.
- **Smart-contract funds:** attach native coins to CosmWasm executions when the receiving contract supports the denomination.
- **Decentralized markets:** trade or provide liquidity through active DEX pools rather than the disabled protocol market module.
- **Payments and accounting:** denominate balances or payments in a currency-referenced native asset when both parties support it.
- **IBC transfers:** move supported assets through an active IBC route when the channel, relayer, wallet, and destination chain all recognize the denomination.

Availability is not uniform. A denomination can exist on-chain while having little or no wallet integration, exchange support, IBC routing, or market liquidity.

## Risks and considerations

- Terra Classic's fiat-denominated assets are not currently guaranteed to maintain their historical pegs.
- The protocol mint-and-burn market swaps that originally supported peg arbitrage are disabled.
- An oracle rate does not guarantee that equivalent market liquidity is available.
- Low liquidity can cause substantial slippage or make an asset difficult to trade.
- Wallets, exchanges, bridges, and applications may support only a subset of the native denominations.
- Always verify the exact base denomination and destination network before signing an irreversible transaction.

## FAQ

### Is LUNC a stablecoin?

No. LUNC is the native Terra Classic asset used for staking, governance, transaction fees, and network security. The fiat-denominated assets are separate native coins on the same blockchain.

### Are Terra Classic's historical fiat-denominated assets still pegged?

No protocol-level peg is currently guaranteed. The tickers and reference currencies describe the assets' historical design, while their executable prices are determined by available market liquidity.

### What does the `u` prefix mean?

The `u` prefix identifies the micro base denomination used on-chain. For example, `uusd` is the base denomination for USTC and `uluna` is the base denomination for LUNC. User interfaces normally convert these integer base units into decimal display units.

### Can I use the Terra Classic market module to swap these assets?

No. The native market-swap messages were disabled after May 2022. Swaps rely on active centralized markets or decentralized liquidity pools.

### Does an oracle rate guarantee a market price?

No. Oracle rates are submitted on-chain for protocol use. They do not guarantee redemption, liquidity, or execution at the reported rate.
