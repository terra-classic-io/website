All Terra Classic transactions consume gas. Some legacy transaction types also reference historical fees such as Tobin and spread taxes; these are currently disabled on Classic. The table below summarises which fees apply.

| Transaction type | [Gas](#gas) | [Tobin](#tobin-tax) | [Spread](#spread-fee) | Burn tax |
| --- | --- | --- | --- | --- |
| ~~Stablecoin ↔ stablecoin market swap~~ *disabled* | ✓ | ✓ |  |  |
| ~~Stablecoin ↔ LUNC market swap~~ *disabled* | ✓ |  | ✓ |  |
| Wallet-to-wallet transfer | ✓ |  |  | ✓ |

DApps such as DEXes can charge additional protocol fees on top of network fees.

## Gas

[Gas](/docs/learn/glossary#fees) covers validator compute and storage. Validators configure minimum gas prices; transactions must include fees meeting or exceeding that implied price.

Key behaviour on Terra Classic:

- Validators reject transactions with implied gas prices below their configured minimum.
- Most wallets estimate gas above the minimum to avoid underestimation.
- Unused gas is **not** refunded.
- Transactions are processed FIFO within the mempool, not by highest fee.

Current suggested prices are available via [`https://terra-classic-fcd.publicnode.com/v1/txs/gas_prices`](https://terra-classic-fcd.publicnode.com/v1/txs/gas_prices).

Gas fees flow into the distribution module and are paid out to validators and delegators as staking rewards, and fill the Community Pool.

## Burn tax (`x/tax` module)

Terra Classic uses the `x/tax` module to levy burn taxes on transfers.

- Parameters: [`https://terra-classic-lcd.publicnode.com/terra/tax/v1beta1/params`](https://terra-classic-lcd.publicnode.com/terra/tax/v1beta1/params)
- Current burn rate: [`https://terra-classic-lcd.publicnode.com/terra/tax/v1beta1/burn_tax_rate`](https://terra-classic-lcd.publicnode.com/terra/tax/v1beta1/burn_tax_rate)

Reverse-charge (Tax2Gas) rules can deduct tax from the transfer amount or fees depending on the transaction path. Always confirm current governance decisions before relying on a specific behaviour.

### Tax exemption registry

Some addresses are exempt from burn tax. Query the registry via:

- Zones list: [`https://terra-classic-lcd.publicnode.com/terra/taxexemption/v1/zones`](https://terra-classic-lcd.publicnode.com/terra/taxexemption/v1/zones)
- Zone addresses: [`https://terra-classic-lcd.publicnode.com/terra/taxexemption/v1/{zonename}/addresses`](https://terra-classic-lcd.publicnode.com/terra/taxexemption/v1/%7Bzonename%7D/addresses)
- Taxable check: [`https://terra-classic-lcd.publicnode.com/terra/taxexemption/v1/taxable/{from}/{to}`](https://terra-classic-lcd.publicnode.com/terra/taxexemption/v1/taxable/%7Bfrom%7D/%7Bto%7D)

## Tobin tax

The Tobin tax historically applied to swaps between Terra stablecoins. Governance disabled Classic market swaps, so the rate is unused today, but it remains queryable for reference via the oracle module.

Discussed rationale: [“On swap fees: the greedy and the wise”](https://medium.com/terra-money/on-swap-fees-the-greedy-and-the-wise-b967f0c8914e).

When active, Tobin tax revenue flowed into the oracle reward pool and was redistributed to validators who reported accurate exchange rates. See the [oracle module spec](/docs/develop/module-specifications/oracle) for reward mechanics.

## Spread fee

Spread fees applied to swaps between Terra stablecoins and LUNC. While disabled on Classic, the [market module](/docs/develop/module-specifications/market) retains the logic to adjust spread based on pool balances. Historically the minimum spread was 0.5%, increasing during volatility to maintain the [`x*y=k`](/docs/develop/module-specifications/market#market-making-algorithm) invariant.

Like Tobin tax, spread revenue previously funded the oracle reward pool.
