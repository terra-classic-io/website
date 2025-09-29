> **Note**
>
> Terra Classic extends the Cosmos SDK [`x/auth`](https://docs.cosmos.network/main/modules/auth/) module with a custom ante-handler pipeline that integrates burn tax, treasury splits, and wasm fees. This document focuses on Classic-specific behaviour and current defaults.

## Overview

`x/auth` is responsible for account state, signature and sequence checks, fee deduction, and ante-handler orchestration. Classic keeps legacy account types (continuous vesting, periodic vesting, delayed vesting) to preserve historical balances, but no new vesting grants are minted through this module today.

Key behaviours:

- **Custom ante pipeline:** `custom/auth/ante` wires additional decorators that enforce burn tax via the `x/tax` keeper, share fees with treasury, and guard against memo spamming, minimum initial deposits, and IBC flood attacks.
- **Tax integration:** `FilterMsgAndComputeTax()` (see `custom/auth/ante/fee_tax.go`) inspects messages to compute burn taxes using `x/treasury`, `x/tax`, and `x/taxexemption`. Bank transfers, `MsgSwapSend`, and wasm fund movements participate in burn tax unless exempt.
- **Fee distribution:** After fees are charged, decorators split amounts between `fee_collector` and treasury burn module according to `x/treasury` parameters.
- **Account management:** The module still exposes the standard APIs for accounts, sequences, and sign mode handling. Classic uses the proto-based `TxConfig` from Cosmos SDK v0.47.

## Ante flow summary

1. **SetUpContextDecorator** – initialise gas meter with block gas limit.
2. **TxPriorityDecorator** – prioritise oracle vote/prevote traffic to protect consensus-critical messages.
3. **MinimumFeesDecorator** – require `gas_price ≥ min_gas_price` unless the transaction belongs to a burn-tax exempt address list.
4. **TaxFeeDecorator / BurnTaxFeeDecorator** – compute burn tax, collect it via `x/tax`, and forward the residual fee to the fee collector.
5. **ValidateMemoDecorator** – enforce memo length (`MaxMemoCharacters`) and block banned prefixes (anti-phishing memo filters).
6. **SigVerification** – enforce signer and signature cost limits.
7. **Post handler** – Classic also registers a post-handler (`custom/auth/post`) to finalise taxes after execution.

See `custom/auth/ante/handler.go` for the complete decorator chain.

## Accounts and vesting

- Base accounts leverage Cosmos SDK `BaseAccount`.
- Legacy vesting accounts (`DelayedVestingAccount`, `ContinuousVestingAccount`, `PeriodicVestingAccount`) are retained for historical compatibility. The chain does not mint new vesting schedules, but governance can migrate or claw back existing ones via custom proposals.

## Parameters

Subspace: `auth`

| Name | Description | Type | Default |
| --- | --- | --- | --- |
| `MaxMemoCharacters` | Maximum memo length per transaction. Enforced by `ValidateMemoDecorator`. | `uint64` | `256` |
| `TxSigLimit` | Maximum number of signatures permitted on a single tx. Protects ante verification cost. | `uint64` | `7` |
| `TxSizeCostPerByte` | Gas multiplier applied to raw tx byte size. | `uint64` | `10` |
| `SigVerifyCostED25519` | Gas charged per Ed25519 signature verification. | `uint64` | `590` |
| `SigVerifyCostSecp256k1` | Gas charged per secp256k1 signature verification. | `uint64` | `1000` |

`TxSigLimit` differs from the historical Terra limit (100) and remains aligned with Cosmos SDK v0.47 defaults.

## CLI and SDK notes

- Use `terrad tx ... --fees` or `--gas-prices` to satisfy minimum fee requirements; transactions without adequate fees are rejected before message execution.
- Burn tax is deducted automatically; clients should not pre-deduct taxes from send amounts.
