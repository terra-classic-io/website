> **Note**
>
> Terra Classic keeps the Cosmos SDK distribution module but relies on burn-tax inflows instead of inflation or seigniorage. Rewards are passively accumulated and must be withdrawn by validators and delegators.

## Classic overview

- **Burn-tax inflow.** `custom/auth/ante/fee_tax.go` forwards the burn-tax portion of every transaction to the fee collector. `x/distribution` allocates that balance at end block using the standard global split.
- **Community pool.** `CommunityTax` is set to `0.5`, so the community pool grows with every transaction. Governance or users can still call `MsgFundCommunityPool` to deposit additional funds.
- **Manual withdrawals.** Validators use `MsgWithdrawValidatorCommission`;delegators use `MsgWithdrawDelegatorReward`. Nothing auto-claims.

## Parameters (subspace `distribution`)

| Name | Description | Classic default |
| --- | --- | --- |
| `CommunityTax` | Percentage of collected fees sent to community pool. | `0` |
| `BaseProposerReward` | Fixed proposer reward share. | `0.01` |
| `BonusProposerReward` | Additional proposer reward scaled by participation. | `0.04` |
| `WithdrawAddrEnabled` | Allow custom withdrawal addresses. | `true` |

## Reward flow

1. Fees and burn-tax proceeds accumulate in the fee collector module account.
2. During `EndBlock`, the distribution keeper pays proposer rewards (`base + bonus`).
3. Any configured community tax is transferred to the community pool (no-op on Classic).
4. Remaining coins are recorded in `FeePool` for future delegator withdrawals and oracle ballot rewards.

## Messages used on Classic

- **`MsgSetWithdrawAddress`** — update the account receiving staking rewards.
- **`MsgWithdrawDelegatorReward`** — claim rewards for a specific validator/delegator pair.
- **`MsgWithdrawValidatorCommission`** — withdraw accumulated validator commission.
- **`MsgFundCommunityPool`** — manually deposit funds into the community pool when governance approved spending budgets.

See the upstream Cosmos SDK documentation for full protobuf definitions and CLI usage examples.
