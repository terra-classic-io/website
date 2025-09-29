> **Note**
>
> `x/dyncomm` is a Terra Classic-specific module that adjusts the minimum commission each validator must charge. It reacts to validator voting power and overall delegation concentration to discourage commission-free strategies that centralise stake under a few validators.

## How it works

- **Dynamic floor.** Every epoch (end block), the module computes a recommended minimum commission based on the StrathCole formula using four parameters: `MaxZero`, `SlopeBase`, `SlopeVpImpact`, and `Cap`.
- **Safety cap.** Even after adjustments, the required commission cannot exceed `Cap` (default 20%).
- **Per-validator tracking.** `keeper.EndBlocker()` scans the staking keeper for all validators and updates the minimum commission values stored in `x/staking`. Validators cannot set a commission below the computed floor.
- **No direct transactions.** The module has no `Msg` server. Parameter updates happen through governance parameter-change proposals targeting the `dyncomm` subspace.

The calculation relies on validator voting power statistics gathered from staking, so it must run after staking updates within the end-block order configured in `app/app.go`.

## Parameters (`subspace`: `dyncomm`)

| Name | Purpose | Default |
| --- | --- | --- |
| `MaxZero` | Voting-power share below which validators may charge 0% commission. | `0.5` |
| `SlopeBase` | Baseline slope in the StrathCole formula. Controls how quickly minimum commission rises. | `2` |
| `SlopeVpImpact` | Multiplier on voting-power impact. Higher values penalise large validators more. | `10` |
| `Cap` | Maximum enforced commission floor. | `0.2` (20%) |

All parameters are decimal values in the SDK `Dec` type. Governance proposals must keep them within validation bounds: `MaxZero` and `Cap` between 0 and 1, `SlopeBase ≥ 0`, `SlopeVpImpact > 0`.

## Genesis and queries

- **Genesis:** `types.DefaultGenesisState()` seeds the parameters above. There is no validator-specific state at genesis.
- **Queries:** `Query/Params` returns the current parameter set. Use `terrad q dyncomm params` to inspect the configuration.

## Operator guidance

- Validators should monitor the module to ensure their commission is never set below the enforced minimum; attempts to lower it will be rejected by staking if below the dynamic floor.
- Parameter adjustments should be coordinated with the staking community, as aggressive settings can increase minimum commission for smaller validators too.
