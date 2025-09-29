> **Note**
>
> Terra Classic retains the market module, but on-chain swaps (`MsgSwap`, `MsgSwapSend`) were disabled after May 2022. Users must rely on DEX liquidity pools; the module now maintains only virtual pools and spread state to keep downstream logic stable.

## Classic behaviour

- **Swaps rejected.** Transaction handlers remain wired, yet governance decisions prevent reopening algorithmic swaps to avoid uncontrolled mint/burn of LUNC.
- **Virtual pools maintained.** `EndBlocker()` still invokes `ReplenishPools` to decay `TerraPoolDelta` back to equilibrium, preserving deterministic spread calculations.
- **Oracle reward flow.** Oracle ballot rewards historically depended on swap spreads. Keeping the module intact ensures queries and simulations that expect spread values continue to work, even if no swap executes.

## Parameters (`subspace`: `market`)

| Name | Description | Default |
| --- | --- | --- |
| `BasePool` | Virtual Terra/Luna pool size (µSDR). | `1000000000000` (1,000,000 SDR) |
| `PoolRecoveryPeriod` | Blocks needed for pools to recover toward equilibrium. | `14400` (≈1 day) |
| `MinStabilitySpread` | Minimum spread imposed on swaps. | `0.02` (2%) |

The legacy `TobinTax` parameter used for Terra stablecoin swaps is set to `0` on Classic; tax logic has been moved to `x/tax`.

## Queries and CLI

- **Parameters:** `terrad q market params`
- **Terra pool delta:** `terrad q market terra-pool-delta`

These calls are useful for analytics and backwards compatibility tooling.

## Operational notes

- Attempting `terrad tx market swap` on mainnet will fail because the keeper rejects swaps before coins move. This is due to the internal spread and tobin tax set to 100%.
- Any future plan to re-enable algorithmic swaps would require a dedicated governance proposal, code updates, and careful parameter tuning.
