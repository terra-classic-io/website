> **Note**
>
> `x/authz` ships from the Cosmos SDK with minimal Classic-specific changes. It remains the standard mechanism for delegating message execution to other wallets or bots. Classic integrates it with burn-tax logic when `MsgExec` wraps bank transfers, swaps, or wasm executions.

## Overview

Authorization enables an account (granter) to allow another account (grantee) to execute specific messages on their behalf. The grant can be time-limited and message-scoped. Classic uses authz for:

- Custodial services executing staking, distribution, and governance messages for users.
- dApp operators enabling automated treasury movements while maintaining custody separation.

Internally, the module stores `Grant` objects keyed by `(granter, grantee, msgType)`. Execution via `MsgExec` decrements usage limits (for `SpendLimit` authz) and emits events compatible with Cosmos SDK tooling.

## Classic-specific behaviour

- **Burn tax integration:** When `MsgExec` forwards bank sends, swaps, or wasm fund transfers, the wrapped messages flow through the same burn-tax decorators as direct transactions. See `custom/auth/ante/fee_tax.go` where `MsgExec` is recursively inspected.
- **No custom params:** Terra Classic does not override the Cosmos SDK `x/authz` parameter set and leaves the module without a dedicated param subspace. Governance would manage limits via on-chain upgrades if needed.

## Message types

- **`MsgGrant`** – create or update an authorization (`GenericAuthorization`, `SendAuthorization`, custom staking/gov types). Grants persist until expiration time.
- **`MsgRevoke`** – remove an existing grant for a given message type.
- **`MsgExec`** – execute one or more messages on behalf of the granter. Each embedded message must list the granter as its only signer.

All message types are defined in `cosmos.authz.v1beta1`. Classic accepts the same Protobuf encodings as upstream chains.

## Storage

- `Grant` key: `0x01 | granter | grantee | msgTypeURL`.
- Values track authorization payload plus expiration (block time).
- No additional Classic-specific indexes are introduced.

## Operational notes

- Use `terrad tx authz grant` with `--period` to set an expiry.
- To delegate spend of non-bonded assets, use `--authorization send` with a `--spend-limit` specifying microunits.
- When wrapping multiple messages in `MsgExec`, ensure each is individually authorised; otherwise the entire execution fails atomically.

## Event hooks

`x/authz` emits standard events (`grant`, `revoke`, `exec`). Downstream systems (indexers, analytics) should subscribe to these events for grant bookkeeping.
