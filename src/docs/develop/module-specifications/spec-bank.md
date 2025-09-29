> **Note**
>
> Terra Classic ships a custom wrapper around the Cosmos SDK [`x/bank`](https://docs.cosmos.network/main/modules/bank/) module to integrate burn tax calculation, keep backwards-compatible CLI commands, and support tax exemptions. This document highlights Classic-specific behaviour.

## Overview

`x/bank` maintains account balances and handles token transfers. Classic extends it via `custom/bank` to:

- Register a CLI that understands burn-tax exemptions and supports legacy flags.
- Provide simulation helpers that avoid failing due to tax-induced fee shortages.

The core keeper still comes from the Cosmos SDK, so all standard functionality (`SendCoins`, `BurnCoins`, `SetBalance`) behaves as expected. Tax enforcement happens in the ante-handler (`custom/auth/ante/fee_tax.go`) and message server (`custom/bank/keeper/keeper.go`) rather than inside the bank keeper itself.  

> **Note**
>
> Classic uses a legacy amino encoding for messages.  
> Instead of `cosmos-sdk/MsgSend`, it uses `bank/MsgSend`. It is recommended to use protobuf encoding for new code.

## Message types

### `MsgSend`

Standard single-sender, single-recipient transfer.

- Burn tax: `custom/auth/ante` deducts burn tax before the bank keeper executes the send unless the sender and recipient are exempt via `x/taxexemption`.
- Tax exemption: Addresses listed in `x/taxexemption` bypass burn tax when sending to other exempt addresses.
- Multiple signers: Not supported; use `MsgMultiSend` or authz with multiple `MsgSend`s.

### `MsgMultiSend`

Batch transfer with multiple inputs and outputs.

- All inputs must balance with outputs (`Σ inputs = Σ outputs`).
- Burn tax is applied per input address that is not fully exempt. The ante-handler computes taxes on each input coin set.
- Non-taxable funds (e.g. contract payouts) propagate via the `nonTaxableTaxes` tracking in `FilterMsgAndComputeTax()`.

## Classic integrations

- **Tax module:** `x/tax` consumes bank keeper APIs to move burn-tax proceeds into the fee collector and splits them between burn, oracle rewards, and treasury.
- **Treasury:** `x/treasury` tracks epoch tax proceeds recorded by the tax keeper. Bank transfers supply the raw data.
- **Wasm contracts:** Contract-executed transfers are taxed unless both the sender and contract are exempt.

## Parameters

Subspace: `bank`

| Name | Description | Type | Default |
| --- | --- | --- | --- |
| `DefaultSendEnabled` | Global flag controlling whether new denominations are send-enabled by default. | `bool` | `true` |

Classic no longer uses the per-denom `SendEnabled` list; governance proposals can still toggle `DefaultSendEnabled` if required.

## CLI usage

Classic exposes `terrad tx bank send` and `multisend` with automatic burn-tax handling. Clients only need to specify the desired amount; taxes are deducted from the input coins, reducing the received amount accordingly.

## API queries

`x/bank` keeps the standard gRPC and REST endpoints for:

- Balances (`/cosmos.bank.v1beta1.Query/Balance`)
- Supply (`/cosmos.bank.v1beta1.Query/TotalSupply`)
- Denom metadata and send-enabled flags

These services reflect post-tax balances because taxes are deducted before bank writes occur.
