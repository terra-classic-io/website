`x/tax` powers Terra Classic’s burn-tax and gas price floor. It intercepts fee payment, deducts the configured burn rate, and routes proceeds between burn, oracle, and community pools while exposing governance control over rates and gas price suggestions.

## Classic behaviour

- **Reverse-charge context.** The ante handler tags transactions that should pay burn tax. `Keeper.DeductTax()` exits early unless the reverse-charge flag is set, preventing duplicate deductions inside multi-message txs.
- **Burn tax calculation.** `ComputeTax()` multiplies each spend coin by `BurnTaxRate` and truncates to integers. Zero results simply skip deduction.
- **Processing splits.** `ProcessTaxSplits()` fetches Treasury-owned weights (`GetBurnSplitRate`, `GetOracleSplitRate`) and distribution community tax, splitting the collected tax into:
  - Burn portion sent to `treasurytypes.BurnModuleName` for permanent removal.
  - Oracle portion sent to `oracle` module account (funds oracle rewards).
  - Community portion transferred to `distribution` and added to the community pool.
- **Recording proceeds.** The remaining tax (after splits) plus metadata is recorded via `treasuryKeeper.RecordEpochTaxProceeds()` so treasury epoch logic can account for total burns.
- **Gas price floor.** `GetEffectiveGasPrices()` compares the gov-controlled `GasPrices` list with `Ctx.MinGasPrices()` and enforces the max of each denom. RPC operators sometimes set `minimum-gas-prices=0uluna`, so the tax module’s values become the network-wide floor.

## Parameters (`subspace`: `tax`)

| Name | Description | Classic default |
| --- | --- | --- |
| `GasPrices` | Recommended minimum gas prices per denom. | Multiple dec-coins (e.g., `0.028325uluna`, `0.0075uusd`). |
| `BurnTaxRate` | Fraction of each taxable transfer burned (and split downstream). | `0.002500000000000000` (0.25%). |

Governance can update these parameters through `MsgUpdateParams` proposals routed to `x/gov`.

## Queries & CLI

- **Parameters:** `terrad q tax params`
- **Gas price floor:** `terrad q tax gas-prices`
- **Simulate tax:** `terrad q tax estimate <amount>` (custom CLI helper).
- **Update params (gov proposal):** `terrad tx gov submit-proposal tax-update-params ...`
