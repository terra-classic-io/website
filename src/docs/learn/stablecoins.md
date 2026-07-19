Terra Classic includes a native network asset, **LUNC**, and a set of historical fiat-denominated assets created by the original Terra protocol. These assets can be transferred on-chain and integrated by wallets, exchanges, payment applications, and DeFi protocols.

> The word “stablecoin” describes the original design of these fiat-denominated assets. It is not a guarantee that an asset currently tracks its reference currency. Always verify live market data, liquidity, and counterparty risk before using or trading an asset.

## Why stablecoins matter

- **Multiple denominations.** Applications can represent value in familiar currency units while settling on Terra Classic.
- **Global access.** On-chain assets can be transferred without relying on banking hours.
- **Fast settlement.** Terra Classic transactions provide predictable on-chain execution and network fees.
- **Composable finance.** Wallets and applications can integrate the same native denominations into payment and DeFi experiences.

## Assets and network denominations

The directory below reflects the denominations exposed by Terra Classic. **LUNC appears first because it is the network's native staking and gas asset; it is not a stablecoin.**

| Asset | Network denom | Reference | Role |
| --- | --- | --- | --- |
| LUNC | `uluna` | LUNA | Native staking, governance, and gas asset |
| USTC | `uusd` | USD | Historical fiat-denominated asset |
| EUTC | `ueur` | EUR | Historical fiat-denominated asset |
| JPTC | `ujpy` | JPY | Historical fiat-denominated asset |
| KRTC | `ukrw` | KRW | Historical fiat-denominated asset |
| CHTC | `ucny` | CNH | Historical fiat-denominated asset |
| SDTC | `usdr` | SDR | Historical fiat-denominated asset |
| MNTC | `umnt` | MNT | Historical fiat-denominated asset |
| GBTC | `ugbp` | GBP | Historical fiat-denominated asset |
| INTC | `uinr` | INR | Historical fiat-denominated asset |
| CATC | `ucad` | CAD | Historical fiat-denominated asset |
| CHFC | `uchf` | CHF | Historical fiat-denominated asset |
| AUTC | `uaud` | AUD | Historical fiat-denominated asset |
| SGTC | `usgd` | SGD | Historical fiat-denominated asset |
| THTC | `uthb` | THB | Historical fiat-denominated asset |
| SETC | `usek` | SEK | Historical fiat-denominated asset |
| NOTC | `unok` | NOK | Historical fiat-denominated asset |
| DKTC | `udkk` | DKK | Historical fiat-denominated asset |
| IDTC | `uidr` | IDR | Historical fiat-denominated asset |
| PHTC | `uphp` | PHP | Historical fiat-denominated asset |
| HKTC | `uhkd` | HKD | Historical fiat-denominated asset |
| MYTC | `umyr` | MYR | Historical fiat-denominated asset |
| TWTC | `utwd` | TWD | Historical fiat-denominated asset |

## How market data is displayed

The homepage market widget keeps its market-data logic separate from this documentation. When available, price, 24-hour change, and market capitalization are retrieved from the configured Vyntrex integration. A placeholder is shown when the upstream API does not return a value.

This documentation page intentionally describes the chain denominations only. It does not embed API credentials or duplicate the runtime pricing configuration.

## Use cases

- **Payments:** send and receive supported on-chain denominations.
- **Trading:** use available pairs on exchanges and decentralized markets.
- **Liquidity:** supply assets to compatible pools after reviewing their risks.
- **Application accounting:** display balances in the denomination an application supports.

## Risks and considerations

- A ticker or fiat reference does not guarantee price stability or redemption at face value.
- Liquidity, exchange support, and wallet support differ between assets and can change over time.
- Confirm the exact on-chain denomination before sending funds.
- Review live market data and the destination application before signing a transaction.
- Nothing on this page is financial advice.

## FAQ

### Is LUNC a stablecoin?

No. LUNC is the native Terra Classic asset used for staking, governance, and network fees. It is included alongside the fiat-denominated assets because the homepage market widget presents the network's principal assets together.

### Why can the displayed market fields be empty?

The interface shows placeholders when its configured market-data source has not returned a valid value for that denomination. This keeps missing API data distinct from a real zero price or market capitalization.

### Where should asset metadata be changed?

The homepage asset registry is maintained in `src/data/stablecoins.ts`. The explanatory content on this page is maintained in this Markdown file.
